import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Logo } from '@/components/logo';
import { Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

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

const MONTH = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export default function Home() {
  const { me } = useSession();
  if (!me) return null; // the tabs only open once the account has loaded

  const c = me.contributions;
  const now = new Date();
  const year = String(now.getFullYear());
  const thisMonth = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthsSoFar = now.getMonth() + 1;
  // Months of this year with a contribution recorded
  const paidMonths = new Set((c?.items ?? []).map((i) => i.periodKey).filter((k) => k.startsWith(year)));
  const paidThisMonth = paidMonths.has(thisMonth);
  const nextDue = paidThisMonth ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : new Date(now.getFullYear(), now.getMonth(), 7);
  const recent = (c?.items ?? []).slice(0, 4);
  const sub = [me.memberNo, me.memberType.replace(' member', ''), me.city].filter(Boolean).join(' · ');

  return (
    <Screen withTabBar contentStyle={{ gap: 16 }}>
      <View style={styles.header}>
        <Logo size={40} />
        <View style={{ flex: 1 }}>
          <T serif size={20} color={colors.green}>
            {greeting()}{me.firstName ? `, ${me.firstName}` : ''}
          </T>
          <T size={12} color={colors.muted}>
            {sub}
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bell}>
          <Icon name="bell" size={22} />
        </Pressable>
      </View>

      <View style={styles.balance}>
        <View style={styles.between}>
          <View style={{ gap: 2 }}>
            <T size={13} color={colors.mintText}>
              My savings and shares
            </T>
            <T size={c?.totals.length && c.totals.length > 1 ? 24 : 32} weight="bold" color={colors.white} style={{ letterSpacing: -0.5 }}>
              {c?.totals.length ? c.totals.join(' + ') : c?.currency === 'NGN' ? '₦0' : '£0.00'}
            </T>
            {c?.shares ? (
              <T size={12} color={colors.mintText}>
                {c.shares.toLocaleString('en-GB')} shares
              </T>
            ) : null}
          </View>
          <View style={[styles.upToDate, !paidThisMonth && { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <T size={11} weight="semibold" color={paidThisMonth ? colors.goldLight : colors.mintText}>
              {paidThisMonth ? 'Up to date' : 'Due this month'}
            </T>
          </View>
        </View>
        <View
          style={styles.months}
          accessibilityLabel={`${paidMonths.size} of ${monthsSoFar} months paid this year`}>
          {Array.from({ length: monthsSoFar }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.month,
                { backgroundColor: paidMonths.has(`${year}-${String(i + 1).padStart(2, '0')}`) ? colors.gold : 'rgba(255,255,255,0.18)' },
              ]}
            />
          ))}
        </View>
        <View style={styles.nextRow}>
          <View style={{ flex: 1 }}>
            <T size={12} color={colors.mintText}>
              Next contribution
            </T>
            <T size={15} weight="semibold" color={colors.white}>
              {paidThisMonth ? `Due by ${MONTH.format(nextDue)}` : `Due by ${MONTH.format(nextDue)} · this month`}
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
        {recent.length === 0 ? (
          <T size={13} color={colors.muted} style={{ paddingVertical: 10 }}>
            No contributions recorded yet. Each payment shows here with its receipt once it clears.
          </T>
        ) : (
          recent.map((a, i) => (
            <View key={a.receiptNo} style={[styles.activity, i < recent.length - 1 && styles.divider]}>
              <View style={[styles.activityIcon, { backgroundColor: colors.mint }]}>
                <Icon name="arrowUp" size={18} strokeWidth={2} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <T size={14} weight="medium">
                  Contribution · {a.period}
                </T>
                <T size={12} color={colors.muted}>
                  {a.paidAt} · {a.receiptNo}
                </T>
              </View>
              <T size={14} weight="semibold">
                {a.amount}
              </T>
            </View>
          ))
        )}
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
