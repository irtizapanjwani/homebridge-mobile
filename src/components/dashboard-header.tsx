import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { T } from '@/components/ui';
import { colors } from '@/constants/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * Top of both dashboards, the usual app pattern: small logo on the left, the person's initials on
 * the right (opens their profile / application), and the greeting underneath.
 */
export function DashboardHeader({ firstName, initials, onAvatar, avatarLabel }: { firstName: string; initials: string; onAvatar: () => void; avatarLabel: string }) {
  return (
    <View style={{ gap: 14, marginTop: 4 }}>
      <View style={styles.bar}>
        <Logo size={36} />
        <T serif size={18} color={colors.green} style={{ flex: 1 }}>
          HomeBridge
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel={avatarLabel} onPress={onAvatar} hitSlop={6} style={styles.avatar}>
          <T size={14} weight="bold" color={colors.ink}>
            {initials || '•'}
          </T>
        </Pressable>
      </View>
      <T serif size={28} color={colors.green}>
        {greeting()}
        {firstName ? ', ' : '.'}
        {firstName ? (
          <T serif size={28} color={colors.goldText}>
            {firstName}.
          </T>
        ) : null}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
});
