import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorBox } from '@/components/applicant';
import { Checkbox, Field, Input } from '@/components/form';
import { Icon } from '@/components/icon';
import { SignaturePad } from '@/components/signature-pad';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

// Membership forms, signed on the phone — same wording as the website (lib/forms-text.ts).
// Screens only for now: signing shows a confirmation but isn't saved yet (TODO: app API).

const DECLARATION = [
  'The information I gave in my application is true and complete, and I will tell HomeBridge promptly if it changes.',
  'I have received and read the Bye-laws, Member Handbook, Contribution and Payment Guide, Investment Risk Statement and Privacy Notice.',
  'I agree to abide by the Bye-laws of HomeBridge Cooperative and the lawful decisions of its General Meetings and Governing Board.',
  'I understand that my contributions buy shares, that their value can fall as well as rise, and that no return is guaranteed.',
  'I understand that the joining (registration) fee is non-refundable.',
  'I will make contributions only into HomeBridge Cooperative’s official accounts, quoting my membership number.',
  'I understand that VEKAT Group Ltd manages the cooperative’s administration as its appointed manager.',
  'I consent to HomeBridge Cooperative and VEKAT Group Ltd processing my personal data as described in the Privacy Notice.',
  'I am contributing my own funds, lawfully obtained.',
];
const PHOTO_CONSENT = 'I agree that photographs of me taken at HomeBridge events may be used in HomeBridge communications.';

type Row = { name: string; relationship: string; phone: string; email: string; address: string; share: string };

function DeclarationForm({ name, onDone }: { name: string; onDone: () => void }) {
  const [ticks, setTicks] = useState<boolean[]>(DECLARATION.map(() => false));
  const [photo, setPhoto] = useState(false);
  const [signer, setSigner] = useState(name);
  const [sig, setSig] = useState<string[]>([]);
  const [error, setError] = useState('');
  const onSig = useCallback((p: string[]) => setSig(p), []);

  const sign = () => {
    if (!ticks.every(Boolean)) return setError('Tick every statement to confirm it.');
    if (signer.trim().length < 3) return setError('Type your full name.');
    if (!sig.length) return setError('Sign in the box.');
    setError('');
    onDone(); // TODO: save through the app API (creates the signed PDF like the website)
  };

  return (
    <View style={{ gap: 12 }}>
      <T size={14} weight="semibold">
        I declare that:
      </T>
      {DECLARATION.map((d, i) => (
        <Checkbox key={i} checked={ticks[i]} onPress={() => setTicks(ticks.map((t, j) => (j === i ? !t : t)))}>
          <T size={13} style={{ flex: 1 }}>
            {d}
          </T>
        </Checkbox>
      ))}
      <View style={styles.optional}>
        <Checkbox checked={photo} onPress={() => setPhoto(!photo)}>
          <T size={13} style={{ flex: 1 }}>
            <T size={13} weight="semibold">
              Optional:{' '}
            </T>
            {PHOTO_CONSENT}
          </T>
        </Checkbox>
      </View>
      <Field label="Your full name">
        <Input value={signer} onChangeText={setSigner} autoComplete="name" />
      </Field>
      <SignaturePad label="Your signature" onChange={onSig} />
      {error ? <ErrorBox text={error} /> : null}
      <Button label="Sign the declaration" onPress={sign} />
    </View>
  );
}

function NomineeForm({ defaults, onDone }: { defaults: Row[]; onDone: () => void }) {
  const [rows, setRows] = useState<Row[]>(defaults.length ? defaults : [{ name: '', relationship: '', phone: '', email: '', address: '', share: '100' }]);
  const [survivor, setSurvivor] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessAddress, setWitnessAddress] = useState('');
  const [witnessAdult, setWitnessAdult] = useState(false);
  const [sig, setSig] = useState<string[]>([]);
  const [wsig, setWsig] = useState<string[]>([]);
  const [error, setError] = useState('');
  const onSig = useCallback((p: string[]) => setSig(p), []);
  const onWsig = useCallback((p: string[]) => setWsig(p), []);
  const total = rows.reduce((t, r) => t + (Number(r.share) || 0), 0);
  const upd = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const sign = () => {
    if (rows.some((r) => r.name.trim().length < 2 || r.relationship.trim().length < 2 || (!r.phone.trim() && !r.email.trim())))
      return setError('Give each nominee a name, relationship and a phone or email.');
    if (total !== 100) return setError('The shares must add up to 100%.');
    if (!sig.length) return setError('Sign in your box.');
    if (witnessName.trim().length < 3 || witnessAddress.trim().length < 5) return setError('Add your witness’s name and address.');
    if (!witnessAdult) return setError('Confirm your witness is 18 or over and not a nominee.');
    if (!wsig.length) return setError('Ask your witness to sign in their box.');
    setError('');
    onDone(); // TODO: save through the app API
  };

  return (
    <View style={{ gap: 12 }}>
      <T size={13} color={colors.inkSoft}>
        In the event of my death, I nominate the person(s) below to receive my shares and any sums due to me from HomeBridge Cooperative, subject to
        the Bye-laws and applicable law.
      </T>
      {rows.map((r, i) => (
        <View key={i} style={styles.nominee}>
          <View style={styles.between}>
            <T size={14} weight="semibold">
              Nominee {i + 1}
            </T>
            {rows.length > 1 ? (
              <Pressable accessibilityRole="button" onPress={() => setRows(rows.filter((_, j) => j !== i))} hitSlop={8}>
                <T size={13} weight="semibold" color={colors.muted}>
                  Remove
                </T>
              </Pressable>
            ) : null}
          </View>
          <Field label="Full name">
            <Input value={r.name} onChangeText={(v) => upd(i, { name: v })} />
          </Field>
          <Field label="Relationship to you">
            <Input value={r.relationship} onChangeText={(v) => upd(i, { relationship: v })} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Phone" flex>
              <Input value={r.phone} onChangeText={(v) => upd(i, { phone: v })} keyboardType="phone-pad" />
            </Field>
            <View style={{ width: 92, gap: 6 }}>
              <T size={13} weight="medium">
                Share %
              </T>
              <Input value={r.share} onChangeText={(v) => upd(i, { share: v.replace(/\D/g, '').slice(0, 3) })} keyboardType="number-pad" />
            </View>
          </View>
          <Field label="Email">
            <Input value={r.email} onChangeText={(v) => upd(i, { email: v })} autoCapitalize="none" keyboardType="email-address" />
          </Field>
          <Field label="Address">
            <Input value={r.address} onChangeText={(v) => upd(i, { address: v })} />
          </Field>
        </View>
      ))}
      <View style={styles.between}>
        {rows.length < 5 ? (
          <Pressable accessibilityRole="button" onPress={() => setRows([...rows, { name: '', relationship: '', phone: '', email: '', address: '', share: '' }])} style={{ minHeight: 44, justifyContent: 'center' }}>
            <T size={14} weight="semibold" color={colors.green}>
              + Add another nominee
            </T>
          </Pressable>
        ) : (
          <View />
        )}
        <T size={13} weight="semibold" color={total === 100 ? colors.green : colors.goldText}>
          Total {total}%{total === 100 ? ' ✓' : ''}
        </T>
      </View>
      <Field label="If a nominee dies before me (optional)">
        <Input value={survivor} onChangeText={setSurvivor} placeholder="Otherwise their share is divided equally among the others" />
      </Field>
      <SignaturePad label="Your signature" onChange={onSig} />
      <View style={styles.witness}>
        <T size={14} weight="semibold" color={colors.green}>
          Witness
        </T>
        <T size={12} color={colors.muted}>
          Your witness must be 18 or over, must not be one of your nominees, and signs on this screen with you.
        </T>
        <Field label="Witness full name">
          <Input value={witnessName} onChangeText={setWitnessName} />
        </Field>
        <Field label="Witness address">
          <Input value={witnessAddress} onChangeText={setWitnessAddress} />
        </Field>
        <Checkbox checked={witnessAdult} onPress={() => setWitnessAdult(!witnessAdult)}>
          <T size={13} style={{ flex: 1 }}>
            My witness is 18 or over and is not one of my nominees.
          </T>
        </Checkbox>
        <SignaturePad label="Witness signature" onChange={onWsig} />
      </View>
      {error ? <ErrorBox text={error} /> : null}
      <Button label="Sign the nominee form" onPress={sign} />
    </View>
  );
}

export default function MembershipForms() {
  const { me } = useSession();
  const [open, setOpen] = useState<'declaration' | 'nominee' | null>(null);
  const [signedNow, setSignedNow] = useState<{ declaration?: boolean; nominee?: boolean }>({});
  if (!me?.forms) return null;
  const f = me.forms;
  const defaults: Row[] = me.nominees.map((n) => ({
    name: n.name,
    relationship: n.relationship,
    phone: n.contact.includes('@') ? '' : n.contact,
    email: n.contact.includes('@') ? n.contact : '',
    address: '',
    share: String(n.share),
  }));

  const items = [
    { key: 'declaration' as const, title: 'Member Declaration Form', signed: f.declarationSignedAt ?? (signedNow.declaration ? 'just now' : null) },
    { key: 'nominee' as const, title: 'Nominee (Next of Kin) Form', signed: f.nomineeSignedAt ?? (signedNow.nominee ? 'just now' : null) },
  ];

  return (
    <Screen withTabBar contentStyle={{ gap: 16 }}>
      <View style={styles.top}>
        <BackButton onPress={() => router.navigate('/home')} />
        <T serif size={24} color={colors.green}>
          Membership forms
        </T>
      </View>
      <T size={14} color={colors.inkSoft}>
        Please sign both by {f.dueBy}. You sign on this screen — no printing needed. We email you a signed copy.
      </T>

      {items.map((it) => (
        <View key={it.key} style={[styles.card, open === it.key && { borderColor: colors.green }]}>
          <Pressable accessibilityRole="button" onPress={() => setOpen(open === it.key ? null : it.key)} style={styles.head}>
            <View style={[styles.icon, it.signed && { backgroundColor: colors.green }]}>
              <Icon name={it.signed ? 'check' : 'doc'} size={18} color={it.signed ? colors.white : colors.green} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={15} weight="semibold">
                {it.title}
              </T>
              <T size={12} color={it.signed ? colors.green : colors.goldText}>
                {it.signed ? `Signed ${it.signed}` : 'Not signed yet'}
              </T>
            </View>
            <T size={13} weight="semibold" color={colors.green}>
              {open === it.key ? 'Close' : it.signed ? 'Sign again' : 'Fill in and sign'}
            </T>
          </Pressable>
          {open === it.key ? (
            <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft, marginTop: 12 }}>
              {it.key === 'declaration' ? (
                <DeclarationForm
                  name={me.fullName}
                  onDone={() => {
                    setSignedNow({ ...signedNow, declaration: true });
                    setOpen(null);
                  }}
                />
              ) : (
                <NomineeForm
                  defaults={defaults}
                  onDone={() => {
                    setSignedNow({ ...signedNow, nominee: true });
                    setOpen(null);
                  }}
                />
              )}
            </View>
          ) : null}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  optional: { backgroundColor: colors.mint, borderRadius: 12, padding: 10 },
  nominee: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 10 },
  witness: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, gap: 10, backgroundColor: colors.paper },
});
