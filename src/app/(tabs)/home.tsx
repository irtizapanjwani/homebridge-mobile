import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CopyButton, HelpCard } from '@/components/applicant';
import { DashboardHeader } from '@/components/dashboard-header';
import { Icon, type IconName } from '@/components/icon';
import { Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession, type Me } from '@/lib/session';

// The member dashboard — the same sections, in the same order, as the website's /app page for
// approved members: welcome + membership card, four figures, forms, contributions, votes, ideas,
// next meeting (with a popup until they reply), HomeBridge at a glance, help, and their record.

const WEBSITE = 'https://homebridge-two.vercel.app';

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.between}>
      <T size={16} weight="semibold" style={{ flexShrink: 1 }}>
        {children}
      </T>
      {action}
    </View>
  );
}

function SmallButton({ label, onPress, primary, disabled }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.smallBtn, primary && styles.smallBtnPrimary, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}>
      <T size={14} weight="semibold" color={primary ? colors.white : colors.green}>
        {label}
      </T>
    </Pressable>
  );
}

// ---------- Membership card ----------

function MembershipCard({ me }: { me: Me }) {
  const m = me.membership!;
  return (
    <View>
      <View style={styles.cardBackdrop} />
      <View style={styles.memberCard}>
        <View style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={14} color={colors.goldLight} strokeWidth={3} />
            <T size={11} weight="semibold" color={colors.goldLight} style={{ letterSpacing: 1 }}>
              MEMBERSHIP CARD
            </T>
          </View>
          <CopyButton value={m.memberNo} />
        </View>
        <T size={24} weight="bold" color={colors.white} selectable style={{ letterSpacing: 1 }}>
          {m.memberNo}
        </T>
        <T size={12} color={colors.mintText}>
          Quote it on every payment, form and enquiry.
        </T>
        <View style={styles.cardGrid}>
          {[
            ['Category', me.memberType],
            ['Chapter', me.chapter],
            ['Admitted', m.admittedAt],
            ['Member since', m.since],
          ].map(([k, v]) => (
            <View key={k} style={{ width: '50%', paddingRight: 8, paddingTop: 10 }}>
              <T size={11} color={colors.mintText}>
                {k}
              </T>
              <T size={13} weight="semibold" color={colors.white}>
                {v || '—'}
              </T>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------- Figures ----------

function Stats({ me }: { me: Me }) {
  const c = me.contributions;
  const openVotes = me.motions?.filter((m) => m.status === 'open').length ?? 0;
  const days = me.meeting ? me.meeting.daysLeft : null;
  const stats: { value: string; label: string }[] = [
    { value: c?.totals.length ? c.totals.join(' + ') : c?.currency === 'NGN' ? '₦0' : '£0', label: 'Total contributed' },
    { value: (c?.shares ?? 0).toLocaleString('en-GB'), label: c?.shares === 1 ? 'Share owned' : 'Shares owned' },
    { value: days === null ? '—' : days === 0 ? 'Today' : `${days} days`, label: days === null ? 'No meeting called' : 'Until the next meeting' },
    { value: String(openVotes), label: openVotes === 1 ? 'Vote open now' : 'Votes open now' },
  ];
  return (
    <View style={styles.stats}>
      {stats.map((s) => (
        <View key={s.label} style={styles.stat}>
          <T serif size={22} color={colors.goldText} numberOfLines={1} adjustsFontSizeToFit>
            {s.value}
          </T>
          <T size={12} color={colors.muted}>
            {s.label}
          </T>
        </View>
      ))}
    </View>
  );
}

// ---------- Forms ----------

function FormsCard({ me }: { me: Me }) {
  const f = me.forms;
  if (!f || (f.declarationSignedAt && f.nomineeSignedAt)) return null;
  const rows = [
    { label: 'Member Declaration Form', signed: f.declarationSignedAt },
    { label: 'Nominee (Next of Kin) Form', signed: f.nomineeSignedAt },
  ];
  return (
    <Card style={{ borderColor: colors.gold, gap: 10 }}>
      <CardTitle>Your membership forms</CardTitle>
      <T size={13} color={colors.inkSoft}>
        Please sign your forms by {f.dueBy}. You can do it online — no printing needed.
      </T>
      {rows.map((r) => (
        <View key={r.label} style={styles.formRow}>
          <Icon name={r.signed ? 'check' : 'doc'} size={18} color={r.signed ? colors.green : colors.goldText} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <T size={14} weight="semibold">
              {r.label}
            </T>
            <T size={12} color={colors.muted}>
              {r.signed ? `Signed ${r.signed}` : 'Not signed yet'}
            </T>
          </View>
        </View>
      ))}
      {/* Signing uses the website's signature pad. */}
      <SmallButton label="Sign on the website" primary onPress={() => Linking.openURL(`${WEBSITE}/app`)} />
    </Card>
  );
}

// ---------- Contributions ----------

function ContributionsCard({ me }: { me: Me }) {
  const c = me.contributions;
  if (!c) return null;
  const recent = c.items.slice(0, 3);
  return (
    <Card style={{ gap: 4 }}>
      <CardTitle action={<SmallButton label="Pay now" primary onPress={() => router.push('/contribute')} />}>
        Your contributions
      </CardTitle>
      <T size={13} color={colors.muted}>
        {c.totals.length ? c.totals.join(' + ') : 'Nothing yet'} · {c.shares.toLocaleString('en-GB')} shares
      </T>
      {recent.length === 0 ? (
        <T size={13} color={colors.inkSoft} style={{ paddingTop: 8 }}>
          No contributions recorded yet. Pay into the cooperative’s account using your membership number as the reference. Each payment
          appears here with its receipt once it clears.
        </T>
      ) : (
        recent.map((i, n) => (
          <View key={i.receiptNo} style={[styles.receipt, n < recent.length - 1 && styles.divider]}>
            <View style={styles.receiptIcon}>
              <Icon name="arrowUp" size={16} color={colors.green} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={14} weight="semibold">
                {i.amount}{' '}
                <T size={13} color={colors.muted}>
                  for {i.period}
                </T>
              </T>
              <T size={12} color={colors.muted}>
                Received {i.paidAt} · {i.receiptNo}
              </T>
            </View>
          </View>
        ))
      )}
      {c.items.length > 3 ? (
        <Pressable accessibilityRole="link" onPress={() => router.push('/profile')} style={{ paddingTop: 6 }}>
          <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }}>
            See all {c.items.length} receipts
          </T>
        </Pressable>
      ) : null}
    </Card>
  );
}

// ---------- Votes ----------

function VotesCard({ me }: { me: Me }) {
  const { token, refreshMe } = useSession();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  if (!me.motions?.length) return null;

  const vote = async (motionId: string, choice: 'For' | 'Against' | 'Abstain') => {
    setBusy(motionId + choice);
    setError('');
    try {
      await api('/api/vote', { token, body: { motionId, choice } });
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your vote could not be saved.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Card style={{ gap: 12 }}>
      <CardTitle>Votes</CardTitle>
      {me.motions.map((m) => (
        <View key={m.id} style={styles.motion}>
          <View style={styles.between}>
            <T size={14} weight="semibold" style={{ flex: 1 }}>
              {m.title}
            </T>
            <View style={[styles.tag, m.status === 'open' ? { backgroundColor: colors.goldLight } : { backgroundColor: colors.lineSoft }]}>
              <T size={11} weight="semibold" color={colors.ink}>
                {m.status === 'open' ? 'Open' : 'Closed'}
              </T>
            </View>
          </View>
          {m.details ? (
            <T size={13} color={colors.inkSoft}>
              {m.details}
            </T>
          ) : null}
          {m.status === 'open' ? (
            m.myVote ? (
              <T size={13} weight="semibold" color={colors.green}>
                ✓ You voted {m.myVote}
                {m.myVoteByProxy ? ` (by your proxy ${m.myVoteByProxy})` : ''}
              </T>
            ) : m.proxyGivenTo ? (
              <T size={13} color={colors.muted}>
                You gave your proxy to {m.proxyGivenTo}. They will vote for you.
              </T>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['For', 'Against', 'Abstain'] as const).map((c) => (
                  <View key={c} style={{ flex: 1 }}>
                    {busy === m.id + c ? (
                      <ActivityIndicator color={colors.green} style={{ height: 44 }} />
                    ) : (
                      <SmallButton label={c} primary={c === 'For'} disabled={!!busy} onPress={() => vote(m.id, c)} />
                    )}
                  </View>
                ))}
              </View>
            )
          ) : m.result ? (
            <T size={13} color={colors.inkSoft}>
              <T size={13} weight="semibold">
                {m.result.outcome}
              </T>{' '}
              · For {m.result.For} · Against {m.result.Against} · Abstain {m.result.Abstain}
              {m.myVote ? ` · You voted ${m.myVote}` : ''}
            </T>
          ) : null}
        </View>
      ))}
      {error ? (
        <T size={13} color="#9A3B26">
          {error}
        </T>
      ) : null}
      <T size={12} color={colors.muted}>
        One member, one vote. Can’t vote? You can give your proxy to another member on the website.
      </T>
    </Card>
  );
}

// ---------- Ideas ----------

function IdeasCard({ me }: { me: Me }) {
  const { token, refreshMe } = useSession();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!me.ideas) return null;

  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/ideas', { token, body: { text } });
      setText('');
      setMsg({ ok: true, text: 'Thank you — your idea has been sent to the board.' });
      await refreshMe();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Your idea could not be sent.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 10 }}>
      <CardTitle>Share an idea</CardTitle>
      <T size={13} color={colors.inkSoft}>
        A project, an improvement, a question for the board. Every idea is read.
      </T>
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.slice(0, 2000))}
        multiline
        placeholder="Your idea"
        placeholderTextColor={colors.muted}
        style={styles.ideaInput}
        accessibilityLabel="Your idea"
      />
      {busy ? (
        <ActivityIndicator color={colors.green} style={{ height: 44 }} />
      ) : (
        <SmallButton label="Send idea" primary disabled={text.trim().length < 5} onPress={send} />
      )}
      {msg ? (
        <T size={13} color={msg.ok ? colors.green : '#9A3B26'}>
          {msg.text}
        </T>
      ) : null}
      {me.ideas.length ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <T size={13} weight="semibold">
            Your ideas
          </T>
          {me.ideas.map((i) => (
            <View key={i.id} style={styles.idea}>
              <T size={13}>{i.text}</T>
              <T size={12} color={colors.muted}>
                {i.at} · {i.status}
              </T>
              {i.reply ? (
                <T size={12} color={colors.green}>
                  Reply: {i.reply}
                </T>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

// ---------- Meeting (+ popup) ----------

let popupDismissedFor = ''; // closed with X: don't show again for this meeting until the app restarts

function MeetingBody({ me, roomForClose }: { me: Me; roomForClose?: boolean }) {
  const { token, refreshMe } = useSession();
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState('');
  const mt = me.meeting!;
  const d = /(\d{1,2})\s+([A-Za-z]+)/.exec(mt.when);
  const soon = mt.daysLeft === 0 ? 'Today' : mt.daysLeft === 1 ? 'Tomorrow' : `In ${mt.daysLeft} days`;

  const reply = async (answer: 'yes' | 'no') => {
    setBusy(answer);
    setError('');
    try {
      await api('/api/agm', { token, body: { answer } });
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your reply could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={[{ flexDirection: 'row', gap: 12 }, roomForClose && { paddingRight: 36 }]}>
        {d ? (
          <View style={styles.dateTile}>
            <View style={styles.dateTop}>
              <T size={10} weight="semibold" color={colors.goldLight} style={{ letterSpacing: 1 }}>
                {d[2].slice(0, 3).toUpperCase()}
              </T>
            </View>
            <T serif size={24} color={colors.green} style={{ textAlign: 'center', paddingVertical: 4 }}>
              {d[1]}
            </T>
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1 }}>
            NEXT MEETING · {soon.toUpperCase()}
          </T>
          <T size={16} weight="semibold">
            Annual General Meeting
          </T>
          <T size={13} color={colors.inkSoft}>
            {mt.when}
          </T>
          <T size={13} color={colors.muted}>
            {mt.place}
          </T>
        </View>
      </View>
      {mt.agenda.length ? (
        <View style={{ gap: 6 }}>
          <T size={11} weight="semibold" color={colors.muted} style={{ letterSpacing: 1 }}>
            AGENDA
          </T>
          {mt.agenda.map((a, i) => (
            <View key={i} style={styles.agenda}>
              <View style={styles.agendaNum}>
                <T size={11} weight="semibold" color={colors.white}>
                  {i + 1}
                </T>
              </View>
              <T size={13} style={{ flex: 1 }}>
                {a}
              </T>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 10 }}>
        {mt.answer ? (
          <T size={13}>
            <T size={13} weight="semibold">
              {mt.answer === 'yes' ? 'Thank you. You said you will attend.' : 'Thank you for letting us know you can’t attend.'}
            </T>{' '}
            {mt.answer === 'yes' ? 'We look forward to seeing you.' : 'You can still vote online on any open motion.'}
          </T>
        ) : (
          <T size={14} weight="semibold">
            Will you attend?
          </T>
        )}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['yes', 'no'] as const).map((a) => (
            <View key={a} style={{ flex: 1 }}>
              {busy === a ? (
                <ActivityIndicator color={colors.green} style={{ height: 44 }} />
              ) : (
                <SmallButton
                  label={`${mt.answer === a ? '✓ ' : ''}${a === 'yes' ? 'I will attend' : 'I can’t attend'}`}
                  primary={mt.answer === a}
                  disabled={!!busy}
                  onPress={() => reply(a)}
                />
              )}
            </View>
          ))}
        </View>
        {mt.answer ? (
          <T size={12} color={colors.muted}>
            You can change your answer at any time before the meeting.
          </T>
        ) : null}
        {error ? (
          <T size={13} color="#9A3B26">
            {error}
          </T>
        ) : null}
      </View>
    </View>
  );
}

function MeetingCard({ me }: { me: Me }) {
  const key = me.meeting ? `${me.meeting.date}|${me.reference}` : '';
  const [open, setOpen] = useState(() => !!me.meeting && me.meeting.answer === null && popupDismissedFor !== key);
  if (!me.meeting) return null;
  const close = () => {
    popupDismissedFor = key;
    setOpen(false);
  };
  return (
    <>
      <Card>
        <MeetingBody me={me} />
      </Card>
      {/* Pops up when the dashboard opens until the member says whether they'll come. */}
      <Modal visible={open && me.meeting.answer === null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
          <Pressable style={styles.popup} onPress={() => {}}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close} hitSlop={8}>
              <T size={20} color={colors.green}>
                ✕
              </T>
            </Pressable>
            <MeetingBody me={me} roomForClose />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------- At a glance ----------

function GlanceCard({ me }: { me: Me }) {
  const g = me.glance;
  if (!g) return null;
  return (
    <Card style={{ gap: 10 }}>
      <CardTitle>HomeBridge at a glance</CardTitle>
      <View style={styles.glanceBox}>
        <T size={11} color={colors.muted}>
          Funds held
        </T>
        <T size={18} weight="semibold" color={colors.green}>
          {g.funds.length ? g.funds.join('  +  ') : '—'}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          ['Members', g.members.toLocaleString('en-GB')],
          ['Up to date this month', g.percentUpToDate === null ? '—' : `${g.percentUpToDate}%`],
        ].map(([k, v]) => (
          <View key={k} style={styles.glanceBox}>
            <T size={11} color={colors.muted}>
              {k}
            </T>
            <T size={15} weight="semibold" color={colors.green}>
              {v}
            </T>
          </View>
        ))}
      </View>
      {g.zones.map((z) => (
        <View key={z.zone} style={[styles.between, styles.divider, { paddingVertical: 6 }]}>
          <T size={13}>{z.zone}</T>
          <T size={12} color={colors.muted}>
            {z.members} members{z.percentUpToDate === null ? '' : ` · ${z.percentUpToDate}% up to date`}
          </T>
        </View>
      ))}
      <T size={11} color={colors.muted}>
        As of {g.asOf}. No member’s name or payments are ever shown here.
      </T>
    </Card>
  );
}

// ---------- Screen ----------

export default function Home() {
  const { me } = useSession();
  if (!me || !me.membership) return null; // the tabs only open once a member's account has loaded

  const links: { label: string; sub: string; icon: IconName; go: () => void }[] = [
    { label: 'My account', sub: 'Details, documents and joining fee', icon: 'profile', go: () => router.push('/account') },
  ];

  return (
    <Screen withTabBar contentStyle={{ gap: 14 }}>
      <DashboardHeader
        firstName={me.firstName}
        initials={me.initials}
        avatarLabel="Open my profile"
        onAvatar={() => router.push('/profile')}
      />

      <MembershipCard me={me} />
      <Stats me={me} />
      <FormsCard me={me} />
      <ContributionsCard me={me} />
      <VotesCard me={me} />
      <MeetingCard me={me} />
      <IdeasCard me={me} />
      <GlanceCard me={me} />

      <Card style={{ paddingVertical: 4 }}>
        {links.map((l) => (
          <Pressable key={l.label} accessibilityRole="button" onPress={l.go} style={styles.link}>
            <View style={styles.linkIcon}>
              <Icon name={l.icon} size={18} color={colors.green} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={14} weight="semibold">
                {l.label}
              </T>
              <T size={12} color={colors.muted}>
                {l.sub}
              </T>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} strokeWidth={2} />
          </Pressable>
        ))}
      </Card>

      <HelpCard member />

      <View style={styles.safety}>
        <Icon name="lock" size={16} color={colors.green} strokeWidth={1.8} />
        <T size={12} color={colors.inkSoft} style={{ flex: 1 }}>
          Nobody from HomeBridge will ever ask you for your password, your BVN or your bank PIN. Pay share money only into the cooperative’s own
          account.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  cardBackdrop: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -4,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: 'rgba(201,162,39,0.28)',
    transform: [{ rotate: '1.5deg' }],
  },
  memberCard: { backgroundColor: colors.green, borderRadius: 20, padding: 18, gap: 6 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: 'rgba(247,240,218,0.18)', marginTop: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, gap: 2 },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  smallBtn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.green,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnPrimary: { backgroundColor: colors.green },
  receipt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  receiptIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  motion: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 8 },
  tag: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  ideaInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
  },
  idea: { backgroundColor: colors.paper, borderRadius: 10, padding: 10, gap: 2 },
  dateTile: { width: 58, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', backgroundColor: colors.white },
  dateTop: { backgroundColor: colors.green, paddingVertical: 3, alignItems: 'center' },
  agenda: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cream, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  agendaNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,51,34,0.6)', justifyContent: 'center', padding: 16 },
  popup: { backgroundColor: colors.white, borderRadius: 22, padding: 18, maxWidth: 480, width: '100%', alignSelf: 'center' },
  close: { position: 'absolute', top: 10, right: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  glanceBox: { flex: 1, backgroundColor: colors.mint, borderRadius: 12, padding: 10, gap: 2 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  safety: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: colors.mint, borderRadius: 12 },
});
