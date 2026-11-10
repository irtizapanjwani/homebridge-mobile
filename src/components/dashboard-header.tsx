import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/**
 * The bar at the top of every main screen: small logo and "HomeBridge" on the left, the person's
 * initials on the right. Tapping the initials opens Profile (or My account when already on Profile).
 */
export function AppBar({ initials, onAvatar, avatarLabel }: { initials?: string; onAvatar?: () => void; avatarLabel?: string }) {
  const { me } = useSession();
  return (
    <View style={styles.bar}>
      <Logo size={36} />
      <T serif size={18} color={colors.green} style={{ flex: 1 }}>
        HomeBridge
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={avatarLabel ?? 'Open my profile'}
        onPress={onAvatar ?? (() => router.navigate('/profile'))}
        hitSlop={6}
        style={styles.avatar}>
        <T size={14} weight="bold" color={colors.ink}>
          {initials ?? me?.initials ?? '•'}
        </T>
      </Pressable>
    </View>
  );
}

/**
 * Top of both dashboards, the usual app pattern: small logo on the left, the person's initials on
 * the right (opens their profile / application), and the greeting underneath.
 */
export function DashboardHeader({ firstName, initials, onAvatar, avatarLabel }: { firstName: string; initials: string; onAvatar: () => void; avatarLabel: string }) {
  return (
    <View style={{ gap: 14, marginTop: 4 }}>
      <AppBar initials={initials || '•'} onAvatar={onAvatar} avatarLabel={avatarLabel} />
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
