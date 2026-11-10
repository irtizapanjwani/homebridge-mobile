import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card, ErrorBox, OFFICE_WHATSAPP, Row } from '@/components/applicant';
import { Field, Input } from '@/components/form';
import { Icon } from '@/components/icon';
import { BackButton, Button, Pill, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

const NEXT = [
  'We check your joining fee payment to VEKAT Group Ltd against the bank or card record. It is not a share and is not refundable.',
  'A membership officer checks your ID and proof of address and reviews your application. We decide within 30 days, and aim for 2 working days.',
  'If you’re approved, we email your membership number, certificate and welcome pack.',
  'You become an active member when you buy your first share and your name is on the register.',
];

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.between}>
        <T size={16} weight="semibold">
          {title}
        </T>
        {action}
      </View>
      {children}
    </View>
  );
}

function ContactEditor({ onDone }: { onDone: () => void }) {
  const { me, token, refreshMe } = useSession();
  const [phone, setPhone] = useState(me?.phone ?? '');
  const [address, setAddress] = useState(me?.address ?? '');
  const [city, setCity] = useState(me?.city ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/api/contact', { token, body: { whatsapp: phone, address, city } });
      await refreshMe();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 12, borderColor: colors.green }}>
      <Field label="Phone or WhatsApp">
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      </Field>
      <Field label="Home address">
        <Input value={address} onChangeText={setAddress} autoComplete="street-address" />
      </Field>
      <Field label="Town or city">
        <Input value={city} onChangeText={setCity} />
      </Field>
      {error ? <ErrorBox text={error} /> : null}
      {busy ? (
        <ActivityIndicator color={colors.green} style={{ height: 48 }} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="Cancel" variant="outline" onPress={onDone} height={48} textSize={15} style={{ flex: 1 }} />
          <Button label="Save" onPress={save} height={48} textSize={15} style={{ flex: 1 }} />
        </View>
      )}
    </Card>
  );
}

export default function MyApplication() {
  const { me } = useSession();
  const [editing, setEditing] = useState(false);
  if (!me) return null;
  const fee = me.payment;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 20 }}>
      <View style={styles.top}>
        <BackButton />
        <T serif size={24} color={colors.green}>
          My application
        </T>
      </View>

      <Section
        title="Your details"
        action={
          !editing ? (
            <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.edit}>
              <T size={13} weight="semibold" color={colors.green}>
                Edit phone or address
              </T>
            </Pressable>
          ) : null
        }>
        {editing ? (
          <ContactEditor onDone={() => setEditing(false)} />
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            <Row label="Name" value={me.fullName} />
            <Row label="Email" value={me.email} />
            <Row label="Phone / WhatsApp" value={me.phone} />
            <Row label="Address" value={[me.address, me.city].filter(Boolean).join(', ')} />
            <Row label="Lives in" value={me.livesIn} />
            <Row label="Membership type" value={me.memberType} />
            <Row label="Chapter" value={me.chapter} />
            <Row label="ID for verification" value={me.idLabel} last />
          </Card>
        )}
        <T size={12} color={colors.muted}>
          To change your name, date of birth or email,{' '}
          <T size={12} weight="semibold" color={colors.green} onPress={() => Linking.openURL(OFFICE_WHATSAPP)} style={{ textDecorationLine: 'underline' }}>
            message the office
          </T>
          .
        </T>
      </Section>

      <Section title={me.nominees.length > 1 ? 'Your nominees' : 'Your nominee'}>
        {me.nominees.length ? (
          <Card style={{ gap: 12 }}>
            {me.nominees.map((n) => (
              <View key={n.name} style={styles.nominee}>
                <View style={styles.avatar}>
                  <T size={14} weight="bold" color={colors.green}>
                    {n.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join('')}
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T size={15} weight="semibold">
                    {n.name}
                  </T>
                  <T size={12} color={colors.muted}>
                    {[n.relationship, `${n.share}%`, n.contact].filter(Boolean).join(' · ')}
                  </T>
                </View>
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <T size={14} color={colors.muted}>
              No nominee on your application.
            </T>
          </Card>
        )}
      </Section>

      <Section title="Joining fee" action={fee ? <Pill label={fee.verified ? 'Verified' : 'Being checked'} tone={fee.verified ? 'green' : 'gold'} /> : null}>
        <Card style={{ paddingVertical: 4 }}>
          {fee ? (
            <>
              <Row label="Paid on" value={fee.datePaid} />
              <Row label="How you paid" value={fee.method} />
              <Row label="Payment reference" value={fee.reference} last={fee.verified} />
              {!fee.verified ? (
                <T size={12} color={colors.muted} style={{ paddingVertical: 10 }}>
                  An officer checks your payment against the bank or card record. Until then it shows as “being checked” — that is normal.
                </T>
              ) : null}
            </>
          ) : (
            <T size={14} color={colors.muted} style={{ paddingVertical: 10 }}>
              We haven’t got a record of your joining fee yet. Message the office and we’ll send you the payment details.
            </T>
          )}
        </Card>
      </Section>

      <Section title="What happens next">
        <Card style={{ gap: 0 }}>
          {NEXT.map((t, i) => (
            <View key={i} style={styles.step}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.num}>
                  <T size={12} weight="bold" color={colors.white}>
                    {i + 1}
                  </T>
                </View>
                {i < NEXT.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <T size={13} color={colors.inkSoft} style={{ flex: 1, paddingBottom: 14 }}>
                {t}
              </T>
            </View>
          ))}
        </Card>
      </Section>

      <View style={styles.safety}>
        <Icon name="lock" size={16} color={colors.green} strokeWidth={1.8} />
        <T size={12} color={colors.inkSoft} style={{ flex: 1 }}>
          Nobody from HomeBridge will ever ask you for your password, your BVN or your bank PIN.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  edit: { backgroundColor: colors.mint, borderRadius: 12, paddingHorizontal: 12, height: 36, justifyContent: 'center' },
  nominee: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  step: { flexDirection: 'row', gap: 12 },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, backgroundColor: colors.lineSoft, marginVertical: 4 },
  safety: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: colors.mint, borderRadius: 12 },
});
