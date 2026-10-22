import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { colors, fonts, TAB_BAR_HEIGHT } from '@/constants/theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

type TProps = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  serif?: boolean;
  style?: StyleProp<TextStyle>;
};

// App text. `serif` uses Lora (headings), otherwise Poppins.
export function T({ size = 14, weight = 'regular', color = colors.ink, serif, style, ...rest }: TProps) {
  const fontFamily = serif ? (weight === 'semibold' ? fonts.serifSemibold : fonts.serifBold) : fonts[weight];
  return <Text {...rest} style={[{ fontFamily, fontSize: size, color }, style]} />;
}

type ScreenProps = {
  children: ReactNode;
  background?: string;
  /** Leave room for the bottom tab bar. */
  withTabBar?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function Screen({
  children,
  background = colors.paper,
  withTabBar,
  edges = ['top'],
  contentStyle,
  scroll = true,
}: ScreenProps) {
  const padding = { paddingHorizontal: 20, paddingTop: 12, paddingBottom: withTabBar ? TAB_BAR_HEIGHT + 24 : 24 };
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1, gap: 14 }, padding, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, gap: 14 }, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function BackButton({ onPress, color = colors.green }: { onPress?: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={6}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={styles.back}>
      <Icon name="back" size={22} color={color} strokeWidth={2} />
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'gold' | 'outline' | 'mint' | 'disabled';
  height?: number;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  textSize?: number;
};

export function Button({ label, onPress, variant = 'primary', height = 54, style, icon, textSize = 16 }: ButtonProps) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={variant === 'disabled'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}>
      {icon}
      <T size={textSize} weight="semibold" color={v.text}>
        {label}
      </T>
    </Pressable>
  );
}

const buttonVariants = {
  primary: { bg: colors.green, border: colors.green, text: colors.white },
  gold: { bg: colors.gold, border: colors.gold, text: colors.ink },
  outline: { bg: 'transparent', border: colors.green, text: colors.green },
  mint: { bg: colors.mint, border: colors.mint, text: colors.ink },
  disabled: { bg: colors.line, border: colors.line, text: colors.muted },
};

export function Toggle({ on }: { on: boolean }) {
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: on ? colors.green : colors.inputBorder, justifyContent: on ? 'flex-end' : 'flex-start' },
      ]}>
      <View style={styles.thumb} />
    </View>
  );
}

export function Pill({ label, tone = 'green' }: { label: string; tone?: 'green' | 'gold' }) {
  const bg = tone === 'green' ? colors.mint : colors.cream;
  const fg = tone === 'green' ? colors.green : colors.goldText;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <T size={11} weight="semibold" color={fg}>
        {label}
      </T>
    </View>
  );
}

export function ProgressBar({ value, color = colors.green }: { value: number; color?: string }) {
  return (
    <View style={styles.progress}>
      <View style={{ width: `${value}%`, height: 8, backgroundColor: color }} />
    </View>
  );
}

export function Radio({ on, color = colors.green }: { on: boolean; color?: string }) {
  return (
    <View style={[styles.radio, { borderColor: color }]}>
      {on && <View style={[styles.radioDot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  button: {
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { width: 46, height: 28, borderRadius: 14, padding: 3, flexDirection: 'row' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  progress: { height: 8, borderRadius: 4, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
