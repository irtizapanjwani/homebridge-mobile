import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/dashboard-header';
import { CheckBadge, Icon } from '@/components/icon';
import { Button, Radio, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { lastMotion, openMotion as m } from '@/data/mock';

type Choice = 'for' | 'against' | 'abstain';

const choices: { key: Choice; label: string }[] = [
  { key: 'for', label: 'For' },
  { key: 'against', label: 'Against' },
  { key: 'abstain', label: 'Abstain' },
];

export default function Vote() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [voted, setVoted] = useState(false);
  const picked = choices.find((c) => c.key === choice);

  return (
    <Screen withTabBar>
      <AppBar />
      <View style={styles.header}>
        <T serif size={26} color={colors.green} style={{ flex: 1 }}>
          Vote
        </T>
        <View style={styles.badge}>
          <T size={12} weight="semibold" color={colors.green}>
            One member, one vote
          </T>
        </View>
      </View>

      <View style={styles.card}>
        <T size={12} weight="semibold" color={colors.goldText}>
          MOTION {m.number} · OPEN
        </T>
        <T size={18} weight="semibold" style={{ lineHeight: 24 }}>
          {m.title}
        </T>
        <T size={13} color={colors.inkSoft}>
          {m.body}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="clock" size={16} strokeWidth={2} />
          <T size={12} color={colors.inkSoft} style={{ flex: 1 }}>
            {m.closes}
          </T>
        </View>
        <Link href={{ pathname: '/projects/[id]', params: { id: 'head-office' } }}>
          <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }}>
            Read the full proposal
          </T>
        </Link>
      </View>

      <View style={{ gap: 6 }}>
        <View style={styles.between}>
          <T size={12} color={colors.inkSoft}>
            Turnout so far
          </T>
          <T size={12} weight="semibold">
            {m.turnout}% · quorum {m.quorum}%
          </T>
        </View>
        <View style={styles.bar}>
          <View style={{ width: `${m.turnout}%`, height: 8, backgroundColor: colors.gold }} />
          <View style={[styles.quorum, { left: `${m.quorum}%` }]} />
        </View>
        <T size={11} color={colors.muted}>
          Your choice is private. Totals appear when voting closes.
        </T>
      </View>

      {!voted ? (
        <>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Your vote">
            {choices.map((c) => {
              const on = c.key === choice;
              const fg = on ? colors.white : colors.green;
              return (
                <Pressable
                  key={c.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setChoice(c.key)}
                  style={[
                    styles.option,
                    on
                      ? { backgroundColor: colors.green, borderColor: colors.green }
                      : { backgroundColor: colors.white, borderColor: colors.line },
                  ]}>
                  <Radio on={on} color={fg} />
                  <T size={15} weight="semibold" color={fg}>
                    {c.label}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <Button label="Cast my vote" variant={choice ? 'gold' : 'disabled'} onPress={() => setVoted(true)} />
        </>
      ) : (
        <View style={styles.recorded}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CheckBadge size={28} />
            <T size={17} weight="semibold" color={colors.white}>
              Your vote is recorded
            </T>
          </View>
          <T size={13} color={colors.mintText}>
            You voted: {picked?.label} · receipt {m.receipt} sent by email and WhatsApp.
          </T>
          <Pressable onPress={() => setVoted(false)} style={styles.change}>
            <T size={13} color={colors.white}>
              Change vote before it closes
            </T>
          </Pressable>
        </View>
      )}

      <View style={styles.past}>
        <View style={[styles.between, { alignItems: 'baseline' }]}>
          <T size={13} weight="semibold">
            {lastMotion.title}
          </T>
          <T size={12} weight="semibold" color={colors.green}>
            {lastMotion.result}
          </T>
        </View>
        <View style={[styles.bar, { flexDirection: 'row' }]}>
          <View style={{ width: `${lastMotion.forPct}%`, backgroundColor: colors.green }} />
          <View style={{ width: `${lastMotion.againstPct}%`, backgroundColor: colors.gold }} />
        </View>
        <T size={11} color={colors.muted}>
          {lastMotion.summary}
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  badge: { backgroundColor: colors.mint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  quorum: { position: 'absolute', top: 0, width: 2, height: 8, backgroundColor: colors.ink },
  option: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  recorded: { backgroundColor: colors.green, borderRadius: 18, padding: 18, gap: 8 },
  change: {
    alignSelf: 'flex-start',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
  },
  past: { marginTop: 'auto', gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineSoft },
});
