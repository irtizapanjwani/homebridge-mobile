import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/dashboard-header';
import { Icon } from '@/components/icon';
import { Button, Screen, T, Toggle } from '@/components/ui';
import { colors } from '@/constants/theme';

import { useSession } from '@/lib/session';

function LinkRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" style={[styles.setting, !last && styles.divider]}>
      <T size={14} style={{ flex: 1 }}>
        {label}
      </T>
      <T size={13} color={colors.muted}>
        {value}
      </T>
      <Icon name="chevron" size={16} color={colors.muted} strokeWidth={2} />
    </Pressable>
  );
}

function ToggleRow({ label, detail, on, onPress }: { label: string; detail: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.setting, styles.divider, { minHeight: 60 }]}>
      <View style={{ flex: 1 }}>
        <T size={14}>{label}</T>
        <T size={12} color={colors.muted}>
          {detail}
        </T>
      </View>
      <Toggle on={on} />
    </Pressable>
  );
}

export default function Profile() {
  const { signOut, me } = useSession();
  const [lowData, setLowData] = useState(true);
  const [alerts, setAlerts] = useState(true);
  if (!me) return null; // the tabs only open once the account has loaded

  return (
    <Screen withTabBar>
      <AppBar avatarLabel="Open my account" onAvatar={() => router.push('/account')} />
      <T serif size={26} color={colors.green} style={{ minHeight: 44, textAlignVertical: 'center' }}>
        Profile
      </T>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open my account"
        onPress={() => router.push('/account')}
        style={styles.memberCard}>
        <View style={styles.avatar}>
          <T size={20} weight="bold">
            {me.initials}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={17} weight="semibold" color={colors.white}>
            {me.fullName}
          </T>
          <T size={12} color={colors.mintText}>
            {[me.memberNo, me.memberType, me.chapter].filter(Boolean).join(' · ')}
          </T>
          <T size={12} color={colors.mintText}>
            {me.membership ? `Member since ${me.membership.since}` : me.status}
          </T>
          <T size={12} weight="semibold" color={colors.gold}>
            My account · documents and details
          </T>
        </View>
        <Icon name="chevron" size={18} color={colors.white} strokeWidth={2} />
      </Pressable>

      <View style={{ gap: 4 }}>
        <T size={14} weight="semibold" style={{ marginBottom: 4 }}>
          Recent receipts
        </T>
        {(me.contributions?.items ?? []).length === 0 ? (
          <T size={13} color={colors.muted}>
            No contributions recorded yet.
          </T>
        ) : (
          (me.contributions?.items ?? []).slice(0, 5).map((s) => (
            <View key={s.receiptNo} style={[styles.statement, styles.divider]}>
              <View style={{ flex: 1 }}>
                <T size={14}>{s.period}</T>
                <T size={12} color={colors.muted}>
                  {s.receiptNo}
                </T>
              </View>
              <T size={13} color={colors.muted}>
                {s.amount}
              </T>
            </View>
          ))
        )}
      </View>

      <View style={styles.settings}>
        <LinkRow label="Language" value="English" />
        <ToggleRow
          label="Low-data mode"
          detail="Hides photos until tapped · works on 2G"
          on={lowData}
          onPress={() => setLowData(!lowData)}
        />
        <ToggleRow
          label="WhatsApp and SMS alerts"
          detail="Payment due, receipts, new votes"
          on={alerts}
          onPress={() => setAlerts(!alerts)}
        />
        <LinkRow label="Show amounts in" value="£ and ₦" />
        <LinkRow label="PIN and fingerprint" value="Coming soon" last />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label="Help on WhatsApp"
          variant="mint"
          height={48}
          textSize={13}
          style={{ flex: 1 }}
          icon={<Icon name="chat" size={18} color={colors.ink} strokeWidth={2} />}
          onPress={() => Linking.openURL('https://wa.me/2348105832602')}
        />
        <Button
          label="Email the office"
          variant="mint"
          height={48}
          textSize={13}
          style={{ flex: 1 }}
          icon={<Icon name="mail" size={18} color={colors.ink} strokeWidth={2} />}
          onPress={() => Linking.openURL('mailto:info@homebridgecooperative.org')}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={async () => {
          await signOut();
          router.replace('/sign-in');
        }}
        style={{ alignSelf: 'center', padding: 8 }}>
        <T size={13} color={colors.muted} style={{ textDecorationLine: 'underline' }}>
          Sign out
        </T>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  memberCard: {
    backgroundColor: colors.green,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statement: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  download: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  settings: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
});
