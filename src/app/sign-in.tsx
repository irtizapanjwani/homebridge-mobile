import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Checkbox, Field, Input, PasswordInput, TextLink } from '@/components/form';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

export default function SignIn() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [keep, setKeep] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const session = useSession();

  const canSignIn = login.trim().length > 2 && password.length > 0 && !busy;

  // Checks the details with the API (same accounts as the website). Only a correct email /
  // membership number / phone + password gets in.
  const signIn = async () => {
    if (!canSignIn) return;
    setBusy(true);
    setError('');
    try {
      await session.signIn(login.trim(), password, keep);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <BackButton />

      <View style={styles.head}>
        <Logo size={64} />
        <T serif size={28} color={colors.green}>
          Welcome back
        </T>
        <T size={14} color={colors.muted} style={{ textAlign: 'center' }}>
          Sign in to see your savings, projects and votes.
        </T>
      </View>

      <Field label="Member ID, email or phone">
        <Input
          value={login}
          onChangeText={setLogin}
          placeholder="Email, HBC- number or phone"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
        />
      </Field>

      <Field label="Password">
        <PasswordInput value={password} onChangeText={setPassword} placeholder="Your password" autoComplete="password" onSubmitEditing={canSignIn ? signIn : undefined} />
      </Field>

      <View style={styles.between}>
        <Checkbox checked={keep} onPress={() => setKeep(!keep)}>
          <T size={13}>Keep me signed in</T>
        </Checkbox>
        <TextLink label="Forgot password?" onPress={() => router.push('/forgot-password')} />
      </View>

      {error ? (
        <View style={styles.error} accessibilityRole="alert">
          <T size={13} color="#9A3B26">
            {error}
          </T>
        </View>
      ) : null}

      <Button label={busy ? 'Signing in…' : 'Sign in'} variant={canSignIn ? 'primary' : 'disabled'} onPress={signIn} />

      <View style={{ marginTop: 'auto', gap: 10, alignItems: 'center', paddingTop: 16 }}>
        <T size={13}>
          New to HomeBridge? <TextLink label="Become a member" onPress={() => router.replace('/')} />
        </T>
        <View style={[styles.between, { gap: 6, justifyContent: 'center' }]}>
          <Icon name="chat" size={16} color={colors.muted} strokeWidth={1.8} />
          <T size={12} color={colors.muted}>
            Trouble signing in? <TextLink label="Help on WhatsApp" size={12} color={colors.muted} />
          </T>
        </View>
        <T size={11} color={colors.muted} style={{ textAlign: 'center' }}>
          Member-owned · one member, one vote · managed by VEKAT Group Ltd
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 6, marginBottom: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { backgroundColor: '#FDF1EC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F0D3C7' },
});
