import * as Clipboard from 'expo-clipboard';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { T } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { Me } from '@/lib/session';

// Shared pieces for the applicant screens (same logic as the website's applicant dashboard).

export const OFFICE_WHATSAPP = 'https://wa.me/2348105832602';
export const OPEN_STATUSES = ['Submitted', 'In review', 'Info requested'];

export type StageState = 'done' | 'current' | 'todo' | 'stopped';
export type Stage = { label: string; detail: string; state: StageState };

export function docsOf(me: Me) {
  const hasId = me.documents.some((d) => d.type === 'id');
  const hasAddress = me.documents.some((d) => d.type === 'address');
  return { hasId, hasAddress, count: Number(hasId) + Number(hasAddress) };
}

/** The 5 steps from application to membership number. */
export function stagesFor(me: Me): Stage[] {
  const { hasId, hasAddress } = docsOf(me);
  const docsDone = hasId && hasAddress;
  const feeDone = !!me.payment?.verified;
  const approved = me.status === 'Approved' || !!me.memberNo;
  const declined = me.status === 'Declined';
  const raw = [
    { label: 'Application sent', detail: me.submittedAt, done: true },
    { label: 'Joining fee', detail: feeDone ? 'Verified' : me.payment ? 'Being checked' : 'Not paid yet', done: feeDone },
    { label: 'ID and address', detail: docsDone ? 'Received' : hasId || hasAddress ? '1 of 2 received' : 'Not sent yet', done: docsDone },
    {
      label: 'Officer decision',
      detail: approved ? 'Approved' : declined ? 'Not approved' : me.status === 'Info requested' ? 'Needs your reply' : 'Usually 2 working days',
      done: approved,
    },
    { label: 'Membership number', detail: me.memberNo ?? 'Sent by email', done: !!me.memberNo },
  ];
  let currentSet = false;
  return raw.map((s, i): Stage => {
    if (s.done) return { label: s.label, detail: s.detail, state: 'done' };
    if (declined && i === 3) return { label: s.label, detail: s.detail, state: 'stopped' };
    if (!currentSet && !declined) {
      currentSet = true;
      return { label: s.label, detail: s.detail, state: 'current' };
    }
    return { label: s.label, detail: s.detail, state: 'todo' };
  });
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <T size={12} color={colors.muted}>
        {label}
      </T>
      <T size={14}>{value || '—'}</T>
    </View>
  );
}

export function CopyButton({ value, light }: { value: string; light?: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copied' : `Copy ${value}`}
      onPress={async () => {
        await Clipboard.setStringAsync(value);
        setCopied(true);
      }}
      style={[styles.copy, light ? { backgroundColor: colors.green } : { borderWidth: 1, borderColor: 'rgba(247,240,218,0.4)' }]}>
      <Icon name={copied ? 'check' : 'copy'} size={15} color={colors.white} strokeWidth={2} />
      <T size={13} weight="semibold" color={colors.white}>
        {copied ? 'Copied' : 'Copy'}
      </T>
    </Pressable>
  );
}

export function HelpCard({ member = false }: { member?: boolean }) {
  return (
    <Card style={{ backgroundColor: colors.cream, borderColor: colors.creamBorder, gap: 10 }}>
      <T size={15} weight="semibold">
        Need help?
      </T>
      <T size={13} color={colors.inkSoft}>
        {member ? 'Questions about payments, forms or meetings? Message the office.' : 'Questions about your application? Message the membership office.'}
      </T>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(OFFICE_WHATSAPP)} style={styles.whatsapp}>
        <Icon name="chat" size={18} color={colors.white} strokeWidth={1.8} />
        <T size={14} weight="semibold" color={colors.white}>
          Help on WhatsApp
        </T>
      </Pressable>
    </Card>
  );
}

export function ErrorBox({ text }: { text: string }) {
  return (
    <View style={styles.error} accessibilityRole="alert">
      <T size={13} color="#9A3B26">
        {text}
      </T>
    </View>
  );
}

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  row: { paddingVertical: 10, gap: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 12, height: 38 },
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.green,
  },
  error: { backgroundColor: '#FDF1EC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F0D3C7' },
});
