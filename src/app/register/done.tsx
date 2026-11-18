import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CheckBadge, Icon } from '@/components/icon';
import { MIN_MONTHLY, money, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { homeFor, useSession } from '@/lib/session';
import { colors } from '@/constants/theme';

export default function Done() {
  const { draft } = useRegister();
  const { token, me } = useSession();
  const reference = draft.reference || me?.reference || '';
  const first = draft.name.trim().split(/\s+/)[0];


  const timeline = [
    { title: 'Application received', sub: `Reference ${reference}`, done: true },
    { title: 'ID and payment check', sub: 'The office checks your ID and joining fee · 1–3 working days', done: false },
    { title: 'Membership number', sub: 'Sent by email and WhatsApp with your certificate and welcome pack', done: false },
  ];

  // Signed in after sending, so Finish opens their applicant dashboard.
  const finish = () => router.replace(token ? homeFor(me) : '/sign-in');

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 18 }}>
      <StepHeader step={7} title="Application sent" back={false} />

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
            {reference}
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

      {/* As on the website: the monthly minimum, for information. Nothing to choose or save here —
          once approved, members pay by bank transfer from the Contribute tab. */}
      <View style={styles.monthly}>
        <View style={styles.monthlyIcon}>
          <Icon name="contribute" size={20} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={12} color={colors.muted}>
            Monthly shares from
          </T>
          <T size={18} weight="bold" color={colors.green}>
            {money(draft, MIN_MONTHLY.gbp, MIN_MONTHLY.ngn)} a month
          </T>
          <T size={12} color={colors.inkSoft}>
            Starts the month after you’re approved. You pay by bank transfer from the Contribute tab, using your membership number as the reference.
          </T>
        </View>
      </View>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        <Button label="Finish" onPress={finish} />
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          {token ? 'You can follow your application from your dashboard.' : 'Sign in with your email or phone and password to follow your application.'}
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthly: { flexDirection: 'row', gap: 12, backgroundColor: colors.cream, borderRadius: 16, padding: 14 },
  monthlyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
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
});
