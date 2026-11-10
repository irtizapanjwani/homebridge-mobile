import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/dashboard-header';
import { CheckBadge } from '@/components/icon';
import { ProxySheet } from '@/components/member-popups';
import { Button, Radio, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession, type Me } from '@/lib/session';

// The member's votes — the same motions and rules as the website (one member, one vote; a vote is
// final once cast; a proxy can be given, cancelled until it's used, and a proxy holder votes for the
// members who gave it).

type Choice = 'For' | 'Against' | 'Abstain';
type Motion = NonNullable<Me['motions']>[number];
const CHOICES: Choice[] = ['For', 'Against', 'Abstain'];

function Choices({ value, onChange, disabled }: { value: Choice | null; onChange: (c: Choice) => void; disabled?: boolean }) {
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Your vote">
      {CHOICES.map((c) => {
        const on = c === value;
        const fg = on ? colors.white : colors.green;
        return (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, disabled }}
            disabled={disabled}
            onPress={() => onChange(c)}
            style={[styles.option, on ? { backgroundColor: colors.green, borderColor: colors.green } : { backgroundColor: colors.white, borderColor: colors.line }]}>
            <Radio on={on} color={fg} />
            <T size={15} weight="semibold" color={fg}>
              {c}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

function OpenMotion({ m, n }: { m: Motion; n: number }) {
  const { token, refreshMe } = useSession();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [forMember, setForMember] = useState<Record<string, Choice | null>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [proxyOpen, setProxyOpen] = useState(false);

  const run = async (key: string, path: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError('');
    try {
      await api(path, { token, body });
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <T size={12} weight="semibold" color={colors.goldText}>
          MOTION {n} · OPEN
        </T>
        <T size={18} weight="semibold" style={{ lineHeight: 24 }}>
          {m.title}
        </T>
        {m.details ? (
          <T size={13} color={colors.inkSoft}>
            {m.details}
          </T>
        ) : null}
        <T size={11} color={colors.muted}>
          Your choice is private. Totals appear when voting closes.
        </T>
      </View>

      {m.myVote ? (
        <View style={styles.recorded}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckBadge size={28} />
            <T size={17} weight="semibold" color={colors.white}>
              Your vote is recorded
            </T>
          </View>
          <T size={13} color={colors.mintText}>
            You voted {m.myVote}
            {m.myVoteByProxy ? ` (cast by your proxy ${m.myVoteByProxy})` : ''}. A vote can’t be changed once cast.
          </T>
        </View>
      ) : m.proxyGivenTo ? (
        <View style={styles.note}>
          <T size={14} weight="semibold">
            You gave your proxy to {m.proxyGivenTo}
          </T>
          <T size={13} color={colors.inkSoft}>
            They will vote for you. You can take it back until they vote.
          </T>
          {busy === 'cancel' ? (
            <ActivityIndicator color={colors.green} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <Pressable accessibilityRole="button" onPress={() => run('cancel', '/api/proxy', { motionId: m.id, cancel: true })} hitSlop={6}>
              <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }}>
                Cancel my proxy and vote myself
              </T>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <Choices value={choice} onChange={setChoice} disabled={!!busy} />
          <Button
            label={busy === 'vote' ? 'Saving your vote…' : choice ? `Cast my vote: ${choice}` : 'Choose For, Against or Abstain'}
            variant={choice && !busy ? 'gold' : 'disabled'}
            onPress={() => choice && run('vote', '/api/vote', { motionId: m.id, choice })}
          />
          <Pressable accessibilityRole="button" onPress={() => setProxyOpen(true)} hitSlop={6} style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
            <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }}>
              Can’t vote? Give your proxy to another member
            </T>
          </Pressable>
        </>
      )}

      {m.proxiesHeld?.length ? (
        <View style={styles.note}>
          <T size={14} weight="semibold">
            You hold {m.proxiesHeld.length === 1 ? 'a proxy' : `${m.proxiesHeld.length} proxies`} on this motion
          </T>
          {m.proxiesHeld.map((p) => (
            <View key={p.memberNo} style={{ gap: 8, paddingTop: 6 }}>
              <T size={13} color={colors.inkSoft}>
                For {p.name || 'a member'} ({p.memberNo}){p.voted ? ` · voted ${p.voted}` : ''}
              </T>
              {!p.voted ? (
                <>
                  <Choices value={forMember[p.memberNo] ?? null} onChange={(c) => setForMember({ ...forMember, [p.memberNo]: c })} disabled={!!busy} />
                  <Button
                    label={busy === p.memberNo ? 'Saving…' : `Cast their vote${forMember[p.memberNo] ? `: ${forMember[p.memberNo]}` : ''}`}
                    variant={forMember[p.memberNo] && !busy ? 'primary' : 'disabled'}
                    height={48}
                    onPress={() => {
                      const c = forMember[p.memberNo];
                      if (c) run(p.memberNo, '/api/vote', { motionId: m.id, choice: c, forMemberNo: p.memberNo });
                    }}
                  />
                </>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {error ? (
        <T size={13} color="#9A3B26">
          {error}
        </T>
      ) : null}
      <ProxySheet visible={proxyOpen} onClose={() => setProxyOpen(false)} motionId={m.id} motionTitle={m.title} />
    </View>
  );
}

function ClosedMotion({ m }: { m: Motion }) {
  const r = m.result;
  const total = r ? r.For + r.Against + r.Abstain : 0;
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  return (
    <View style={styles.past}>
      <View style={[styles.between, { alignItems: 'baseline', gap: 10 }]}>
        <T size={13} weight="semibold" style={{ flex: 1 }}>
          {m.title}
        </T>
        {r ? (
          <T size={12} weight="semibold" color={r.outcome === 'Passed' ? colors.green : colors.goldText}>
            {r.outcome}
          </T>
        ) : null}
      </View>
      {r ? (
        <>
          <View style={[styles.bar, { flexDirection: 'row' }]}>
            <View style={{ width: `${pct(r.For)}%`, backgroundColor: colors.green }} />
            <View style={{ width: `${pct(r.Against)}%`, backgroundColor: colors.gold }} />
          </View>
          <T size={11} color={colors.muted}>
            For {r.For} · Against {r.Against} · Abstain {r.Abstain}
            {m.closedAt ? ` · closed ${m.closedAt}` : ''}
            {m.myVote ? ` · you voted ${m.myVote}` : ''}
          </T>
        </>
      ) : null}
    </View>
  );
}

export default function Vote() {
  const { me } = useSession();
  if (!me) return null;
  const motions = me.motions ?? [];
  const open = motions.filter((m) => m.status === 'open');
  const closed = motions.filter((m) => m.status === 'closed');

  return (
    <Screen withTabBar>
      <AppBar />
      <View style={styles.header}>
        <T serif size={26} color={colors.green} style={{ flex: 1 }}>
          Vote
        </T>
        <View style={styles.badge}>
          <T size={12} weight="semibold" color={colors.green}>
            One member, one vote
          </T>
        </View>
      </View>

      {open.length ? (
        open.map((m, i) => <OpenMotion key={m.id} m={m} n={open.length - i} />)
      ) : (
        <View style={styles.card}>
          <T size={15} weight="semibold">
            Nothing to vote on right now
          </T>
          <T size={13} color={colors.inkSoft}>
            When the Board puts a motion to members, it appears here and on your Home screen. We’ll also let you know by email.
          </T>
        </View>
      )}

      {closed.length ? (
        <View style={{ gap: 4 }}>
          <T size={13} weight="semibold" color={colors.muted}>
            Past votes
          </T>
          {closed.map((m) => (
            <ClosedMotion key={m.id} m={m} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  badge: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16, gap: 10 },
  note: { backgroundColor: colors.mint, borderRadius: 14, padding: 14, gap: 6 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  option: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2 },
  recorded: { backgroundColor: colors.green, borderRadius: 18, padding: 18, gap: 8 },
  past: { gap: 6, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
