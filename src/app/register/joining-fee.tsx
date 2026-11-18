import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { DateInput, Field, Input } from '@/components/form';
import { Icon } from '@/components/icon';
import { BANK, ChoiceCard, JOINING_FEE, money, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

function BankRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <View style={styles.bankRow}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={12} color={colors.muted}>
          {label}
        </T>
        <T size={15} weight="semibold" selectable>
          {value}
        </T>
      </View>
      {copy && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Copy ${label}`}
          onPress={async () => {
            await Clipboard.setStringAsync(value);
            setCopied(true);
          }}
          style={styles.copy}>
          <Icon name={copied ? 'check' : 'copy'} size={16} color={colors.green} strokeWidth={2} />
          <T size={13} weight="semibold" color={colors.green}>
            {copied ? 'Copied' : 'Copy'}
          </T>
        </Pressable>
      )}
    </View>
  );
}

/** A random code to match a card payment to this application (not a secret, so Math.random is fine). */
const matchCode = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const STRIPE_PAYMENT_LINK = process.env.EXPO_PUBLIC_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/8x214nbjMdZg2gddNI8IU00';

export default function JoiningFee() {
  const { draft, set } = useRegister();
  const fee = money(draft, JOINING_FEE.gbp, JOINING_FEE.ngn);
  const ngnFee = `₦${JOINING_FEE.ngn.toLocaleString('en-GB')}`;

  const [paying, setPaying] = useState(false);
  const [cardOpened, setCardOpened] = useState(false);

  // Card: the same Stripe payment link as the website, but opened INSIDE the app (a secure Safari /
  // Chrome sheet that slides up over this screen, with Apple Pay and Google Pay). When they close
  // it they are back on this screen, not sent off to the browser. As on the website, the link
  // carries a random code (client_reference_id) so the office can match the payment to them.
  const payByCard = async () => {
    const url = new URL(STRIPE_PAYMENT_LINK);
    url.searchParams.set('client_reference_id', `vekatpay_${matchCode()}`);
    const email = draft.email.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) url.searchParams.set('prefilled_email', email);
    setPaying(true);
    try {
      await WebBrowser.openBrowserAsync(url.toString(), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.green,
        toolbarColor: colors.paper,
        showTitle: true,
        enableBarCollapsing: true,
        dismissButtonStyle: 'done',
      });
    } catch {
      // Opening failed (very rare). They can try again or pay by bank transfer.
    } finally {
      setPaying(false);
      setCardOpened(true);
    }
  };

  // Bank, or card once paid: the date and reference go with the application, and the office
  // confirms the money.
  const next = () => {
    if (draft.payMethod === 'card' && !cardOpened) return void payByCard();
    router.push('/register/check');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={6} title="Joining fee" />

      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Pay your joining fee
        </T>
        <T size={13} color={colors.muted}>
          A one-off fee, paid to {JOINING_FEE.payee}, the cooperative’s appointed manager.
        </T>
      </View>

      <View style={styles.feeCard}>
        <T size={12} color={colors.mintText}>
          Joining fee · one-off
        </T>
        <T size={34} weight="bold" color={colors.white}>
          {fee}
        </T>
        <T size={12} color={colors.mintText}>
          {draft.home ? 'Home member' : 'Diaspora member · £ abroad, ₦ in Nigeria'}
        </T>
      </View>

      <Field label="How will you pay?">
        <View style={{ gap: 10 }}>
          <ChoiceCard
            selected={draft.payMethod === 'card'}
            icon="card"
            title="Card payment"
            sub="Card, Apple Pay or Google Pay through Stripe"
            onPress={() => set({ payMethod: 'card' })}
          />
          <ChoiceCard
            selected={draft.payMethod === 'bank'}
            icon="bank"
            title="Bank transfer (naira)"
            sub={`${BANK.accountName} · ${BANK.name}`}
            onPress={() => set({ payMethod: 'bank' })}
          />
        </View>
      </Field>

      {draft.payMethod === 'bank' && (
        <View style={{ gap: 12 }}>
          <View style={styles.bankCard}>
            <BankRow label="Amount" value={ngnFee} />
            <BankRow label="Bank" value={BANK.name} />
            <BankRow label="Account name" value={BANK.accountName} />
            <BankRow label="Account number" value={BANK.accountNumber} copy />
            <T size={12} color={colors.muted}>
              Use your own name as the payment reference so we can match it to you.
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Date paid (optional)" flex>
              <DateInput value={draft.datePaid} onChangeText={(v) => set({ datePaid: v })} />
            </Field>
            <Field label="Reference (optional)" flex>
              <Input value={draft.payReference} onChangeText={(v) => set({ payReference: v })} placeholder="Transaction ID" autoCapitalize="characters" />
            </Field>
          </View>
        </View>
      )}

      {draft.payMethod === 'card' && !cardOpened && (
        <View style={styles.note}>
          <Icon name="lock" size={18} color={colors.green} strokeWidth={1.8} />
          <T size={12} style={{ flex: 1 }}>
            Stripe’s secure payment page opens right here in the app, with Apple Pay and Google Pay. We never see your card details.
          </T>
        </View>
      )}

      {draft.payMethod === 'card' && cardOpened && (
        <View style={{ gap: 12 }}>
          <View style={styles.bankCard}>
            <T size={14} weight="semibold">
              Finished paying?
            </T>
            <T size={12} color={colors.muted}>
              Add the date and the transaction ID from your Stripe receipt (it’s also in your email). Both are optional — the office checks every
              payment anyway.
            </T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field label="Date paid" flex>
                <DateInput value={draft.datePaid} onChangeText={(v) => set({ datePaid: v })} />
              </Field>
              <Field label="Transaction ID" flex>
                <Input value={draft.payReference} onChangeText={(v) => set({ payReference: v })} placeholder="From your receipt" autoCapitalize="characters" />
              </Field>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={payByCard} hitSlop={6} style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
            <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }}>
              Open the payment page again
            </T>
          </Pressable>
        </View>
      )}

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {paying ? (
          <View style={{ height: 54, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.green} />
          </View>
        ) : (
          <Button
            label={
              draft.payMethod === 'card'
                ? cardOpened
                  ? 'I’ve paid — continue'
                  : `Pay ${fee} by card`
                : draft.payMethod === 'bank'
                  ? 'I’ve paid — continue'
                  : 'Choose how to pay'
            }
            variant={draft.payMethod ? 'primary' : 'disabled'}
            onPress={next}
          />
        )}
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          You get a receipt by email once the office confirms your payment.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feeCard: { backgroundColor: colors.green, borderRadius: 18, padding: 16, gap: 4 },
  bankCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mint,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
});
