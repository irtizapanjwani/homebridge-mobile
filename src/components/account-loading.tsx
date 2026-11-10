import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorBox } from '@/components/applicant';
import { Button, T } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Shown while the signed-in account loads, or if it can't be loaded — never demo data. */
export function AccountLoading({ error, retry, signOut }: { error: string; retry: () => unknown; signOut: () => Promise<void> }) {
  useEffect(() => {
    if (!error) retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, justifyContent: 'center', padding: 24, gap: 16 }}>
      {error ? (
        <View style={{ gap: 14 }}>
          <T serif size={22} color={colors.green}>
            We couldn’t load your account
          </T>
          <ErrorBox text={error} />
          <Button label="Try again" onPress={retry} />
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await signOut();
              router.replace('/sign-in');
            }}
            style={{ alignSelf: 'center', padding: 10 }}>
            <T size={14} weight="semibold" color={colors.muted}>
              Sign out
            </T>
          </Pressable>
        </View>
      ) : (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.green} size="large" />
          <T size={14} color={colors.muted}>
            Loading your account…
          </T>
        </View>
      )}
    </SafeAreaView>
  );
}
