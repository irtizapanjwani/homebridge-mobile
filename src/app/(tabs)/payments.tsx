import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ListPicker } from '@/components/form';
import { Icon } from '@/components/icon';
import { BackButton, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { openDownload, type DownloadRequest } from '@/lib/download';
import { useSession } from '@/lib/session';

const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

type Month = string; // "November 2026"
const keyOf: Record<string, string> = {}; // label → YYYY-MM

/** Months from joining until now, newest first, for the statement range. */
function monthsSince(admittedAt?: string) {
  const months: Month[] = [];
  const start = admittedAt ? new Date(`${admittedAt} 12:00`) : new Date();
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < 36; i++) {
    const label = MONTH.format(d);
    keyOf[label] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(label);
    if (!isNaN(start.getTime()) && d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth()) break;
    d.setMonth(d.getMonth() - 1);
  }
  return months;
}

/** Payment history: every contribution with its receipt, and statements to download. */
export default function Payments() {
  const { me, token } = useSession();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const months = monthsSince(me?.membership?.admittedAt);
  const [from, setFrom] = useState(months[months.length - 1]);
  const [to, setTo] = useState(months[0]);
  if (!me?.contributions) return null;
  const c = me.contributions;

  // Group by year
  const byYear = new Map<string, typeof c.items>();
  for (const i of c.items) {
    const y = i.periodKey.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), i]);
  }

  const download = async (id: string, req: DownloadRequest) => {
    setNote('');
    setBusy(id);
    try {
      await openDownload(token, req);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not open that just now. Please try again.');
    } finally {
      setBusy('');
    }
  };
  const statement = (format: 'pdf' | 'csv') => {
    let [a, b] = [keyOf[from], keyOf[to]];
    if (a > b) [a, b] = [b, a];
    download(format, { kind: 'statement', from: a, to: b, format });
  };

  return (
    <Screen withTabBar contentStyle={{ gap: 16 }}>
      <View style={styles.top}>
        <BackButton onPress={() => router.navigate('/home')} />
        <T serif size={24} color={colors.green}>
          Payments
        </T>
      </View>

      <View style={styles.summary}>
        <View style={{ flex: 1 }}>
          <T size={12} color={colors.mintText}>
            Total contributed
          </T>
          <T size={22} weight="bold" color={colors.white}>
            {c.totals.length ? c.totals.join(' + ') : c.currency === 'NGN' ? '₦0' : '£0.00'}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T size={12} color={colors.mintText}>
            Payments
          </T>
          <T size={22} weight="bold" color={colors.white}>
            {c.items.length}
          </T>
        </View>
      </View>

      <View style={styles.card}>
        <T size={16} weight="semibold">
          Download a statement
        </T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <T size={12} color={colors.muted}>
              From
            </T>
            <ListPicker label="From" value={from} options={[...months].reverse()} onChange={setFrom} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <T size={12} color={colors.muted}>
              To
            </T>
            <ListPicker label="To" value={to} options={months} onChange={setTo} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['pdf', 'csv'] as const).map((f) => (
            <Pressable key={f} accessibilityRole="button" disabled={!!busy} onPress={() => statement(f)} style={styles.dl}>
              <Icon name="download" size={16} color={colors.green} strokeWidth={2} />
              <T size={14} weight="semibold" color={colors.green}>
                {busy === f ? 'Opening…' : f.toUpperCase()}
              </T>
            </Pressable>
          ))}
        </View>
        {note ? (
          <T size={12} color="#9A3B26">
            {note}
          </T>
        ) : null}
      </View>

      {c.items.length === 0 ? (
        <View style={styles.card}>
          <T size={14} color={colors.inkSoft}>
            No contributions recorded yet. Each payment appears here with its receipt once it clears.
          </T>
        </View>
      ) : (
        [...byYear.entries()].map(([year, items]) => (
          <View key={year} style={{ gap: 8 }}>
            <T size={13} weight="semibold" color={colors.muted}>
              {year}
            </T>
            <View style={[styles.card, { paddingVertical: 4, gap: 0 }]}>
              {items.map((i, n) => (
                <View key={i.receiptNo} style={[styles.row, n < items.length - 1 && styles.divider]}>
                  <View style={styles.rowIcon}>
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
                  <Pressable accessibilityRole="button" accessibilityLabel={`Download receipt ${i.receiptNo}`} disabled={!!busy} onPress={() => download(i.receiptNo, { kind: 'contribution', receiptNo: i.receiptNo })} hitSlop={8}>
                    <Icon name="download" size={20} color={colors.green} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.green, borderRadius: 18, padding: 16 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14, gap: 12 },
  dl: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.green },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
});
