import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Logo } from '@/components/logo';
import { Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { activity, member } from '@/data/mock';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const shortcuts: { label: string; icon: IconName; href: '/contribute' | '/projects' | '/vote' | '/profile' }[] = [
  { label: 'Contribute', icon: 'contribute', href: '/contribute' },
  { label: 'Projects', icon: 'projects', href: '/projects' },
  { label: 'Vote', icon: 'vote', href: '/vote' },
  { label: 'Statement', icon: 'statement', href: '/profile' },
];

export default function Home() {
  return (
    <Screen withTabBar contentStyle={{ gap: 16 }}>
      <View style={styles.header}>
        <Logo size={40} />
        <View style={{ flex: 1 }}>
          <T serif size={20} color={colors.green}>
            {greeting()}, {member.firstName}
          </T>
          <T size={12} color={colors.muted}>
            {member.memberId} · {member.type} · {member.city}
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bell}>
          <Icon name="bell" size={22} />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <View style={styles.balance}>
        <View style={styles.between}>
          <View style={{ gap: 2 }}>
            <T size={13} color={colors.mintText}>
              My savings and shares
            </T>
            <T size={32} weight="bold" color={colors.white} style={{ letterSpacing: -0.5 }}>
              {member.balance}
            </T>
          </View>
          <View style={styles.upToDate}>
            <T size={11} weight="semibold" color={colors.goldLight}>
              Up to date
            </T>
          </View>
        </View>
        <View
          style={styles.months}
          accessibilityLabel={`${member.monthsPaid} of ${member.monthsTotal} months paid this year`}>
          {Array.from({ length: member.monthsTotal }).map((_, i) => (
            <View
              key={i}
              style={[styles.month, { backgroundColor: i < member.monthsPaid ? colors.gold : 'rgba(255,255,255,0.18)' }]}
            />
          ))}
        </View>
        <View style={styles.nextRow}>
          <View style={{ flex: 1 }}>
            <T size={12} color={colors.mintText}>
              Next contribution
            </T>
            <T size={15} weight="semibold" color={colors.white}>
              {member.nextDue}
            </T>
          </View>
          <Link href="/contribute" asChild>
            <Pressable style={styles.payNow}>
              <T size={14} weight="semibold">
                Pay now
              </T>
            </Pressable>
          </Link>
        </View>
      </View>

      <Link href="/vote" asChild>
        <Pressable style={styles.voteCard}>
          <View style={styles.voteIcon}>
            <Icon name="vote" size={22} color={colors.ink} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={14} weight="semibold">
              1 vote needs you
            </T>
            <T size={12} color={colors.muted}>
              Head office fit-out, phase 2 · closes Sat 18 Oct
            </T>
          </View>
          <Icon name="chevron" size={18} strokeWidth={2} />
        </Pressable>
      </Link>

      <View style={styles.shortcuts}>
        {shortcuts.map((s) => (
          <Link key={s.label} href={s.href} asChild>
            <Pressable style={styles.shortcut}>
              <View style={styles.shortcutIcon}>
                <Icon name={s.icon} size={24} />
              </View>
              <T size={12} weight="medium">
                {s.label}
              </T>
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={{ gap: 4 }}>
        <View style={[styles.between, { alignItems: 'baseline' }]}>
          <T size={16} weight="semibold">
            Recent activity
          </T>
          <Link href="/profile">
            <T size={13} weight="medium" color={colors.green} style={{ textDecorationLine: 'underline' }}>
              See all
            </T>
          </Link>
        </View>
        {activity.map((a, i) => (
          <View key={a.id} style={[styles.activity, i < activity.length - 1 && styles.divider]}>
            <View style={[styles.activityIcon, { backgroundColor: a.kind === 'vote' ? colors.cream : colors.mint }]}>
              <Icon
                name={a.kind === 'vote' ? 'check' : 'arrowUp'}
                size={18}
                strokeWidth={2}
                color={a.kind === 'vote' ? colors.goldText : colors.green}
              />
            </View>
            <View style={{ flex: 1 }}>
              <T size={14} weight="medium">
                {a.title}
              </T>
              <T size={12} color={colors.muted}>
                {a.detail}
              </T>
            </View>
            <T size={a.kind === 'vote' ? 12 : 14} weight={a.kind === 'vote' ? 'regular' : 'semibold'} color={a.kind === 'vote' ? colors.muted : colors.ink}>
              {a.value}
            </T>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  balance: { backgroundColor: colors.green, borderRadius: 20, padding: 18, gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  upToDate: { backgroundColor: 'rgba(201,162,39,0.22)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  months: { flexDirection: 'row', gap: 4 },
  month: { flex: 1, height: 6, borderRadius: 3 },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: 12,
  },
  payNow: { height: 44, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.gold },
  voteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.creamBorder,
  },
  voteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcuts: { flexDirection: 'row', gap: 10 },
  shortcut: { flex: 1, alignItems: 'center', gap: 6 },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  activityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
