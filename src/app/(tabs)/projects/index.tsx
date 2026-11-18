import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/dashboard-header';
import { Icon, type IconName } from '@/components/icon';
import { IdeasCard } from '@/components/ideas-card';
import { Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

// The same Projects page as the website's /app/projects: how every ₦100 or £100 is used, the
// businesses being shortlisted (none has passed its checks yet), the five checks, and ideas.

const SPLIT = [
  { pct: 75, label: 'Into approved businesses', sub: 'Released in stages, as each one hits its milestones', color: colors.gold },
  { pct: 15, label: 'Withdrawal reserve', sub: 'Pays members who give notice to withdraw', color: colors.goldLight },
  { pct: 10, label: 'Running costs', sub: 'The most that can go on running the cooperative', color: colors.mintFaint },
];

const PROJECTS: { icon: IconName; tint: string; place: string; title: string; text: string }[] = [
  { icon: 'building', tint: colors.cream, place: 'Benin City, Edo', title: 'Food processing', text: 'Garri, cassava and plantain flour for home and diaspora shops.' },
  { icon: 'shield', tint: colors.mint, place: 'Abuja FCT', title: 'Health services and shops to let', text: 'Diagnostics or pharmacy, plus small shops and offices to let.' },
  { icon: 'trend', tint: colors.cream, place: 'Edo and Abuja', title: 'Solar kits', text: 'Solar kits leased to members’ small businesses in both locations.' },
];

const FIVE_CHECKS = [
  ['Owner’s own money in', 'the local operator puts in 10–20% of the cost.'],
  ['Real customers', 'signed buyers, orders or a working trial.'],
  ['A clear path to profit', 'breaking even within 2 years on a careful plan.'],
  ['Clean papers', 'land, lease and licences checked.'],
  ['Money control', 'bank payments only, with two signatures.'],
];

export default function Projects() {
  const { me } = useSession();
  if (!me) return null;
  const passed = 0; // the Board records the checks; none have passed yet

  return (
    <Screen withTabBar>
      <AppBar />

      <View style={{ gap: 6 }}>
        <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1.4 }}>
          PROJECTS
        </T>
        <T serif size={26} color={colors.green}>
          Where your money goes
        </T>
        <T size={13} color={colors.inkSoft}>
          The first businesses being shortlisted in Edo State and Abuja FCT. No money moves until a project passes all five checks, and you will get a
          report on each one every month.
        </T>
        <Pressable accessibilityRole="button" onPress={() => router.push('/vote')} style={styles.outline}>
          <T size={13} weight="semibold" color={colors.green}>
            Vote on projects
          </T>
          <Icon name="chevron" size={14} strokeWidth={2.2} />
        </Pressable>
      </View>

      {/* How every 100 is used */}
      <View style={styles.green}>
        <View style={styles.goldLine} />
        <T size={11} weight="bold" color={colors.gold} style={{ letterSpacing: 1.4 }}>
          OF EVERY ₦100 OR £100 YOU PUT IN
        </T>
        <View style={styles.bar} accessibilityLabel="75 into businesses, 15 to the withdrawal reserve, 10 to running costs">
          {SPLIT.map((s) => (
            <View key={s.label} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
          ))}
        </View>
        <View style={{ gap: 14 }}>
          {SPLIT.map((s) => (
            <View key={s.label} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <T serif size={28} color={colors.white} style={{ width: 44, lineHeight: 32 }}>
                {s.pct}
              </T>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14} weight="semibold" color={colors.white}>
                  {s.label}
                </T>
                <T size={12} color={colors.mintText}>
                  {s.sub}
                </T>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* The projects */}
      <View style={{ gap: 4, marginTop: 6 }}>
        <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1.4 }}>
          FIRST COHORT
        </T>
        <T serif size={22} color={colors.green}>
          The businesses being shortlisted
        </T>
      </View>
      {PROJECTS.map((p) => (
        <View key={p.title} style={styles.project}>
          <View style={[styles.art, { backgroundColor: p.tint }]}>
            <View style={styles.artIcon}>
              <Icon name={p.icon} size={34} strokeWidth={1.6} />
            </View>
            <View style={styles.badge}>
              <T size={11} weight="semibold" color={colors.green}>
                Shortlisting
              </T>
            </View>
          </View>
          <View style={{ padding: 14, gap: 6 }}>
            <T size={12} color={colors.muted}>
              {p.place}
            </T>
            <T serif size={20} color={colors.green}>
              {p.title}
            </T>
            <T size={13} color={colors.inkSoft}>
              {p.text}
            </T>
            <View style={[styles.between, { marginTop: 6 }]}>
              <T size={12} weight="semibold">
                Five checks
              </T>
              <T size={12} weight="semibold">
                {passed} of 5 passed
              </T>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0, 1, 2, 3, 4].map((n) => (
                <View key={n} style={[styles.step, { backgroundColor: n < passed ? colors.green : colors.line }]} />
              ))}
            </View>
            <View style={styles.reportNote}>
              <T size={12} color={colors.muted}>
                Monthly reports start here once the project is approved.
              </T>
            </View>
          </View>
        </View>
      ))}

      {/* The five checks */}
      <View style={styles.card}>
        <T size={16} weight="semibold">
          Five checks before any money moves
        </T>
        <T size={13} color={colors.inkSoft}>
          The Board signs off each one. Until all five pass, a project gets nothing.
        </T>
        <View style={{ gap: 10, marginTop: 4 }}>
          {FIVE_CHECKS.map(([t, d], i) => (
            <View key={t} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.num}>
                <T size={12} weight="bold" color={colors.green}>
                  {i + 1}
                </T>
              </View>
              <T size={13} style={{ flex: 1 }}>
                <T size={13} weight="semibold">
                  {t}
                </T>{' '}
                — {d}
              </T>
            </View>
          ))}
        </View>
      </View>

      <IdeasCard me={me} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  outline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.green,
    marginTop: 4,
  },
  green: { backgroundColor: colors.green, borderRadius: 20, padding: 18, paddingTop: 22, gap: 14, overflow: 'hidden' },
  goldLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.gold },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.greenDark },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 10 },
  project: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 20, overflow: 'hidden' },
  art: { height: 120, alignItems: 'center', justifyContent: 'center' },
  artIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, height: 6, borderRadius: 3 },
  reportNote: { backgroundColor: colors.paper, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 6 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 6 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
});
