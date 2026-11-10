import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { ErrorBox, OFFICE_WHATSAPP } from '@/components/applicant';
import { api } from '@/lib/api';

import { CountryCodePicker, Field, Input, Segment, TextLink } from '@/components/form';
import { Icon } from '@/components/icon';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

type Channel = 'phone' | 'email';

export default function ForgotPassword() {
  const [channel, setChannel] = useState<Channel>('phone');
  const [code, setCode] = useState('+44');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSend = channel === 'phone' ? phone.replace(/\D/g, '').length >= 7 : /\S+@\S+\.\S+/.test(email);

  // The code always goes to the email on the account (there is no SMS service yet). The phone
  // number is only used to find the account.
  const send = async () => {
    const login = channel === 'phone' ? `${code}${phone.replace(/\D/g, '')}` : email.trim();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/forgot', { body: { login } });
      router.push({ pathname: '/reset-password', params: { login } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We couldn’t send a code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <View style={styles.row}>
        <BackButton />
        <T size={13} color={colors.muted}>
          Password help
        </T>
      </View>

      <View style={styles.lock}>
        <Icon name="lock" size={24} color={colors.green} strokeWidth={1.8} />
      </View>

      <View style={{ gap: 6 }}>
        <T serif size={26} color={colors.green}>
          Forgot your password?
        </T>
        <T size={14} color={colors.muted}>
          No problem. Tell us how you joined and we’ll email a 6-digit code to the address on your account.
        </T>
      </View>

      <Field label="Find my account by">
        <Segment
          value={channel}
          onChange={setChannel}
          options={[
            { key: 'phone', label: 'Phone number' },
            { key: 'email', label: 'Email' },
          ]}
        />
      </Field>

      {channel === 'phone' ? (
        <Field label="Mobile number (WhatsApp)">
          <View style={[styles.row, { gap: 8 }]}>
            <View style={{ width: 112 }}>
              <CountryCodePicker value={code} onChange={setCode} />
            </View>
            <View style={{ flex: 1 }}>
              <Input value={phone} onChangeText={setPhone} placeholder="7700 900123" keyboardType="phone-pad" autoComplete="tel" />
            </View>
          </View>
        </Field>
      ) : (
        <Field label="Email you joined with">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </Field>
      )}

      <View style={{ marginTop: 'auto', gap: 8, paddingTop: 24 }}>
        {error ? <ErrorBox text={error} /> : null}
        <Button label={busy ? 'Sending…' : 'Send reset code'} variant={canSend && !busy ? 'primary' : 'disabled'} onPress={send} />
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <TextLink label="Back to sign in" size={14} color={colors.ink} onPress={() => router.back()} />
        </View>
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          Can’t reach your phone or email? <TextLink label="Help on WhatsApp" size={12} color={colors.muted} onPress={() => Linking.openURL(OFFICE_WHATSAPP)} />
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lock: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
