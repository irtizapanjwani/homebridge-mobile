import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Pill, ProgressBar, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { projects, type ProjectStatus } from '@/data/mock';

type Filter = 'All' | ProjectStatus;

export default function Projects() {
  const [filter, setFilter] = useState<Filter>('All');
  const count = (s: ProjectStatus) => projects.filter((p) => p.status === s).length;
  const filters: { key: Filter; label: string }[] = [
    { key: 'All', label: 'All' },
    { key: 'Active', label: `Active · ${count('Active')}` },
    { key: 'Proposed', label: `Proposed · ${count('Proposed')}` },
    { key: 'Completed', label: 'Completed' },
  ];
  const shown = filter === 'All' ? projects : projects.filter((p) => p.status === filter);

  return (
    <Screen withTabBar>
      <View style={styles.header}>
        <T serif size={26} color={colors.green} style={{ flex: 1 }}>
          Projects
        </T>
        <Pressable accessibilityRole="button" style={styles.propose}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          <T size={13} weight="semibold" color={colors.green}>
            Propose
          </T>
        </Pressable>
      </View>

      <T size={13} color={colors.muted}>
        Every project is chosen by members. Follow the money, the progress and the photos from site.
      </T>

      <View style={styles.filters}>
        {filters.map((f) => {
          const on = f.key === filter;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(f.key)}
              style={[styles.filter, on && styles.filterOn]}>
              <T size={13} weight={on ? 'semibold' : 'medium'} color={on ? colors.white : colors.ink}>
                {f.label}
              </T>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 && (
        <T size={13} color={colors.muted} style={{ textAlign: 'center', paddingVertical: 24 }}>
          No {filter.toLowerCase()} projects yet.
        </T>
      )}

      {shown.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/projects/[id]', params: { id: p.id } })}
          style={p.status === 'Proposed' ? [styles.card, styles.cardDashed] : styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.cardIcon, { backgroundColor: p.iconBg }]}>
                <Icon name={p.icon} size={28} color={p.iconColor} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <T size={15} weight="semibold">
                  {p.name}
                </T>
                <T size={12} color={colors.muted}>
                  {p.location}
                </T>
              </View>
              <Pill label={p.status} tone={p.status === 'Proposed' ? 'gold' : 'green'} />
            </View>
            {p.progress !== undefined && <ProgressBar value={p.progress} />}
            <View style={styles.cardBottom}>
              <T size={12} color={colors.inkSoft} style={{ flex: 1 }}>
                {p.summaryStrong && (
                  <T size={12} weight="bold">
                    {p.summaryStrong}
                  </T>
                )}
                {p.summary}
              </T>
              <T
                size={12}
                weight={p.noteHighlight ? 'semibold' : 'regular'}
                color={p.noteHighlight ? colors.goldText : colors.muted}>
                {p.note}
              </T>
            </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  propose: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  filterOn: { backgroundColor: colors.green, borderColor: colors.green },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardDashed: { borderStyle: 'dashed', borderColor: colors.inputBorder },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
