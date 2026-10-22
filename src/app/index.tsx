import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckBadge, Icon, type IconName } from '@/components/icon';
import { Logo } from '@/components/logo';
import { Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';

type MemberType = 'diaspora' | 'home';

const options: { key: MemberType; icon: IconName; title: string; detail: string }[] = [
  {
    key: 'diaspora',
    icon: 'globe',
    title: 'Abroad — Diaspora member',
    detail: 'UK, Europe, Americas and beyond · pay in £ or $',
  },
  {
    key: 'home',
    icon: 'home',
    title: 'At home — Nigeria and Africa',
    detail: 'All 36 states + FCT · pay in ₦ by transfer, card or USSD',
  },
];

export default function Welcome() {
  const [type, setType] = useState<MemberType>('diaspora');
  const diaspora = type === 'diaspora';

  return (
    <Screen background={colors.green} edges={['top', 'bottom']} contentStyle={{ gap: 26, paddingTop: 36 }}>
      <StatusBar style="light" />

      <View style={styles.brand}>
        <Logo size={88} background={colors.greenDark} />
        <T style={styles.wordmark}>
          <T style={styles.wordmark} color={colors.cream}>
            Home
          </T>
          <T style={styles.wordmark} color={colors.gold}>
            Bridge
          </T>
        </T>
        <T size={12} weight="bold" color={colors.cream} style={{ letterSpacing: 5 }}>
          COOPERATIVE
        </T>
        <T style={styles.tagline}>Abroad and at home, we build together.</T>
      </View>

      <View style={{ gap: 12 }}>
        <T size={18} weight="semibold" color={colors.cream}>
          Where are you joining from?
        </T>
        {options.map((o) => {
          const on = o.key === type;
          return (
            <Pressable
              key={o.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setType(o.key)}
              style={[
                styles.option,
                on
                  ? { borderColor: colors.gold, backgroundColor: colors.greenMid }
                  : { borderColor: 'rgba(247,240,218,0.28)' },
              ]}>
              <Icon name={o.icon} size={30} color={colors.gold} />
              <View style={{ flex: 1, gap: 3 }}>
                <T size={16} weight="semibold" color={colors.cream}>
                  {o.title}
                </T>
                <T size={13} color={colors.mintText}>
                  {o.detail}
                </T>
              </View>
              {on && <CheckBadge />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fees}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={12} color={colors.mintText}>
            One-off joining fee
          </T>
          <T size={22} weight="bold" color={colors.cream}>
            {diaspora ? '£10' : '₦10,000'}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={12} color={colors.mintText}>
            Monthly minimum (shares)
          </T>
          <T size={22} weight="bold" color={colors.cream}>
            {diaspora ? '£25' : '₦5,000'}
          </T>
        </View>
      </View>

      <View style={{ marginTop: 'auto', gap: 6 }}>
        <Button
          label="Become a member"
          variant="gold"
          onPress={() => router.push({ pathname: '/register', params: { type } })}
        />
        <Link href="/home" replace asChild>
          <Pressable style={styles.signIn}>
            <T size={14} color={colors.cream} style={{ textDecorationLine: 'underline' }}>
              Already a member? Sign in
            </T>
          </Pressable>
        </Link>
        <T size={11} color={colors.mintFaint} style={{ textAlign: 'center' }}>
          Member-owned · one member, one vote · managed by VEKAT Nigeria Ltd
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 12 },
  wordmark: { fontFamily: fonts.serifBold, fontSize: 38, lineHeight: 44 },
  tagline: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.mint, textAlign: 'center' },
  option: {
    minHeight: 84,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  fees: {
    backgroundColor: 'rgba(247,240,218,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
  },
  signIn: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
