import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TextLink } from '@/components/form';
import { CheckBadge, Icon } from '@/components/icon';
import { BackButton, Pill, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession, type Me } from '@/lib/session';

const OFFICE = { email: 'info@homebridgecooperative.org', website: 'https://homebridge-two.vercel.app' };

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const steps = ['In review', 'Information requested', 'Approved'] as const;

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <T size={12} color={colors.muted}>
        {label}
      </T>
      <T size={14}>{value}</T>
    </View>
  );
}

/** A detail row with an Edit button that turns it into an input. */
function EditableRow({ label, value, onSave, multiline, last }: { label: string; value: string; onSave: (v: string) => Promise<void>; multiline?: boolean; last?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');

  // Saves through POST /api/contact (same rules as the website).
  const save = async () => {
    setError('');
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    }
  };

  return (
    <View style={[styles.detail, !last && styles.divider]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={12} color={colors.muted}>
          {label}
        </T>
        {editing ? (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline={multiline}
            autoFocus
            style={[styles.editInput, multiline && { minHeight: 76, textAlignVertical: 'top' }]}
          />
        ) : (
          <T size={14}>{value || '—'}</T>
        )}
        {error ? (
          <T size={12} color="#9A3B26">
            {error}
          </T>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={editing ? `Save ${label}` : `Edit ${label}`}
        onPress={editing ? save : () => (setDraft(value), setEditing(true))}
        style={[styles.smallBtn, editing && { backgroundColor: colors.green }]}>
        <T size={13} weight="semibold" color={editing ? colors.white : colors.green}>
          {editing ? 'Save' : 'Edit'}
        </T>
      </Pressable>
    </View>
  );
}

/** The real account, in the shapes this screen was designed with. */
function shape(me: Me) {
  const member = {
    initials: me.initials,
    fullName: me.fullName,
    memberId: me.memberNo ?? me.reference,
    type: me.memberType,
    cohort: me.chapter,
    city: me.city,
    since: me.membership?.since ?? '',
  };
  const status = (me.status === 'Approved' ? 'Approved' : me.status === 'Info requested' ? 'Information requested' : 'In review') as (typeof steps)[number];
  const n = me.nominees[0];
  const account = {
    status,
    approvedOn: me.membership?.admittedAt ?? '',
    joiningFee: {
      amount: me.country === 'Nigeria' ? '₦10,000' : '£10.00',
      paid: !!me.payment?.verified,
      paidOn: me.payment?.datePaid || '—',
      method: me.payment?.method || '—',
      paidTo: 'VEKAT Group Ltd',
      reference: me.payment?.receiptNo || me.payment?.reference || '—',
    },
    documents: me.documents.map((d) => ({ id: d.id, title: d.label, detail: `${d.uploadedAt} · ${d.name}`, icon: 'doc' as const })),
    email: me.email,
    country: me.country,
    homeCohort: me.chapter,
    nominee: n
      ? {
          name: n.name,
          initials: initialsOf(n.name),
          relation: `${n.relationship} · receives ${n.share}% of shares`,
          contact: n.contact,
        }
      : null,
  };
  return { member, account };
}

export default function MyAccount() {
  const { me, token, refreshMe } = useSession();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!me) return null; // the tabs only open once the account has loaded
  const { member, account } = shape(me);

  const saveContact = async (patch: { whatsapp?: string; address?: string }) => {
    await api('/api/contact', {
      token,
      body: { whatsapp: patch.whatsapp ?? me.phone, address: patch.address ?? me.address, city: me.city },
    });
    await refreshMe();
  };

  const copy = async () => {
    await Clipboard.setStringAsync(member.memberId);
    setCopied(true);
  };

  const stepIndex = steps.indexOf(account.status);
  const fee = account.joiningFee;
  const n = account.nominee;

  return (
    <Screen withTabBar contentStyle={{ gap: 20 }}>
      <View style={[styles.between, { justifyContent: 'flex-start', gap: 4 }]}>
        <BackButton onPress={() => router.navigate('/profile')} />
        <T serif size={26} color={colors.green}>
          My account
        </T>
      </View>

      {/* Member card */}
      <View style={styles.memberCard}>
        <View style={[styles.between, { gap: 12 }]}>
          <View style={styles.avatar}>
            <T size={18} weight="bold">
              {member.initials}
            </T>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={17} weight="semibold" color={colors.white}>
              {member.fullName}
            </T>
            <T size={12} color={colors.mintText}>
              {member.type} · {member.cohort} · {member.city}
            </T>
          </View>
          <View style={styles.approved}>
            <T size={12} weight="semibold" color={colors.ink}>
              {account.status}
            </T>
          </View>
        </View>
        <View style={styles.cardLine} />
        <T size={12} color={colors.mintText}>
          Membership number
        </T>
        <View style={styles.between}>
          <T size={24} weight="bold" color={colors.white} style={{ letterSpacing: 1.5, flexShrink: 1 }} selectable>
            {member.memberId}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy membership number" onPress={copy} style={styles.copy}>
            <Icon name={copied ? 'check' : 'copy'} size={16} color={colors.white} strokeWidth={2} />
            <T size={13} weight="semibold" color={colors.white}>
              {copied ? 'Copied' : 'Copy'}
            </T>
          </Pressable>
        </View>
        <T size={12} color={colors.mintText}>
          {member.since ? `Member since ${member.since}` : ''}
        </T>
      </View>

      {/* Application status */}
      <Section title="Application status">
        <Card style={{ gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {steps.map((s, i) => (
              <View key={s} style={{ flex: 1, gap: 6 }}>
                <View style={[styles.stepBar, { backgroundColor: i <= stepIndex ? colors.green : colors.lineSoft }]} />
                <T size={11} weight={i === stepIndex ? 'semibold' : 'regular'} color={i === stepIndex ? colors.green : colors.inkSoft}>
                  {s}
                </T>
              </View>
            ))}
          </View>
          {account.status === 'Approved' && (
            <View style={styles.approvedBox}>
              <CheckBadge size={22} />
              <View style={{ flex: 1, gap: 2 }}>
                <T size={13} weight="semibold" color={colors.green}>
                  Approved on {account.approvedOn}
                </T>
                <T size={13}>Welcome to HomeBridge. Your certificate is ready to download.</T>
              </View>
            </View>
          )}
        </Card>
      </Section>

      {/* Joining fee */}
      <Section title="Joining fee">
        <Card style={{ gap: 14 }}>
          <View style={styles.between}>
            <View style={{ gap: 2 }}>
              <T size={12} color={colors.muted}>
                One-off joining fee
              </T>
              <T size={24} weight="bold">
                {fee.amount}
              </T>
            </View>
            <Pill label={fee.paid ? 'Paid' : 'Not paid'} tone={fee.paid ? 'green' : 'gold'} />
          </View>
          <View style={styles.grid}>
            <Info label="Paid on" value={fee.paidOn} />
            <Info label="Method" value={fee.method} />
          </View>
          <View style={styles.grid}>
            <Info label="Paid to" value={fee.paidTo} />
            <Info label="Reference" value={fee.reference} />
          </View>
        </Card>
      </Section>

      {/* Documents */}
      <Section title="My documents">
        <View style={{ gap: 10 }}>
          {account.documents.length === 0 ? (
            <T size={13} color={colors.muted}>
              No documents on your record yet.
            </T>
          ) : null}
          {account.documents.map((d) => (
            // TODO: download the file once the app has a documents download API.
            <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`Download ${d.title}`} style={[styles.card, styles.docRow]}>
              <View style={styles.docIcon}>
                <Icon name={d.icon} size={20} color={colors.goldText} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={14} weight="semibold">
                  {d.title}
                </T>
                <T size={12} color={colors.muted}>
                  {d.detail}
                </T>
              </View>
              <Icon name="download" size={20} color={colors.green} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Personal details */}
      <Section title="Personal details">
        <Card style={{ paddingVertical: 4 }}>
          <View style={[styles.detail, styles.divider]}>
            <Info label="Full name (as on ID)" value={member.fullName} />
            <Icon name="lock" size={16} color={colors.muted} strokeWidth={1.8} />
          </View>
          <View style={[styles.detail, styles.divider]}>
            <Info label="Email" value={account.email} />
          </View>
          <EditableRow label="Mobile number (WhatsApp)" value={me.phone} onSave={(v) => saveContact({ whatsapp: v })} />
          <EditableRow label="Home address" value={[me.address, me.city].filter(Boolean).join(', ')} onSave={(v) => saveContact({ address: v })} multiline />
          <View style={[styles.detail, styles.grid]}>
            <Info label="Country you live in" value={account.country} />
            <Info label="Home cohort" value={account.homeCohort} />
          </View>
        </Card>
        <T size={12} color={colors.muted}>
          To change your name or email,{' '}
          <TextLink label="contact the office" size={12} color={colors.muted} onPress={() => Linking.openURL(`mailto:${OFFICE.email}`)} /> — we’ll need
          to re-check your ID.
        </T>
      </Section>

      {/* Nominee */}
      <Section
        title="Nominee"
        action={
          // Nominee changes use the signed form on the website.
          <TextLink label="Change nominee" onPress={() => Linking.openURL(`${OFFICE.website}/app`)} />
        }>
        <Card style={{ gap: 14 }}>
          {n ? (
            <View style={[styles.between, { justifyContent: 'flex-start', gap: 12 }]}>
              <View style={[styles.avatar, { backgroundColor: colors.mint, width: 48, height: 48 }]}>
                <T size={15} weight="bold" color={colors.green}>
                  {n.initials}
                </T>
              </View>
              <View style={{ flex: 1 }}>
                <T size={16} weight="semibold">
                  {n.name}
                </T>
                <T size={12} color={colors.muted}>
                  {n.relation}
                </T>
                {n.contact ? (
                  <T size={12} color={colors.muted}>
                    {n.contact}
                  </T>
                ) : null}
              </View>
            </View>
          ) : (
            <T size={13} color={colors.muted}>
              No nominee on your record yet.
            </T>
          )}
          <View style={styles.nomineeNote}>
            <Icon name="shield" size={18} color={colors.green} strokeWidth={1.8} />
            <T size={12} style={{ flex: 1 }}>
              Your nominee receives your savings and shares under the HomeBridge bye-laws if you pass away.
            </T>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  memberCard: { backgroundColor: colors.green, borderRadius: 18, padding: 16, gap: 8 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approved: { backgroundColor: colors.gold, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  cardLine: { height: 1, backgroundColor: 'rgba(247,240,218,0.18)', marginVertical: 4 },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(247,240,218,0.4)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  stepBar: { height: 4, borderRadius: 2 },
  approvedBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
    alignItems: 'flex-start',
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  smallBtn: {
    minWidth: 56,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  nomineeNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
});
