import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card, CopyButton, docsOf, ErrorBox, HelpCard, OFFICE_WHATSAPP, OPEN_STATUSES, stagesFor } from '@/components/applicant';
import { DashboardHeader } from '@/components/dashboard-header';
import { Icon, type IconName } from '@/components/icon';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession, type Me } from '@/lib/session';
import { Linking } from 'react-native';

/** One clear next step, with a button when there's something to do. */
function nextStep(me: Me): { title: string; text: string; tone: 'act' | 'wait' | 'stop'; action?: { label: string; go: () => void } } {
  const { hasId, hasAddress } = docsOf(me);
  const open = OPEN_STATUSES.includes(me.status);
  if (me.status === 'Declined') {
    return {
      tone: 'stop',
      title: 'We couldn’t approve your application',
      text: 'We have emailed you the reason. You can ask the next general meeting to review it, or message the office.',
      action: { label: 'Message the office', go: () => Linking.openURL(OFFICE_WHATSAPP) },
    };
  }
  if (me.infoRequest) {
    return {
      tone: 'act',
      title: 'The office needs something from you',
      text: `Please reply by ${me.infoRequest.by}.`,
      action: { label: 'Reply now', go: () => router.push('/applicant/reply') },
    };
  }
  if (open && (!hasId || !hasAddress)) {
    const what = !hasId && !hasAddress ? 'your ID and proof of address' : !hasId ? 'a photo of your ID' : 'your proof of address';
    return {
      tone: 'act',
      title: `Upload ${what}`,
      text: 'We can’t start checking your application until we have both documents. A clear phone photo is fine.',
      action: { label: 'Upload now', go: () => router.push('/applicant/documents') },
    };
  }
  if (!me.payment) {
    return {
      tone: 'act',
      title: 'Pay your joining fee',
      text: 'We haven’t got a record of your joining fee yet. Message the office and we’ll send you the payment details.',
      action: { label: 'Message the office', go: () => Linking.openURL(OFFICE_WHATSAPP) },
    };
  }
  if (!me.payment.verified) {
    return {
      tone: 'wait',
      title: 'Nothing for you to do right now',
      text: 'We’re checking your joining fee and an officer is reviewing your documents. We aim to decide within 2 working days.',
    };
  }
  return {
    tone: 'wait',
    title: 'Nothing for you to do right now',
    text: 'Your fee is verified and your documents are in. A membership officer is making the decision — usually within 2 working days.',
  };
}

function Tile({ icon, label, value, good, onPress }: { icon: IconName; label: string; value: string; good: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={[styles.tile]}>
      <View style={[styles.tileIcon, { backgroundColor: good ? colors.mint : colors.cream }]}>
        <Icon name={good ? 'check' : icon} size={18} color={good ? colors.green : colors.goldText} strokeWidth={2} />
      </View>
      <T size={12} color={colors.muted}>
        {label}
      </T>
      <T size={14} weight="semibold">
        {value}
      </T>
    </Pressable>
  );
}

export default function ApplicantDashboard() {
  const { me, meError, refreshMe, signOut } = useSession();

  // Fresh data whenever the dashboard comes back into view (after an upload or reply).
  useFocusEffect(
    useCallback(() => {
      refreshMe();
    }, [refreshMe]),
  );

  if (!me) {
    return (
      <Screen contentStyle={{ justifyContent: 'center', alignItems: 'center' }}>
        {meError ? <ErrorBox text={meError} /> : <ActivityIndicator color={colors.green} />}
        {meError ? <Button label="Try again" variant="outline" onPress={refreshMe} /> : null}
      </Screen>
    );
  }

  const stages = stagesFor(me);
  const done = stages.filter((s) => s.state === 'done').length;
  const step = nextStep(me);
  const { count } = docsOf(me);
  const statusTone = me.status === 'Approved' ? colors.gold : me.status === 'Declined' ? '#F3D9CF' : colors.goldLight;

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <DashboardHeader
        firstName={me.firstName}
        initials={me.initials}
        avatarLabel="Open my application"
        onAvatar={() => router.push('/applicant/application')}
      />

      {/* Reference + status */}
      <View style={styles.refCard}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={12} color={colors.mintText}>
            Application reference
          </T>
          <T size={20} weight="bold" color={colors.white} selectable style={{ letterSpacing: 1 }}>
            {me.reference}
          </T>
          <View style={[styles.status, { backgroundColor: statusTone }]}>
            <T size={12} weight="semibold" color={colors.ink}>
              {me.supporter ? 'Supporter' : me.status}
            </T>
          </View>
        </View>
        <CopyButton value={me.reference} />
      </View>

      {/* Next step */}
      <View
        style={[
          styles.next,
          step.tone === 'act' && { backgroundColor: colors.cream, borderColor: colors.gold },
          step.tone === 'stop' && { backgroundColor: '#FDF1EC', borderColor: '#F0D3C7' },
        ]}>
        <T size={11} weight="semibold" color={colors.muted} style={{ letterSpacing: 1 }}>
          YOUR NEXT STEP
        </T>
        <T size={17} weight="semibold">
          {step.title}
        </T>
        <T size={13} color={colors.inkSoft}>
          {step.text}
        </T>
        {step.action ? <Button label={step.action.label} onPress={step.action.go} height={48} textSize={15} style={{ marginTop: 4 }} /> : null}
      </View>

      {me.infoRepliedAt && me.status === 'In review' ? (
        <Card style={{ backgroundColor: colors.mint, borderColor: colors.mint, flexDirection: 'row', gap: 10 }}>
          <Icon name="check" size={18} color={colors.green} strokeWidth={2.6} />
          <T size={13} style={{ flex: 1 }}>
            We received your reply on {me.infoRepliedAt}. An officer will look at it and let you know.
          </T>
        </Card>
      ) : null}

      {/* Progress */}
      <Card style={{ gap: 10 }}>
        <View style={styles.between}>
          <T serif size={20} color={colors.green}>
            Your progress
          </T>
          <View style={styles.count}>
            <T size={12} weight="semibold" color={colors.green}>
              {done} of {stages.length} done
            </T>
          </View>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(done / stages.length) * 100}%` }]} />
        </View>
        {stages.map((s, i) => (
          <View
            key={s.label}
            style={[styles.stage, s.state === 'current' && styles.stageCurrent, s.state === 'stopped' && { backgroundColor: '#FDF1EC' }]}
            accessibilityLabel={`${s.label}: ${s.detail} (${s.state === 'done' ? 'done' : s.state === 'current' ? 'in progress' : s.state === 'stopped' ? 'stopped' : 'to come'})`}>
            <View
              style={[
                styles.dot,
                s.state === 'done' && { backgroundColor: colors.green, borderColor: colors.green },
                s.state === 'current' && { backgroundColor: colors.gold, borderColor: colors.gold },
                s.state === 'stopped' && { backgroundColor: '#9A3B26', borderColor: '#9A3B26' },
              ]}>
              {s.state === 'done' ? (
                <Icon name="check" size={14} color={colors.white} strokeWidth={3} />
              ) : (
                <T size={12} weight="bold" color={s.state === 'todo' ? colors.muted : colors.white}>
                  {i + 1}
                </T>
              )}
            </View>
            <T size={14} weight="semibold" color={s.state === 'todo' ? colors.muted : colors.green} style={{ flex: 1 }}>
              {s.label}
            </T>
            <T size={12} weight={s.state === 'current' ? 'semibold' : 'regular'} color={s.state === 'current' ? colors.goldText : colors.muted}>
              {s.detail}
            </T>
          </View>
        ))}
      </Card>

      {/* Fee and documents */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile
          icon="card"
          label="Joining fee"
          value={me.payment?.verified ? 'Verified' : me.payment ? 'Being checked' : 'Not paid yet'}
          good={!!me.payment?.verified}
          onPress={() => router.push('/applicant/application')}
        />
        <Tile icon="doc" label="Documents" value={`${count} of 2 received`} good={count === 2} onPress={() => router.push('/applicant/documents')} />
      </View>

      {/* Links */}
      <Card style={{ paddingVertical: 4 }}>
        {[
          { label: 'My application', sub: 'Details, nominee and joining fee', icon: 'profile' as IconName, go: '/applicant/application' as const },
          { label: 'Upload documents', sub: 'ID photo and proof of address', icon: 'camera' as IconName, go: '/applicant/documents' as const },
          ...(me.infoRequest ? [{ label: 'Reply to the office', sub: `Reply by ${me.infoRequest.by}`, icon: 'chat' as IconName, go: '/applicant/reply' as const }] : []),
        ].map((l, i, arr) => (
          <Pressable
            key={l.label}
            accessibilityRole="button"
            onPress={() => router.push(l.go)}
            style={[styles.link, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
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

      <HelpCard />

      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        style={{ alignSelf: 'center', padding: 10 }}>
        <T size={14} weight="semibold" color={colors.muted}>
          Sign out
        </T>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.green, borderRadius: 20, padding: 16 },
  status: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  next: { borderWidth: 1, borderColor: colors.mint, backgroundColor: colors.mint, borderRadius: 18, padding: 16, gap: 6 },
  count: { backgroundColor: colors.mint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.gold },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 },
  stageCurrent: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.goldLight },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, gap: 4 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
});
