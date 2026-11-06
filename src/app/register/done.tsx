import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckBadge } from '@/components/icon';
import { Field } from '@/components/form';
import { MIN_MONTHLY, money, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

// TODO: the reference comes back from the website when the application is saved (HBA-YYMM-NNNN).
const DEMO_REFERENCE = 'HBA-2611-0042';

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}>
      <T size={14} weight="semibold" color={on ? colors.white : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

export default function Done() {
  const { draft, set } = useRegister();
  const first = draft.name.trim().split(/\s+/)[0];

  const amounts = draft.home ? [MIN_MONTHLY.ngn, 10_000, 20_000] : [MIN_MONTHLY.gbp, 50, 100];
  const days = [1, 7, 15, 25];
  const nth = (d: number) => (d === 1 ? '1st' : d === 7 ? '7th' : d === 15 ? '15th' : '25th');

  const timeline = [
    { title: 'Application received', sub: `Reference ${DEMO_REFERENCE}`, done: true },
    { title: 'ID and payment check', sub: 'The office checks your ID and joining fee · 1–3 working days', done: false },
    { title: 'Membership number', sub: 'Sent by email and WhatsApp with your certificate and welcome pack', done: false },
  ];

  // TODO: save the chosen monthly amount and day with the application.
  const finish = () => router.replace('/sign-in');

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 18 }}>
      <StepHeader step={4} title="All done" back={false} />

      <View style={styles.hero}>
        <CheckBadge size={56} />
        <T serif size={26} color={colors.green} style={{ textAlign: 'center' }}>
          {first ? `Thank you, ${first}!` : 'Application sent'}
        </T>
        <T size={13} color={colors.muted} style={{ textAlign: 'center' }}>
          Your application is with the HomeBridge office. Keep your reference handy:
        </T>
        <View style={styles.ref}>
          <T size={20} weight="bold" color={colors.green} style={{ letterSpacing: 1 }} selectable>
            {DEMO_REFERENCE}
          </T>
        </View>
      </View>

      <View style={styles.card}>
        <T size={15} weight="semibold">
          What happens next
        </T>
        {timeline.map((t, i) => (
          <View key={t.title} style={styles.tlRow}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.dot, t.done && { backgroundColor: colors.green, borderColor: colors.green }]}>
                <T size={11} weight="bold" color={t.done ? colors.white : colors.muted}>
                  {i + 1}
                </T>
              </View>
              {i < timeline.length - 1 && <View style={styles.tlLine} />}
            </View>
            <View style={{ flex: 1, gap: 2, paddingBottom: 12 }}>
              <T size={14} weight="semibold" color={t.done ? colors.green : colors.ink}>
                {t.title}
              </T>
              <T size={12} color={colors.muted}>
                {t.sub}
              </T>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <T size={16} weight="semibold">
            Set up your monthly contribution
          </T>
          <T size={12} color={colors.muted}>
            Minimum {money(draft, MIN_MONTHLY.gbp, MIN_MONTHLY.ngn)} a month. Starts the month after you’re approved. You can change it later.
          </T>
        </View>
        <Field label="Amount each month">
          <View style={styles.chips}>
            {amounts.map((a) => (
              <Chip key={a} label={money(draft, a, a)} on={draft.monthly === a} onPress={() => set({ monthly: a })} />
            ))}
          </View>
        </Field>
        <Field label="Day I’ll pay">
          <View style={styles.chips}>
            {days.map((d) => (
              <Chip key={d} label={nth(d)} on={draft.payDay === d} onPress={() => set({ payDay: d })} />
            ))}
          </View>
        </Field>
      </View>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        <Button label="Finish" onPress={finish} />
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          You can sign in once your membership number arrives.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8 },
  ref: {
    backgroundColor: colors.mint,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  tlRow: { flexDirection: 'row', gap: 12 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlLine: { width: 2, flex: 1, backgroundColor: colors.lineSoft, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 72,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
});
