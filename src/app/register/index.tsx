import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PasswordInput, Segment } from '@/components/form';
import { MIN_PASSWORD_LENGTH, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';

// Simple tap-to-cycle picker. Swap for a proper bottom-sheet select later.
function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => onChange(options[(options.indexOf(value) + 1) % options.length])}
      style={[styles.input, styles.select]}>
      <T size={15} numberOfLines={1} style={{ flex: 1 }}>
        {value}
      </T>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <View style={[{ gap: 6 }, flex && { flex: 1 }]}>
      <T size={13} weight="medium">
        {label}
      </T>
      {children}
    </View>
  );
}

function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, styles.inputText, props.style]} />;
}

export default function Register() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const home = type === 'home';

  const { draft, set, reset } = useRegister();
  const { name, code, phone, email, contactMethod, password, passwordConfirm } = draft;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  // Same check as the website: 10 to 15 digits with the country code.
  const phoneOk = /^\d{10,15}$/.test((code + phone).replace(/\D/g, '').replace(/^0+/, ''));
  const passwordOk = password.length >= MIN_PASSWORD_LENGTH;
  const matchOk = passwordOk && password === passwordConfirm;

  // Start a fresh form when the member type changes (Welcome → Diaspora or Home).
  useEffect(() => {
    if (draft.home !== home) reset(home);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  const missing = [
    name.trim().length <= 1 && 'type your full name',
    !phoneOk && 'type your full mobile number',
    !emailOk && 'type your email address',
    !passwordOk && `choose a password of at least ${MIN_PASSWORD_LENGTH} characters`,
    passwordOk && !matchOk && 'type the same password twice',
  ].filter(Boolean) as string[];
  const canContinue = missing.length === 0;

  const phoneField = (
        <Field label="Mobile number (WhatsApp)">
          <View style={styles.row}>
            <View style={{ width: 96 }}>
              <Select label="Country code" value={code} options={['+44', '+234', '+1']} onChange={(v) => set({ code: v })} />
            </View>
            <Input
              value={phone}
              onChangeText={(v) => set({ phone: v })}
              placeholder={home ? '0810 583 2602' : '7700 900123'}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={{ flex: 1, minWidth: 0 }}
            />
          </View>
        </Field>
  );
  const emailField = (
        <Field label={contactMethod === 'email' ? 'Email address' : 'Email'}>
          <Input
            value={email}
            onChangeText={(v) => set({ email: v })}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <T size={12} color={colors.muted}>
            {contactMethod === 'email' ? 'Use an address you check often.' : 'For your member pack and statements.'}
          </T>
        </Field>
  );

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={1} title="Your account" />

      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Create your membership
        </T>
        <T size={13} color={colors.muted}>
          {home ? 'Home member' : 'Diaspora member'} · takes about 3 minutes
        </T>
      </View>

      <View style={{ gap: 12 }}>
        <T size={16} weight="semibold">
          Your account
        </T>
        <T size={12} color={colors.muted} style={{ marginTop: -6 }}>
          Choose how we reach you and set a password. These are how you sign in to your account.
        </T>
        <Field label="How should we reach you?">
          <Segment
            value={contactMethod}
            onChange={(v) => set({ contactMethod: v })}
            options={[
              { key: 'phone', label: 'Phone (WhatsApp)' },
              { key: 'email', label: 'Email' },
            ]}
          />
          <T size={12} color={colors.muted}>
            {contactMethod === 'phone' ? 'We send a code by WhatsApp or text.' : 'We send a code by email.'}
          </T>
        </Field>
        {contactMethod === 'phone' ? phoneField : emailField}
        <Field label="Choose a password">
          <PasswordInput
            value={password}
            onChangeText={(v) => set({ password: v })}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
          />
          <T size={12} color={passwordOk ? colors.green : colors.muted}>
            {passwordOk
              ? 'Good length ✓'
              : `At least ${MIN_PASSWORD_LENGTH} characters. Three random words is easy to remember and hard to guess.`}
          </T>
        </Field>
        <Field label="Type it again">
          <PasswordInput
            value={passwordConfirm}
            onChangeText={(v) => set({ passwordConfirm: v })}
            placeholder="Same password"
            autoComplete="new-password"
          />
          {passwordConfirm.length > 0 && (
            <T size={12} color={matchOk ? colors.green : colors.goldText}>
              {matchOk ? 'Passwords match ✓' : 'The two passwords don’t match.'}
            </T>
          )}
        </Field>
        <View style={styles.signInNote}>
          <T size={12}>
            Use your {contactMethod === 'phone' ? 'phone number' : 'email address'} and this password to sign in to the app. Never share it.
            Nobody from HomeBridge will ever ask you for your password.
          </T>
        </View>

        <T size={16} weight="semibold" style={{ marginTop: 8 }}>
          About you
        </T>
        <Field label="Full name (as on your ID)">
          <Input value={name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Ada Okafor" autoComplete="name" />
        </Field>
        {contactMethod === 'phone' ? emailField : phoneField}
      </View>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {!canContinue && (
          <T size={12} color={colors.goldText} style={{ textAlign: 'center' }}>
            To continue, please {missing.join(', ')}.
          </T>
        )}
        <Button
          label="Continue"
          variant={canContinue ? 'primary' : 'disabled'}
          onPress={() => router.push('/register/about-you')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  signInNote: { backgroundColor: colors.mint, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  inputText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  select: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  next: { backgroundColor: colors.mint, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
