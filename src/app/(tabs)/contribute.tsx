import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppBar } from '@/components/dashboard-header';
import { Icon } from '@/components/icon';
import { PaymentHolidaySheet, ProofOfPaymentSheet } from '@/components/member-popups';
import { Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useSession } from '@/lib/session';

// The same "Buy shares" page as the website's /app/pay: pick a currency and an amount, see roughly
// how many shares it buys, then pay by bank transfer into the Society's own account with the member
// number as the reference — and send proof once paid. No card payments for shares, as on the website.

type Currency = 'NGN' | 'USD' | 'GBP';

const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'NGN', label: '₦ Naira' },
  { id: 'USD', label: '$ US dollar' },
  { id: 'GBP', label: '£ Pound' },
];
const SYMBOL: Record<Currency, string> = { NGN: '₦', USD: '$', GBP: '£' };
const AMOUNT_CHIPS: Record<Currency, number[]> = {
  NGN: [5_000, 10_000, 20_000, 50_000],
  USD: [30, 60, 120, 300],
  GBP: [25, 50, 100, 250],
};
const SHARE_PRICE_NGN = 1_000; // bye-law 11.1
const MIN_MONTHLY = { ngn: 5_000, gbp: 25 }; // bye-law 11.2
/** Illustration only — real conversions use the bank rate on the day received (bye-law 11.2). */
const EXAMPLE_RATES: Record<Currency, number> = { NGN: 1, USD: 1_500, GBP: 2_000 };

/** Bye-law 14.1: the Society's own accounts. Same values as the website; the client still has to confirm them. */
const SOCIETY_ACCOUNTS: Record<Currency, { bank: string; accountName: string; accountNumber: string; extra: null | { label: string; value: string } }> = {
  NGN: {
    bank: 'United Bank for Africa (UBA) — to be confirmed',
    accountName: 'HomeBridge Cooperative Society Ltd',
    accountNumber: '[UBA naira account number — to be confirmed]',
    extra: null,
  },
  USD: {
    bank: '[Bank — to be confirmed]',
    accountName: 'HomeBridge Cooperative Society Ltd',
    accountNumber: '[USD domiciliary number — to be confirmed]',
    extra: { label: 'SWIFT / BIC', value: '[To be confirmed]' },
  },
  GBP: {
    bank: '[Bank — to be confirmed]',
    accountName: 'HomeBridge Cooperative Society Ltd',
    accountNumber: '[GBP domiciliary number — to be confirmed]',
    extra: { label: 'SWIFT / BIC', value: '[To be confirmed]' },
  },
};

const money = (c: Currency, n: number) =>
  SYMBOL[c] + n.toLocaleString('en-GB', { minimumFractionDigits: c !== 'NGN' && !Number.isInteger(n) ? 2 : 0, maximumFractionDigits: c === 'NGN' ? 0 : 2 });
const naira = (n: number) => money('NGN', n);

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <T size={14} weight="semibold" color={on ? colors.white : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export default function Contribute() {
  const { me } = useSession();
  const home: Currency = me?.contributions?.currency === 'NGN' ? 'NGN' : 'GBP';
  const [currency, setCurrency] = useState<Currency>(home);
  const [chip, setChip] = useState<number | 'other'>(AMOUNT_CHIPS[home][1]);
  const [other, setOther] = useState('');
  const [copied, setCopied] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [holidayOpen, setHolidayOpen] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!me) return null;
  const memberNo = me.membership?.memberNo ?? me.reference;

  const otherNum = Number(other.replace(/,/g, ''));
  const amount = chip === 'other' ? (Number.isFinite(otherNum) && otherNum > 0 ? otherNum : 0) : chip;
  const inNaira = Math.round(amount * EXAMPLE_RATES[currency]);
  const shares = Math.floor(inNaira / SHARE_PRICE_NGN);
  const credit = inNaira - shares * SHARE_PRICE_NGN;
  const min = home === 'NGN' ? { currency: 'NGN' as Currency, amount: MIN_MONTHLY.ngn } : { currency: 'GBP' as Currency, amount: MIN_MONTHLY.gbp };
  const belowMinimum = amount > 0 && inNaira < min.amount * EXAMPLE_RATES[min.currency];
  const acct = SOCIETY_ACCOUNTS[currency];

  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    setChip(AMOUNT_CHIPS[c][1]);
    setOther('');
  };

  const copy = async () => {
    const text = [
      `Bank: ${acct.bank}`,
      `Account name: ${acct.accountName}`,
      `Account number: ${acct.accountNumber}`,
      acct.extra ? `${acct.extra.label}: ${acct.extra.value}` : null,
      `Reference: ${memberNo}`,
    ]
      .filter(Boolean)
      .join('\n');
    await Clipboard.setStringAsync(text);
    setCopied(true);
  };

  const fee = me.country === 'Nigeria' ? '₦10,000' : '£10';
  const recent = me.contributions?.items.slice(0, 5) ?? [];

  return (
    <Screen withTabBar>
      <AppBar />
      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Buy shares
        </T>
        <T size={13} color={colors.inkSoft}>
          Pay from your own bank into HomeBridge’s own account. Always use your member number as the reference — that is how we know it is yours.
        </T>
      </View>

      {/* Currency and amount */}
      <View style={styles.card}>
        <T size={14} weight="semibold">
          I am paying in
        </T>
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {CURRENCIES.map((c) => (
            <Chip key={c.id} label={c.label} on={currency === c.id} onPress={() => pickCurrency(c.id)} />
          ))}
        </View>

        <T size={14} weight="semibold" style={{ marginTop: 8 }}>
          Amount this month
        </T>
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {AMOUNT_CHIPS[currency].map((a) => (
            <Chip key={a} label={money(currency, a)} on={chip === a} onPress={() => setChip(a)} />
          ))}
          <Chip label="Other" on={chip === 'other'} onPress={() => setChip('other')} />
        </View>
        {chip === 'other' ? (
          <View style={styles.otherBox}>
            <T size={16} weight="semibold" color={colors.muted}>
              {SYMBOL[currency]}
            </T>
            <TextInput
              value={other}
              onChangeText={(v) => setOther(v.replace(/[^\d.,]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
              accessibilityLabel={`Other amount (${SYMBOL[currency]})`}
              style={styles.otherInput}
              autoFocus
            />
          </View>
        ) : null}

        <View style={styles.illustrate} accessibilityLiveRegion="polite">
          {amount > 0 ? (
            <>
              <T size={14}>
                About{' '}
                <T size={16} weight="bold" color={colors.green}>
                  {money(currency, amount)} → {shares.toLocaleString('en-GB')} {shares === 1 ? 'share' : 'shares'}
                </T>{' '}
                at {naira(SHARE_PRICE_NGN)} each
                {currency !== 'NGN' ? <T size={14} color={colors.muted}>{` (≈ ${naira(inNaira)})`}</T> : null}
              </T>
              {credit > 0 ? (
                <T size={13}>{naira(credit)} is less than one share, so it’s kept as unallocated credit and carried to your next payment.</T>
              ) : null}
              <T size={12} color={colors.muted}>
                {currency === 'NGN' ? 'Shares are issued once the bank confirms your payment.' : 'Converted to naira at the bank rate on the day received. Example rate only.'}
              </T>
            </>
          ) : (
            <T size={14}>Enter an amount to see roughly how many shares it buys.</T>
          )}
        </View>
        {belowMinimum ? (
          <View style={styles.butter}>
            <T size={13}>
              This is below the {money(min.currency, min.amount)} monthly minimum{home === 'NGN' ? '' : ' for diaspora members'}
              {currency !== min.currency ? ' (at the example rate)' : ''}. That’s fine as a top-up — just make sure the month adds up to at least{' '}
              {money(min.currency, min.amount)} in total.
            </T>
          </View>
        ) : null}
      </View>

      {/* Account details */}
      <View style={styles.green}>
        <T serif size={22} color={colors.white}>
          Pay into this account
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="shield" size={15} color={colors.mintText} strokeWidth={2} />
          <T size={12} color={colors.mintText}>
            Account in the Society’s name · two signatories
          </T>
        </View>
        <View style={{ gap: 12, marginTop: 6 }}>
          {[
            ['Bank', acct.bank],
            ['Account name', acct.accountName],
            ['Account number', acct.accountNumber],
            ...(acct.extra ? [[acct.extra.label, acct.extra.value]] : []),
          ].map(([k, v]) => (
            <View key={k} style={{ gap: 2 }}>
              <T size={11} weight="semibold" color={colors.gold} style={{ letterSpacing: 1.2 }}>
                {k.toUpperCase()}
              </T>
              <T size={15} weight="semibold" color={colors.white} selectable>
                {v}
              </T>
            </View>
          ))}
        </View>

        <View style={styles.refStrip}>
          <T size={11} weight="bold" color={colors.greenDark} style={{ letterSpacing: 1.2 }}>
            YOUR REFERENCE — ALWAYS
          </T>
          <T size={22} weight="bold" color={colors.greenDark} style={{ letterSpacing: 1 }} selectable>
            {memberNo}
          </T>
          <Pressable accessibilityRole="button" onPress={copy} style={styles.copyBtn}>
            <Icon name={copied ? 'check' : 'copy'} size={16} color={colors.white} strokeWidth={2} />
            <T size={14} weight="semibold" color={colors.white}>
              {copied ? 'Copied' : 'Copy details'}
            </T>
          </Pressable>
        </View>
        <T size={12} color={colors.mintText}>
          Never pay in cash or to any person’s account, even if asked. HomeBridge will never message you a different account.
        </T>
      </View>

      {/* Paid already? */}
      <View style={styles.card}>
        <T size={14}>
          <T size={14} weight="semibold" color={colors.green}>
            Paid already?
          </T>{' '}
          Send your receipt and we will match it faster. Shares appear in your payments once the bank confirms, usually within 1 working day.
        </T>
        <Button label="I’ve paid — send proof" height={50} textSize={15} onPress={() => setProofOpen(true)} />
      </View>

      {/* Joining fee */}
      {me.payment ? (
        <View style={styles.card}>
          <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1.4 }}>
            JOINING FEE
          </T>
          <View style={[styles.between, { marginTop: 2 }]}>
            <T size={22} weight="bold">
              {fee}
            </T>
            <View style={[styles.tag, { backgroundColor: me.payment.verified ? colors.mint : colors.cream }]}>
              <T size={11} weight="bold" color={me.payment.verified ? colors.green : colors.goldText}>
                {me.payment.verified ? '✓ PAID' : (me.payment.status || 'Pending').toUpperCase()}
              </T>
            </View>
          </View>
          <T size={13} color={colors.inkSoft}>
            {me.payment.method} · paid to VEKAT Group Ltd (manager){me.payment.verified ? ' · receipt emailed' : ''}. One-off, not a share.
          </T>
        </View>
      ) : null}

      {/* Recent payments */}
      <View style={styles.card}>
        <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1.4 }}>
          RECENT PAYMENTS
        </T>
        {recent.length ? (
          recent.map((c, i) => (
            <View key={c.receiptNo} style={[styles.between, { paddingVertical: 10 }, i < recent.length - 1 && styles.divider]}>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14}>{c.period}</T>
                <T size={12} color={colors.muted}>
                  Paid {c.paidAt} · {c.receiptNo}
                </T>
              </View>
              <T size={14} weight="semibold">
                {c.amount}
              </T>
            </View>
          ))
        ) : (
          <T size={13} color={colors.muted}>
            No payments recorded yet. Your first one appears here once the bank confirms it.
          </T>
        )}
      </View>

      <View style={styles.tip}>
        <T size={15} weight="semibold" color={colors.green}>
          Set it and forget it
        </T>
        <T size={13} color={colors.inkSoft}>
          A monthly standing order from your bank keeps you on track. Use the same account and reference.
        </T>
      </View>

      <Button label="Ask for a payment holiday" variant="mint" height={48} textSize={14} onPress={() => setHolidayOpen(true)} />

      <ProofOfPaymentSheet visible={proofOpen} onClose={() => setProofOpen(false)} currency={currency} amount={amount || undefined} />
      <PaymentHolidaySheet visible={holidayOpen} onClose={() => setHolidayOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.chipBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  otherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    height: 50,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  otherInput: { flex: 1, minWidth: 0, height: 48, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  illustrate: { backgroundColor: colors.mint, borderRadius: 14, padding: 14, gap: 6, marginTop: 4 },
  butter: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.creamBorder, borderRadius: 14, padding: 12 },
  green: { backgroundColor: colors.green, borderRadius: 20, padding: 18, gap: 6 },
  refStrip: { backgroundColor: colors.gold, borderRadius: 14, padding: 14, gap: 4, marginTop: 10, marginBottom: 6 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.ink,
    marginTop: 6,
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tip: { backgroundColor: colors.cream, borderRadius: 18, padding: 16, gap: 4 },
});
