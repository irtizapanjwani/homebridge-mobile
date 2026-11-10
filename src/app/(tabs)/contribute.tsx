import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { PaymentHolidaySheet, ProofOfPaymentSheet } from '@/components/member-popups';
import { BackButton, Button, Radio, Screen, T, Toggle } from '@/components/ui';
import { colors } from '@/constants/theme';

type Currency = 'GBP' | 'NGN';

const config = {
  GBP: {
    symbol: '£',
    amounts: [25, 50, 100, 250],
    methods: [
      { name: 'Card, Apple Pay or Google Pay', detail: 'Instant · secured by Stripe' },
      { name: 'UK bank transfer (GBP)', detail: 'To the HomeBridge GBP account · 1 day' },
      { name: 'US dollar transfer (USD)', detail: 'To the HomeBridge USD account · 1–2 days' },
    ],
  },
  NGN: {
    symbol: '₦',
    amounts: [5000, 10000, 25000, 50000],
    methods: [
      { name: 'Bank transfer (₦)', detail: 'To the HomeBridge naira account · instant' },
      { name: 'USSD — no data needed', detail: 'Dial a short code from any phone' },
      { name: 'Debit card (₦)', detail: 'Verve, Mastercard or Visa' },
    ],
  },
};

export default function Contribute() {
  const [cur, setCur] = useState<Currency>('GBP');
  const [amt, setAmt] = useState(0);
  const [method, setMethod] = useState(0);
  const [auto, setAuto] = useState(true);
  const [proofOpen, setProofOpen] = useState(false);
  const [holidayOpen, setHolidayOpen] = useState(false);

  const c = config[cur];
  const fmt = (n: number) => c.symbol + n.toLocaleString('en-GB');
  const switchTo = (next: Currency) => {
    setCur(next);
    setAmt(0);
    setMethod(0);
  };

  return (
    <Screen withTabBar>
      <View style={styles.row}>
        <BackButton />
        <T serif size={24} color={colors.green}>
          Contribute
        </T>
      </View>

      <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel="Pay as">
        {(['GBP', 'NGN'] as Currency[]).map((k) => {
          const on = k === cur;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => switchTo(k)}
              style={[styles.segmentBtn, on && styles.segmentOn]}>
              <T size={14} weight="semibold" color={on ? colors.green : colors.muted}>
                {k === 'GBP' ? 'Diaspora · £ / $' : 'Home · ₦'}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', gap: 2, paddingVertical: 6 }}>
        <T size={12} color={colors.muted}>
          This month’s contribution
        </T>
        <T size={44} weight="bold" color={colors.green} style={{ letterSpacing: -1, lineHeight: 54 }}>
          {fmt(c.amounts[amt])}
        </T>
        <T size={12} color={colors.muted}>
          Minimum {fmt(c.amounts[0])} a month · buys shares in your name
        </T>
      </View>

      <View style={styles.chips}>
        {c.amounts.map((a, i) => {
          const on = i === amt;
          return (
            <Pressable
              key={a}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setAmt(i)}
              style={[styles.chip, on ? styles.chipOn : null]}>
              <T size={14} weight="semibold" color={on ? colors.white : colors.ink}>
                {fmt(a)}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 8 }}>
        <T size={14} weight="semibold">
          Pay with
        </T>
        {c.methods.map((m, i) => {
          const on = i === method;
          return (
            <Pressable
              key={m.name}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setMethod(i)}
              style={[styles.method, { borderColor: on ? colors.green : colors.line }]}>
              <Radio on={on} />
              <View style={{ flex: 1 }}>
                <T size={14} weight="semibold">
                  {m.name}
                </T>
                <T size={12} color={colors.muted}>
                  {m.detail}
                </T>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: auto }}
        onPress={() => setAuto(!auto)}
        style={styles.auto}>
        <View style={{ flex: 1 }}>
          <T size={14} weight="semibold">
            Repeat every month
          </T>
          <T size={12} color={colors.muted}>
            Auto-pay on the 1st · reminder 3 days before
          </T>
        </View>
        <Toggle on={auto} />
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="shield" size={18} strokeWidth={2} />
        <T size={12} color={colors.inkSoft} style={{ flex: 1 }}>
          Paid straight into the cooperative’s own account — never a private account. Receipt by email and WhatsApp.
        </T>
      </View>

      <Button
        label={`Pay ${fmt(c.amounts[amt])}${auto ? ' monthly' : ' now'}`}
        style={{ marginTop: 'auto' }}
      />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="I’ve paid — send proof" variant="mint" height={48} textSize={13} style={{ flex: 1 }} onPress={() => setProofOpen(true)} />
        <Button label="Payment holiday" variant="mint" height={48} textSize={13} style={{ flex: 1 }} onPress={() => setHolidayOpen(true)} />
      </View>

      <ProofOfPaymentSheet visible={proofOpen} onClose={() => setProofOpen(false)} currency={cur} />
      <PaymentHolidaySheet visible={holidayOpen} onClose={() => setHolidayOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segment: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: colors.segment, borderRadius: 14 },
  segmentBtn: { flex: 1, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentOn: {
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.chipBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  method: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  auto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
});
