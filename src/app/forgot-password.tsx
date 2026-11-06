import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, Input, Segment, Select, TextLink } from '@/components/form';
import { Icon } from '@/components/icon';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

type Channel = 'phone' | 'email';

export default function ForgotPassword() {
  const [channel, setChannel] = useState<Channel>('phone');
  const [code, setCode] = useState('+44');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const canSend = channel === 'phone' ? phone.replace(/\D/g, '').length >= 7 : /\S+@\S+\.\S+/.test(email);

  // TODO: call the website's "send reset code" API.
  const send = () => {
    const sentTo =
      channel === 'phone'
        ? `${code} ${phone.trim().slice(0, 4)} ••• ${phone.replace(/\D/g, '').slice(-3)}`
        : email.trim();
    router.push({ pathname: '/reset-password', params: { sentTo } });
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
          No problem. Tell us how you joined and we’ll send you a 6-digit code to reset it.
        </T>
      </View>

      <Field label="Send my code by">
        <Segment
          value={channel}
          onChange={setChannel}
          options={[
            { key: 'phone', label: 'WhatsApp / SMS' },
            { key: 'email', label: 'Email' },
          ]}
        />
      </Field>

      {channel === 'phone' ? (
        <Field label="Mobile number (WhatsApp)">
          <View style={[styles.row, { gap: 8 }]}>
            <View style={{ width: 96 }}>
              <Select label="Country code" value={code} options={['+44', '+234', '+1']} onChange={setCode} />
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
        <Button label="Send reset code" variant={canSend ? 'primary' : 'disabled'} onPress={send} />
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <TextLink label="Back to sign in" size={14} color={colors.ink} onPress={() => router.back()} />
        </View>
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          Can’t reach your phone or email? <TextLink label="Help on WhatsApp" size={12} color={colors.muted} />
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
