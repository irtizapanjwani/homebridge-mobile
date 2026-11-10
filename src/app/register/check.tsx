import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BANK, ID_OPTIONS, JOINING_FEE, MEMBERSHIP_TYPES, money, OTHER_COUNTRY, ROUTE_OPTIONS, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

function Section({ title, edit, children }: { title: string; edit: Href; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.between}>
        <T size={15} weight="semibold" color={colors.green}>
          {title}
        </T>
        <Pressable accessibilityRole="link" accessibilityLabel={`Edit ${title}`} onPress={() => router.push(edit)} hitSlop={8} style={styles.edit}>
          <T size={13} weight="semibold" color={colors.green}>
            Edit
          </T>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <T size={12} color={colors.muted}>
        {label}
      </T>
      <T size={14}>{value || '—'}</T>
    </View>
  );
}

/** Step 7 — everything they entered, with an Edit link on each part, then "Send application". */
export default function CheckAndSend() {
  const { draft } = useRegister();
  const [sending, setSending] = useState(false);
  const group = draft.memberType === 'group';
  const id = [...ID_OPTIONS.home, ...ID_OPTIONS.abroad].find((o) => o.value === draft.idType);
  const country = draft.country === OTHER_COUNTRY ? draft.countryOther : draft.country;

  // TODO: send everything to the app's apply API. For now this only moves to the confirmation.
  const send = () => {
    setSending(true);
    setTimeout(() => router.replace('/register/done'), 600);
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 14 }}>
      <StepHeader step={7} title="Check and send" />
      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Check and send
        </T>
        <T size={13} color={colors.muted}>
          Make sure everything is right. Tap Edit to change any part.
        </T>
      </View>

      <Section title="Your account" edit="/register">
        <Row label="Full name" value={draft.name} />
        <Row label="Email" value={draft.email} />
        <Row label="Mobile (WhatsApp)" value={`${draft.code} ${draft.phone}`} />
        <Row label="We’ll reach you by" value={draft.contactMethod === 'phone' ? 'Phone (WhatsApp)' : 'Email'} />
      </Section>

      <Section title="About you" edit="/register/about-you">
        <Row label="Date of birth" value={draft.dob} />
        <Row label="Lives in" value={[draft.city, draft.country === 'Nigeria' ? draft.state : '', country].filter(Boolean).join(', ')} />
        <Row label="Address" value={draft.address} />
        <Row label="Occupation" value={draft.occupation} />
        <Row label="Heard about us" value={draft.heard} />
        <Row label="Chapter" value={draft.chapter} />
      </Section>

      <Section title="How you join" edit="/register/how-you-join">
        <Row label="Membership type" value={MEMBERSHIP_TYPES.find((t) => t.value === draft.memberType)?.label ?? ''} />
        <Row label="Link to Edo or FCT" value={ROUTE_OPTIONS.find((r) => r.value === draft.route)?.label ?? ''} />
        {draft.routeDetail ? <Row label="Details" value={draft.routeDetail} /> : null}
        {group ? <Row label="Group" value={draft.groupName} /> : null}
        {group ? <Row label="Representative" value={draft.repName} /> : null}
      </Section>

      <Section title="Verify ID" edit="/register/verify-id">
        <Row label="ID" value={id?.label ?? ''} />
        {draft.idNumber ? <Row label="Number" value={`•••••••${draft.idNumber.slice(-4)}`} /> : null}
        <Row label="Photos" value={[draft.idPhoto && 'ID photo', draft.addressProof && 'Proof of address'].filter(Boolean).join(' and ') || 'None added'} />
      </Section>

      <Section title={group ? 'Agreements' : 'Nominee and agreements'} edit="/register/nominees">
        {!group
          ? draft.nominees.map((n, i) => <Row key={n.id} label={`Nominee ${i + 1}`} value={`${n.name} · ${n.relationship} · ${n.share}%`} />)
          : null}
        <Row label="Declarations" value={Object.values(draft.decl).every(Boolean) ? 'All four confirmed' : 'Not all confirmed yet'} />
      </Section>

      <Section title="Joining fee" edit="/register/joining-fee">
        <Row label="Amount" value={money(draft, JOINING_FEE.gbp, JOINING_FEE.ngn)} />
        <Row label="How you’ll pay" value={draft.payMethod === 'card' ? 'Card payment' : draft.payMethod === 'bank' ? `Bank transfer · ${BANK.name}` : 'Not chosen yet'} />
        {draft.datePaid ? <Row label="Date paid" value={draft.datePaid} /> : null}
        {draft.payReference ? <Row label="Reference" value={draft.payReference} /> : null}
      </Section>

      <View style={{ marginTop: 8, gap: 8 }}>
        {sending ? (
          <ActivityIndicator color={colors.green} style={{ height: 54 }} />
        ) : (
          <Button label="Send application" onPress={send} />
        )}
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          By sending, you confirm these details are true. We’ll email your reference straight away.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, gap: 4 },
  edit: { backgroundColor: colors.mint, borderRadius: 10, paddingHorizontal: 12, height: 32, justifyContent: 'center' },
  row: { paddingVertical: 5, gap: 1 },
});
