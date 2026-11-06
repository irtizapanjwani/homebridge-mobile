import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Checkbox, Field, Input, PasswordInput, TextLink } from '@/components/form';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function SignIn() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [keep, setKeep] = useState(true);

  const canSignIn = login.trim().length > 2 && password.length > 0;

  // TODO: call the website's member login API. For now any input signs in to the demo data.
  const signIn = () => router.replace('/home');

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
          placeholder="e.g. HB-EDO-0123"
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

      <Button label="Sign in" variant={canSignIn ? 'primary' : 'disabled'} onPress={signIn} />

      <View style={styles.or}>
        <View style={styles.line} />
        <T size={12} color={colors.muted}>
          or
        </T>
        <View style={styles.line} />
      </View>

      <Button
        label="Sign in with PIN or fingerprint"
        variant="outline"
        textSize={15}
        icon={<Icon name="fingerprint" size={20} color={colors.green} strokeWidth={1.8} />}
        onPress={signIn}
      />

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
  or: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
});
