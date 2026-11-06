import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Button, Screen, T, Toggle } from '@/components/ui';
import { colors } from '@/constants/theme';
import { member, statements } from '@/data/mock';

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
  const [lowData, setLowData] = useState(true);
  const [alerts, setAlerts] = useState(true);

  return (
    <Screen withTabBar>
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
            {member.initials}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={17} weight="semibold" color={colors.white}>
            {member.fullName}
          </T>
          <T size={12} color={colors.mintText}>
            {member.memberId} · {member.type} · {member.cohort}
          </T>
          <T size={12} color={colors.mintText}>
            Member since {member.since} · ID verified
          </T>
          <T size={12} weight="semibold" color={colors.gold}>
            My account · documents and details
          </T>
        </View>
        <Icon name="chevron" size={18} color={colors.white} strokeWidth={2} />
      </Pressable>

      <View style={{ gap: 4 }}>
        <T size={14} weight="semibold" style={{ marginBottom: 4 }}>
          Statements
        </T>
        {statements.map((s) => (
          <View key={s.id} style={[styles.statement, styles.divider]}>
            <T size={14} style={{ flex: 1 }}>
              {s.label}
            </T>
            <T size={13} color={colors.muted}>
              {s.amount}
            </T>
            <Pressable accessibilityRole="button" accessibilityLabel={`Download ${s.label} statement`} style={styles.download}>
              <Icon name="download" size={20} strokeWidth={2} />
            </Pressable>
          </View>
        ))}
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
        <LinkRow label="PIN and fingerprint" value="On" last />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          label="Help on WhatsApp"
          variant="mint"
          height={48}
          textSize={13}
          style={{ flex: 1 }}
          icon={<Icon name="chat" size={18} color={colors.ink} strokeWidth={2} />}
        />
        <Button
          label="Email the office"
          variant="mint"
          height={48}
          textSize={13}
          style={{ flex: 1 }}
          icon={<Icon name="mail" size={18} color={colors.ink} strokeWidth={2} />}
          onPress={() => Linking.openURL('mailto:')}
        />
      </View>

      <Pressable onPress={() => router.replace('/sign-in')} style={{ alignSelf: 'center', padding: 8 }}>
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
