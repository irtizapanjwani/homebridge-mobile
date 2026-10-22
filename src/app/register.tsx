import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BackButton, Button, Screen, T } from '@/components/ui';
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
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

  const [name, setName] = useState('');
  const [code, setCode] = useState(home ? '+234' : '+44');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(home ? 'Nigeria' : 'United Kingdom');
  const [cohort, setCohort] = useState('Edo');
  const [agreed, setAgreed] = useState(false);

  const canContinue = agreed && name.trim().length > 1 && phone.trim().length > 5;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <View style={styles.row}>
        <BackButton />
        <T size={13} color={colors.muted}>
          Step 1 of 4 · Your details
        </T>
      </View>

      <View style={styles.steps}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.step, { backgroundColor: i === 0 ? colors.green : colors.line }]} />
        ))}
      </View>

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
          <Input value={name} onChangeText={setName} placeholder="e.g. Ada Okafor" autoComplete="name" />
        </Field>
        <Field label="Mobile number (WhatsApp)">
          <View style={styles.row}>
            <View style={{ width: 96 }}>
              <Select label="Country code" value={code} options={['+44', '+234', '+1']} onChange={setCode} />
            </View>
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="7700 900123"
              keyboardType="phone-pad"
              style={{ flex: 1, minWidth: 0 }}
            />
          </View>
        </Field>
        <Field label="Email (for receipts)">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>
        <View style={styles.row}>
          <Field label="Country you live in">
            <Select
              label="Country"
              value={country}
              options={['United Kingdom', 'Nigeria', 'Ghana', 'United States']}
              onChange={setCountry}
            />
          </Field>
          <Field label="Home cohort">
            <Select label="Home cohort" value={cohort} options={['Edo', 'Abuja (FCT)', 'Other state']} onChange={setCohort} />
          </Field>
        </View>
      </View>

      <View style={styles.next}>
        <T size={13} weight="semibold" color={colors.green}>
          Next steps
        </T>
        {[
          home
            ? 'Verify ID — NIN at home. Photo from your phone.'
            : 'Verify ID — passport or driving licence abroad; NIN at home. Photo from your phone.',
          `Pay the ${home ? '₦10,000' : '£10'} joining fee to VEKAT Nigeria Ltd, the cooperative’s manager.`,
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
        onPress={() => setAgreed(!agreed)}
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

      <Button
        label="Continue"
        variant={canContinue ? 'primary' : 'disabled'}
        style={{ marginTop: 'auto' }}
        onPress={() => router.replace('/home')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 5, borderRadius: 3 },
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
