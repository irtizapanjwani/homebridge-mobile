import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { BackButton, Button, Pill, ProgressBar, T } from '@/components/ui';
import { colors, TAB_BAR_HEIGHT } from '@/constants/theme';
import { projectDetail as p, projects } from '@/data/mock';

// Needed for the static web export (Vercel preview): pre-render one page per project.
export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

const docs: { label: string; icon: IconName }[] = [
  { label: 'Budget (PDF)', icon: 'doc' },
  { label: 'Contractor quotes', icon: 'doc' },
  { label: 'Spending log', icon: 'table' },
];

export default function ProjectDetail() {
  // TODO: load the project by id from the API. Every id shows the head office demo data for now.
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.photo}>
          <Icon name="photo" size={36} color={colors.mint} strokeWidth={1.6} />
          <T size={12} color={colors.mint}>
            [Site photo — updated weekly]
          </T>
          <View style={styles.backWrap}>
            <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/projects'))} />
          </View>
          <View style={styles.photoCount}>
            <T size={11} color={colors.white}>
              1 / {p.photos} photos
            </T>
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pill label="Active" />
              <Pill label={p.cohort} tone="gold" />
            </View>
            <T serif size={24} color={colors.green}>
              {p.name}
            </T>
            <T size={13} color={colors.muted}>
              {p.address}
            </T>
          </View>

          <View style={styles.card}>
            <View style={[styles.between, { alignItems: 'baseline' }]}>
              <T size={22} weight="bold">
                {p.raised}{' '}
                <T size={13} weight="medium" color={colors.muted}>
                  of {p.target}
                </T>
              </T>
              <T size={14} weight="semibold" color={colors.green}>
                {p.progress}%
              </T>
            </View>
            <ProgressBar value={p.progress} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                [p.spent, 'Spent'],
                [p.phase, p.phaseOf],
                [p.targetDate, 'Target'],
              ].map(([big, small]) => (
                <View key={small} style={{ flex: 1 }}>
                  <T size={14} weight="bold">
                    {big}
                  </T>
                  <T size={12} color={colors.muted}>
                    {small}
                  </T>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: 2 }}>
            <T size={15} weight="semibold" style={{ marginBottom: 6 }}>
              Milestones
            </T>
            {p.milestones.map((m) => (
              <View key={m.label} style={styles.milestone}>
                {m.state === 'done' && (
                  <View style={styles.dotDone}>
                    <Icon name="check" size={12} color={colors.white} strokeWidth={3.5} />
                  </View>
                )}
                {m.state === 'current' && <View style={styles.dotCurrent} />}
                {m.state === 'todo' && <View style={styles.dotTodo} />}
                <T
                  size={13}
                  weight={m.state === 'current' ? 'semibold' : 'regular'}
                  color={m.state === 'todo' ? colors.muted : colors.ink}
                  style={{ flex: 1 }}>
                  {m.label}
                </T>
                <T
                  size={12}
                  weight={m.state === 'current' ? 'semibold' : 'regular'}
                  color={m.state === 'current' ? colors.goldText : colors.muted}>
                  {m.when}
                </T>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {docs.map((d) => (
              <Pressable key={d.label} accessibilityRole="link" style={styles.doc}>
                <Icon name={d.icon} size={16} color={colors.ink} strokeWidth={2} />
                <T size={12} weight="medium">
                  {d.label}
                </T>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Ask a question" variant="outline" height={50} textSize={14} style={{ flex: 1 }} />
            <Button
              label="Vote on phase 2"
              height={50}
              textSize={14}
              style={{ flex: 1 }}
              onPress={() => router.navigate('/vote')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 176,
    backgroundColor: colors.greenPhoto,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  photoCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(26,29,26,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  milestone: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 34 },
  dotDone: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrent: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.gold, backgroundColor: colors.white },
  dotTodo: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.inputBorder },
  doc: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: colors.mint,
  },
});
