import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Field, PasswordInput, TextLink } from '@/components/form';
import { ErrorBox } from '@/components/applicant';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { api } from '@/lib/api';
import { homeFor, useSession } from '@/lib/session';
import { colors, fonts } from '@/constants/theme';

const CODE_SECONDS = 15 * 60;

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (pw.length >= 14) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const label = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong password'][score];
  return { score, label };
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.rule}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path
          d="M5 12l5 5L19 7"
          stroke={ok ? colors.green : colors.inputBorder}
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <T size={13} color={ok ? colors.ink : colors.muted}>
        {label}
      </T>
    </View>
  );
}

export default function ResetPassword() {
  const { login = '' } = useLocalSearchParams<{ login?: string }>();
  const { adopt } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_SECONDS);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const { score, label } = strength(password);
  // Same rule as the website: at least 10 characters (length beats punctuation rules).
  const rules = {
    length: password.trim().length >= 10,
    match: password.length > 0 && password === confirm,
  };
  const canSave = code.length === 6 && secondsLeft > 0 && Object.values(rules).every(Boolean);

  // Saves the new password and signs straight in, like the website.
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string; expiresAt: string }>('/api/auth/reset', { body: { login, code, password, passwordConfirm: confirm } });
      const me = await adopt(res.token, res.expiresAt);
      router.dismissAll();
      router.replace(homeFor(me));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not set your password. Please try again.');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    setNote('');
    try {
      await api('/api/auth/forgot', { body: { login } });
      setCode('');
      setSecondsLeft(CODE_SECONDS);
      setNote('A new code is on its way. The old one no longer works.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We couldn’t send a code. Please try again.');
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <View style={styles.row}>
        <BackButton />
        <T size={13} color={colors.muted}>
          Password help
        </T>
      </View>

      <View style={{ gap: 6 }}>
        <T serif size={26} color={colors.green}>
          Create a new password
        </T>
        <T size={14} color={colors.muted}>
          If we found your account, we’ve emailed a 6-digit code to the address on it. Enter it below, then choose a new password.
        </T>
      </View>

      <Field label="6-digit code">
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={colors.inputBorder}
          style={styles.code}
          accessibilityLabel="6-digit code"
        />
        <T size={12} color={colors.muted}>
          {secondsLeft > 0 ? `Code expires in ${mm}:${ss}` : 'Code expired'} ·{' '}
          <TextLink label="Resend" size={12} color={colors.ink} onPress={resend} />
        </T>
      </Field>

      <Field label="New password">
        <PasswordInput value={password} onChangeText={setPassword} placeholder="New password" autoComplete="new-password" />
        <View style={styles.bars}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.bar, { backgroundColor: i < score ? colors.green : colors.lineSoft }]} />
          ))}
        </View>
        {password.length > 0 && (
          <T size={12} weight="semibold" color={score >= 3 ? colors.green : colors.goldText}>
            {label}
          </T>
        )}
      </Field>

      <Field label="Confirm new password">
        <PasswordInput value={confirm} onChangeText={setConfirm} placeholder="Type it again" autoComplete="new-password" />
      </Field>

      <View style={styles.rules}>
        <Rule ok={rules.length} label="At least 10 characters" />
        <Rule ok={rules.match} label="Both passwords match" />
      </View>

      <View style={{ marginTop: 'auto', gap: 8, paddingTop: 16 }}>
        {note ? (
          <T size={13} color={colors.green} style={{ textAlign: 'center' }}>
            {note}
          </T>
        ) : null}
        {error ? <ErrorBox text={error} /> : null}
        <Button label={busy ? 'Saving…' : 'Save new password'} variant={canSave && !busy ? 'primary' : 'disabled'} onPress={save} />
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          No email? Check your spam folder, or tap Resend.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: {
    height: 56,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 24,
    letterSpacing: 10,
    color: colors.ink,
  },
  bars: { flexDirection: 'row', gap: 6, marginTop: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  rules: { backgroundColor: colors.mint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
