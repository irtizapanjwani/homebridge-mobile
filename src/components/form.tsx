import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
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
