import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { T } from '@/components/ui';
import { colors, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useSession } from '@/lib/session';
import { AccountLoading } from '@/components/account-loading';

const tabs: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  contribute: { label: 'Contribute', icon: 'contribute' },
  projects: { label: 'Projects', icon: 'projects' },
  vote: { label: 'Vote', icon: 'vote' },
  profile: { label: 'Profile', icon: 'profile' },
};

function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const current = state.routes[state.index]?.name;
        // My account sits under Profile, so keep the Profile tab lit there.
        const active = state.index === index || (route.name === 'profile' && current === 'account') || (route.name === 'home' && (current === 'forms' || current === 'payments'));
        const color = active ? colors.green : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => navigateToTab(route.key)}
            style={styles.item}>
            <View style={[styles.indicator, active && { backgroundColor: colors.gold }]} />
            <Icon name={tab.icon} size={24} color={color} />
            <T size={11} weight={active ? 'semibold' : 'medium'} color={color}>
              {tab.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  // Member screens need a sign-in. Wait until the saved sign-in has been checked, then send
  // anyone without one to the Sign in screen.
  const { ready, token, me, meError, refreshMe, signOut } = useSession();
  if (!ready) return null;
  if (!token) return <Redirect href="/sign-in" />;
  // Never fall back to demo screens: until the account has loaded, show loading or the error.
  if (!me) return <AccountLoading error={meError} retry={refreshMe} signOut={signOut} />;
  // Applicants haven't got member screens yet — they get the applicant dashboard.
  if (me && !me.memberNo) return <Redirect href="/applicant" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="contribute" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="vote" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="forms" />
      <Tabs.Screen name="payments" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  indicator: { width: 22, height: 3, borderRadius: 2 },
});
