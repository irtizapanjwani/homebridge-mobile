import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PasswordInput } from '@/components/form';
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
  const { name, code, phone, email, password, passwordConfirm, country, cohort, agreed } = draft;
  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordOk = password.length >= MIN_PASSWORD_LENGTH;
  const matchOk = passwordOk && password === passwordConfirm;

  // Start a fresh form when the member type changes (Welcome → Diaspora or Home).
  useEffect(() => {
    if (draft.home !== home) reset(home);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  const missing = [
    name.trim().length <= 1 && 'type your full name',
    phone.trim().length <= 5 && 'type your mobile number',
    !emailOk && 'type your email address',
    !passwordOk && `choose a password of at least ${MIN_PASSWORD_LENGTH} characters`,
    passwordOk && !matchOk && 'type the same password twice',
    !agreed && 'tick the box to agree to the bye-laws',
  ].filter(Boolean) as string[];
  const canContinue = missing.length === 0;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={1} title="Your details" />

      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Create your membership
        </T>
        <T size={13} color={colors.muted}>
          {home ? 'Home member' : 'Diaspora member'} · takes about 3 minutes
        </T>
      </View>

      <View style={{ gap: 12 }}>
        <Field label="Full name (as on your ID)">
          <Input value={name} onChangeText={(v) => set({ name: v })} placeholder="e.g. Ada Okafor" autoComplete="name" />
        </Field>
        <Field label="Mobile number (WhatsApp)">
          <View style={styles.row}>
            <View style={{ width: 96 }}>
              <Select label="Country code" value={code} options={['+44', '+234', '+1']} onChange={(v) => set({ code: v })} />
            </View>
            <Input
              value={phone}
              onChangeText={(v) => set({ phone: v })}
              placeholder="7700 900123"
              keyboardType="phone-pad"
              style={{ flex: 1, minWidth: 0 }}
            />
          </View>
        </Field>
        <Field label="Email">
          <Input
            value={email}
            onChangeText={(v) => set({ email: v })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Field>
        <Field label="Choose a password">
          <PasswordInput
            value={password}
            onChangeText={(v) => set({ password: v })}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
          />
          <T size={12} color={passwordOk ? colors.green : colors.muted}>
            {passwordOk ? 'Good length ✓' : 'Tip: three random words are easy to remember and hard to guess.'}
          </T>
        </Field>
        <Field label="Type the password again">
          <PasswordInput
            value={passwordConfirm}
            onChangeText={(v) => set({ passwordConfirm: v })}
            placeholder="Same password"
            autoComplete="new-password"
          />
          {passwordConfirm.length > 0 && (
            <T size={12} color={matchOk ? colors.green : colors.goldText}>
              {matchOk ? 'Passwords match ✓' : 'Passwords don’t match yet'}
            </T>
          )}
        </Field>
        <T size={12} color={colors.muted}>
          You’ll sign in with your email or membership number and this password.
        </T>
        <View style={styles.row}>
          <Field label="Country you live in" flex>
            <Select
              label="Country"
              value={country}
              options={['United Kingdom', 'Nigeria', 'Ghana', 'United States']}
              onChange={(v) => set({ country: v })}
            />
          </Field>
          <Field label="Home cohort" flex>
            <Select label="Home cohort" value={cohort} options={['Edo', 'Abuja (FCT)', 'Other state']} onChange={(v) => set({ cohort: v })} />
          </Field>
        </View>
      </View>

      <View style={styles.next}>
        <T size={13} weight="semibold" color={colors.green}>
          Next steps
        </T>
        {[
          home
            ? 'Verify ID — BVN or NIN, plus a photo of your ID and proof of address.'
            : 'Verify ID — Non-Resident BVN or passport, plus a photo of your ID and proof of address.',
          `Pay the ${home ? '₦10,000' : '£10'} joining fee to VEKAT Group Ltd, the cooperative’s manager.`,
          'Get your member ID and set up your monthly contribution.',
        ].map((text, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
            <T size={13} weight="bold" color={colors.green}>
              {i + 2}
            </T>
            <T size={13} style={{ flex: 1 }}>
              {text}
            </T>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => set({ agreed: !agreed })}
        style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={[styles.checkbox, agreed && { backgroundColor: colors.green, borderColor: colors.green }]}>
          {agreed && (
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M5 12l5 5L19 7" stroke={colors.white} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            </Svg>
          )}
        </View>
        <T size={13} style={{ flex: 1 }}>
          I agree to the{' '}
          <T size={13} color={colors.green} weight="medium" style={{ textDecorationLine: 'underline' }}>
            HomeBridge bye-laws
          </T>{' '}
          and the one-member-one-vote rule.
        </T>
      </Pressable>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {!canContinue && (
          <T size={12} color={colors.goldText} style={{ textAlign: 'center' }}>
            To continue, please {missing.join(', ')}.
          </T>
        )}
        <Button
          label="Continue"
          variant={canContinue ? 'primary' : 'disabled'}
          onPress={() => router.push('/register/verify-id')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
