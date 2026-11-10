import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { PopupFrame } from '@/components/sheet';
import { T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';

// Shared form pieces for Sign in, Forgot password and Reset password.

export function Field({ label, children, flex }: { label: string; children: ReactNode; flex?: boolean }) {
  return (
    <View style={[{ gap: 6 }, flex && { flex: 1 }]}>
      <T size={13} weight="medium">
        {label}
      </T>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, styles.inputText, props.style]}
    />
  );
}

export function PasswordInput(props: TextInputProps) {
  const [shown, setShown] = useState(false);
  return (
    <View style={[styles.input, styles.row]}>
      <TextInput
        placeholderTextColor={colors.muted}
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        style={[styles.inputText, { flex: 1, height: '100%', minWidth: 0 }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={shown ? 'Hide password' : 'Show password'}
        hitSlop={8}
        onPress={() => setShown(!shown)}>
        <Icon name={shown ? 'eyeOff' : 'eye'} size={20} color={colors.muted} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

export function Checkbox({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.row, { gap: 10, minHeight: 40 }]}>
      <View style={[styles.checkbox, checked && { backgroundColor: colors.green, borderColor: colors.green }]}>
        {checked && (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M5 12l5 5L19 7" stroke={colors.white} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </Svg>
        )}
      </View>
      {children}
    </Pressable>
  );
}

/** Two-option switch, e.g. "WhatsApp / SMS" | "Email". */
export function Segment<K extends string>({
  value,
  options,
  onChange,
}: {
  value: K;
  options: { key: K; label: string }[];
  onChange: (k: K) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[styles.segmentItem, on && styles.segmentOn]}>
            <T size={14} weight={on ? 'semibold' : 'medium'} color={on ? colors.green : colors.muted}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tap-to-cycle picker (same as on Register). */
export function Select({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => onChange(options[(options.indexOf(value) + 1) % options.length])}
      style={[styles.input, styles.row, { gap: 6, paddingHorizontal: 10 }]}>
      <T size={15} numberOfLines={1} style={{ flex: 1 }}>
        {value}
      </T>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

/** Underlined text link. */
export function TextLink({ label, onPress, size = 13, color = colors.green }: { label: string; onPress?: () => void; size?: number; color?: string }) {
  return (
    <T
      size={size}
      weight="medium"
      color={color}
      accessibilityRole="link"
      onPress={onPress}
      style={{ textDecorationLine: 'underline' }}>
      {label}
    </T>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 44, borderRadius: 10, paddingHorizontal: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  inputText: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', backgroundColor: colors.segment, borderRadius: 14, padding: 4, gap: 4 },
  segmentItem: { flex: 1, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.white },
});

/** Opens a list to choose from — for long lists like states and countries. */
export function ListPicker({ label, value, options, onChange, placeholder = 'Choose…' }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'not chosen'}`}
        onPress={() => setOpen(true)}
        style={[styles.input, styles.row, { gap: 6 }]}>
        <T size={15} numberOfLines={1} color={value ? colors.ink : colors.muted} style={{ flex: 1 }}>
          {value || placeholder}
        </T>
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </Svg>
      </Pressable>
      <PopupFrame visible={open} onClose={() => setOpen(false)} place="bottom" heightRatio={0.55} panelStyle={{ backgroundColor: colors.white, gap: 0, paddingTop: 14 }}>
            <View style={[styles.row, { justifyContent: 'space-between', paddingBottom: 8 }]}>
              <T size={16} weight="semibold">
                {label}
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)} hitSlop={8}>
                <T size={20} color={colors.green}>
                  ✕
                </T>
              </Pressable>
            </View>
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
              {options.map((o) => (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: o === value }}
                  onPress={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  style={[styles.option, o === value && { backgroundColor: colors.mint }]}>
                  <T size={15} weight={o === value ? 'semibold' : 'regular'} color={o === value ? colors.green : colors.ink} style={{ flex: 1 }}>
                    {o}
                  </T>
                  {o === value ? <Icon name="check" size={16} color={colors.green} strokeWidth={2.6} /> : null}
                </Pressable>
              ))}
            </ScrollView>
      </PopupFrame>
    </>
  );
}

/** Dialling codes for the countries on the registration form (same list as the website), Nigeria and the UK first. */
export const DIAL_CODES = [
  { country: 'Nigeria', flag: '🇳🇬', code: '+234' },
  { country: 'United Kingdom', flag: '🇬🇧', code: '+44' },
  { country: 'United States', flag: '🇺🇸', code: '+1' },
  { country: 'Canada', flag: '🇨🇦', code: '+1' },
  { country: 'Ireland', flag: '🇮🇪', code: '+353' },
  { country: 'Germany', flag: '🇩🇪', code: '+49' },
  { country: 'Netherlands', flag: '🇳🇱', code: '+31' },
  { country: 'Italy', flag: '🇮🇹', code: '+39' },
  { country: 'France', flag: '🇫🇷', code: '+33' },
  { country: 'Spain', flag: '🇪🇸', code: '+34' },
  { country: 'Belgium', flag: '🇧🇪', code: '+32' },
  { country: 'United Arab Emirates', flag: '🇦🇪', code: '+971' },
  { country: 'Saudi Arabia', flag: '🇸🇦', code: '+966' },
  { country: 'Qatar', flag: '🇶🇦', code: '+974' },
  { country: 'South Africa', flag: '🇿🇦', code: '+27' },
  { country: 'Ghana', flag: '🇬🇭', code: '+233' },
  { country: 'Kenya', flag: '🇰🇪', code: '+254' },
  { country: 'Australia', flag: '🇦🇺', code: '+61' },
] as const;

/** Country code dropdown: shows the flag and code, and opens a list of countries to choose from. */
export function CountryCodePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null); // which country, since +1 is shared
  const current = DIAL_CODES.find((d) => d.country === picked && d.code === value) ?? DIAL_CODES.find((d) => d.code === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Country code: ${current ? `${current.country} ${current.code}` : value}. Change`}
        onPress={() => setOpen(true)}
        style={[styles.input, styles.row, { gap: 6, paddingHorizontal: 10 }]}>
        <T size={18}>{current?.flag ?? '🌐'}</T>
        <T size={15} style={{ flex: 1 }}>
          {value}
        </T>
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </Svg>
      </Pressable>
      <PopupFrame visible={open} onClose={() => setOpen(false)} place="bottom" heightRatio={0.55} panelStyle={{ backgroundColor: colors.white, gap: 0, paddingTop: 14 }}>
        <View style={[styles.row, { justifyContent: 'space-between', paddingBottom: 8 }]}>
          <T size={16} weight="semibold">
            Country code
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)} hitSlop={8}>
            <T size={20} color={colors.green}>
              ✕
            </T>
          </Pressable>
        </View>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
          {DIAL_CODES.map((d) => {
            const on = d === current;
            return (
              <Pressable
                key={d.country}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setPicked(d.country);
                  onChange(d.code);
                  setOpen(false);
                }}
                style={[styles.option, { gap: 10 }, on && { backgroundColor: colors.mint }]}>
                <T size={20}>{d.flag}</T>
                <T size={15} weight={on ? 'semibold' : 'regular'} color={on ? colors.green : colors.ink} style={{ flex: 1 }}>
                  {d.country}
                </T>
                <T size={15} weight="semibold" color={on ? colors.green : colors.muted}>
                  {d.code}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
      </PopupFrame>
    </>
  );
}

/**
 * Turns what was typed into DD/MM/YYYY, adding the slashes as you go: "09" → "09/", "0903" → "09/03/".
 * Deleting works naturally: backspace over a slash also removes the digit before it.
 */
export function formatDateTyping(prev: string, next: string) {
  let digits = next.replace(/\D/g, '').slice(0, 8);
  // Backspace that only removed a slash: take the digit before it too, or the slash would come straight back.
  if (next.length < prev.length && prev.endsWith('/') && digits === prev.replace(/\D/g, '')) digits = digits.slice(0, -1);
  const deleting = next.length < prev.length;
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4);
  let out = d;
  if (digits.length > 2 || (digits.length === 2 && !deleting)) out += '/' + m;
  if (digits.length > 4 || (digits.length === 4 && !deleting)) out += '/' + y;
  return out;
}

/** A date box (DD/MM/YYYY) that adds the slashes for you. */
export function DateInput({ value, onChangeText, ...rest }: Omit<TextInputProps, 'onChangeText' | 'value'> & { value: string; onChangeText: (v: string) => void }) {
  return (
    <Input
      {...rest}
      value={value}
      onChangeText={(t) => onChangeText(formatDateTyping(value, t))}
      placeholder={rest.placeholder ?? 'DD/MM/YYYY'}
      keyboardType="number-pad"
      maxLength={10}
    />
  );
}
