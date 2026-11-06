import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Field, PasswordInput, TextLink } from '@/components/form';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';

const CODE_SECONDS = 15 * 60;

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /\d/.test(pw)) score++;
  if (pw.length >= 12) score++;
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
  const { sentTo } = useLocalSearchParams<{ sentTo?: string }>();
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
  const rules = {
    length: password.length >= 8,
    capNum: /[A-Z]/.test(password) && /\d/.test(password),
    // TODO: the server checks this against the old password; here we only know it's not empty.
    notOld: password.length > 0,
    match: password.length > 0 && password === confirm,
  };
  const canSave = code.length === 6 && secondsLeft > 0 && Object.values(rules).every(Boolean);

  // TODO: call the website's reset-password API, then send the member to Sign in.
  const save = () => router.dismissTo('/sign-in');

  // TODO: call the website's "resend code" API.
  const resend = () => {
    setCode('');
    setSecondsLeft(CODE_SECONDS);
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
          Enter the 6-digit code we sent to {sentTo || 'your phone'}, then choose a new password.
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
        <Rule ok={rules.length} label="At least 8 characters" />
        <Rule ok={rules.capNum} label="One capital letter and one number" />
        <Rule ok={rules.notOld} label="Not your old password" />
        <Rule ok={rules.match} label="Both passwords match" />
      </View>

      <View style={{ marginTop: 'auto', gap: 8, paddingTop: 16 }}>
        <Button label="Save new password" variant={canSave ? 'primary' : 'disabled'} onPress={save} />
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          For your security, you’ll be signed out on all other devices.
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
