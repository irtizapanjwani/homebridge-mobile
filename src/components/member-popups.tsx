import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ErrorBox } from '@/components/applicant';
import { DateInput, Field, Input, Segment } from '@/components/form';
import { Icon, type IconName } from '@/components/icon';
import { Sheet } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { pickFile, sendForm, type Picked } from '@/lib/upload';

// The three member pop-ups from the website: proof of payment, payment holiday and proxy.
// Each sends to the app's API (same rules and database as the website).

const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
type Month = { key: string; label: string }; // key is YYYY-MM
const monthsFrom = (offset: number, count: number): Month[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset + i);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH.format(d) };
  });
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'That didn’t send. Please try again.');

/** DD/MM/YYYY → YYYY-MM-DD, or '' if it isn't a real date. */
function isoDate(v: string) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
  if (!m) return '';
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <T size={13} weight="semibold" color={on ? colors.white : colors.ink}>
        {label}
      </T>
    </Pressable>
  );
}

function Done({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
      <View style={styles.ok}>
        <Icon name="check" size={26} color={colors.white} strokeWidth={3} />
      </View>
      <T size={17} weight="semibold" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T size={13} color={colors.inkSoft} style={{ textAlign: 'center' }}>
        {text}
      </T>
      <Button label="Close" variant="outline" onPress={onClose} height={48} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

// ---------- I've paid — send proof ----------

export function ProofOfPaymentSheet({ visible, onClose, currency }: { visible: boolean; onClose: () => void; currency: 'GBP' | 'NGN' }) {
  const [cur, setCur] = useState<'GBP' | 'NGN'>(currency);
  const [amount, setAmount] = useState('');
  const { token, refreshMe } = useSession();
  const [month, setMonth] = useState(monthsFrom(0, 1)[0].key);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState('');
  const [ref, setRef] = useState('');
  const [file, setFile] = useState<Picked | null>(null);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const close = () => {
    setSent(false);
    setError('');
    onClose();
  };
  const choose = async (source: 'camera' | 'library' | 'file') => {
    const p = await pickFile(source);
    if (p === 'denied') return setError('Please allow HomeBridge to use your camera or photos in your phone’s settings.');
    if (p) setFile(p);
  };
  const send = async () => {
    if (!Number(amount)) return setError('Enter the amount you paid.');
    const paidOn = isoDate(date);
    if (!paidOn) return setError('Enter the date you paid, like 05/11/2026.');
    if (!file) return setError('Add a photo or PDF of your bank receipt.');
    if (!token) return setError('Please sign in again.');
    setError('');
    setBusy(true);
    try {
      await sendForm(token, '/api/payment-proof', { amount, currency: cur, period: month, paidOn, bankRef: ref }, file);
      setSent(true);
      setAmount('');
      setDate('');
      setRef('');
      setFile(null);
      refreshMe();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="I have paid — send proof" onClose={close}>
      {sent ? (
        <Done
          title="Proof sent"
          text="The Treasurer will check it against the bank. Once approved, your contribution and receipt appear in your payments."
          onClose={close}
        />
      ) : (
        <>
          <T size={13} color={colors.inkSoft}>
            Paid by bank transfer and it isn’t showing yet? Send us the receipt and we’ll record it.
          </T>
          <Field label="Currency">
            <Segment
              value={cur}
              onChange={setCur}
              options={[
                { key: 'GBP', label: '£ Pounds' },
                { key: 'NGN', label: '₦ Naira' },
              ]}
            />
          </Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Amount" flex>
              <Input value={amount} onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))} keyboardType="decimal-pad" placeholder={cur === 'GBP' ? '25' : '5000'} />
            </Field>
            <Field label="Date paid" flex>
              <DateInput value={date} onChangeText={setDate} />
            </Field>
          </View>
          <Field label="Which month is it for?">
            <View style={styles.chips}>
              {monthsFrom(-2, 3).map((m) => (
                <Chip key={m.key} label={m.label} on={month === m.key} onPress={() => setMonth(m.key)} />
              ))}
            </View>
          </Field>
          <Field label="Bank reference (optional)">
            <Input value={ref} onChangeText={setRef} autoCapitalize="characters" />
          </Field>
          <Field label="Bank receipt">
            {file ? (
              <View style={styles.file}>
                {file.mimeType.startsWith('image/') ? <Image source={{ uri: file.uri }} style={styles.thumb} /> : <Icon name="doc" size={20} color={colors.green} />}
                <T size={13} numberOfLines={1} style={{ flex: 1 }}>
                  {file.name}
                </T>
                <Pressable accessibilityRole="button" onPress={() => setFile(null)} hitSlop={8}>
                  <T size={13} weight="semibold" color={colors.muted}>
                    Remove
                  </T>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(
                  [
                    ['camera', 'Camera', 'camera'],
                    ['library', 'Gallery', 'photo'],
                    ['file', 'PDF', 'doc'],
                  ] as [('camera' | 'library' | 'file'), string, IconName][]
                ).map(([src, label, icon]) => (
                  <Pressable key={src} accessibilityRole="button" onPress={() => choose(src)} style={styles.source}>
                    <Icon name={icon} size={16} color={colors.green} strokeWidth={2} />
                    <T size={13} weight="semibold" color={colors.green}>
                      {label}
                    </T>
                  </Pressable>
                ))}
              </View>
            )}
          </Field>
          {error ? <ErrorBox text={error} /> : null}
          <Button label={busy ? 'Sending…' : 'Send proof'} variant={busy ? 'disabled' : 'primary'} onPress={send} />
        </>
      )}
    </Sheet>
  );
}

// ---------- Ask for a payment holiday ----------

export function PaymentHolidaySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { token } = useSession();
  const [months, setMonths] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const options = monthsFrom(0, 6);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const toggle = (m: string) => setMonths((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : cur.length < 3 ? [...cur, m] : cur));
  const close = () => {
    setSent(false);
    setError('');
    onClose();
  };
  const send = async () => {
    if (!months.length) return setError('Choose at least one month.');
    // The website asks for a first and last month, so the months must be next to each other.
    const idx = months.map((m) => options.findIndex((o) => o.key === m)).sort((a, b) => a - b);
    if (idx[idx.length - 1] - idx[0] + 1 !== idx.length) return setError('Choose months that follow each other, for example December, January and February.');
    if (reason.trim().length < 5) return setError('Tell the Treasurer briefly why.');
    if (!token) return setError('Please sign in again.');
    setError('');
    setBusy(true);
    try {
      await api('/api/holiday', { token, body: { from: options[idx[0]].key, to: options[idx[idx.length - 1]].key, reason } });
      setSent(true);
      setMonths([]);
      setReason('');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="Ask for a payment holiday" onClose={close}>
      {sent ? (
        <Done
          title="Request sent"
          text="The Treasurer will reply by email. Approved months won’t count as missed and no reminders are sent for them."
          onClose={close}
        />
      ) : (
        <>
          <T size={13} color={colors.inkSoft}>
            Going through a hard time? You can pause your monthly contribution for up to 3 months in any 12.
          </T>
          <Field label={`Which months? (${months.length} of 3)`}>
            <View style={styles.chips}>
              {options.map((m) => (
                <Chip key={m.key} label={m.label} on={months.includes(m.key)} onPress={() => toggle(m.key)} />
              ))}
            </View>
          </Field>
          <Field label="Why do you need a break?">
            <Input value={reason} onChangeText={setReason} multiline placeholder="A few words for the Treasurer" style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }} />
          </Field>
          {error ? <ErrorBox text={error} /> : null}
          <Button label={busy ? 'Sending…' : 'Send request'} variant={busy ? 'disabled' : 'primary'} onPress={send} />
        </>
      )}
    </Sheet>
  );
}

// ---------- Give your proxy ----------

export function ProxySheet({ visible, onClose, motionId, motionTitle }: { visible: boolean; onClose: () => void; motionId: string; motionTitle: string }) {
  const { token, refreshMe } = useSession();
  const [no, setNo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const close = () => {
    if (sent) setNo('');
    setSent(false);
    setError('');
    onClose();
  };
  const send = async () => {
    const holderNo = no.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^HBC-[A-Z]+-\d{2}-\d{5}$/.test(holderNo)) return setError('Membership numbers look like HBC-EDO-26-00013 — please check and try again.');
    if (!token) return setError('Please sign in again.');
    setError('');
    setBusy(true);
    try {
      await api('/api/proxy', { token, body: { motionId, holderNo } });
      setSent(true);
      refreshMe();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet visible={visible} title="Give your proxy" onClose={close}>
      {sent ? (
        <Done title="Proxy given" text={`${no.trim().toUpperCase()} can now vote for you on “${motionTitle}”. You can cancel it until they vote.`} onClose={close} />
      ) : (
        <>
          <T size={13} color={colors.inkSoft}>
            Can’t vote on “{motionTitle}”? Another member can vote for you. They must be a HomeBridge member, and no one may hold more than 5 proxies (bye-law 16.4).
          </T>
          <Field label="Their membership number">
            <Input value={no} onChangeText={setNo} autoCapitalize="characters" placeholder="HBC-EDO-26-00013" />
          </Field>
          {error ? <ErrorBox text={error} /> : null}
          <Button label={busy ? 'Sending…' : 'Give my proxy'} variant={busy ? 'disabled' : 'primary'} onPress={send} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.chipBorder, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  source: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, backgroundColor: colors.mint },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10 },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  ok: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
});
