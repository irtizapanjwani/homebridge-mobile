import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { colors } from '@/constants/theme';

const PHONE_WIDTH = 430; // same as the app column on the web (src/app/_layout.tsx)
const GAP = 14;

/**
 * The frame every pop-up uses: dark backdrop, then a panel that always fits the screen — never wider
 * than the phone column, never taller than the screen (its content scrolls instead).
 * `place="bottom"` slides up from the bottom (lists); the default sits in the middle.
 */
export function PopupFrame({
  visible,
  onClose,
  children,
  place = 'center',
  panelStyle,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  place?: 'center' | 'bottom';
  panelStyle?: ViewStyle;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const top = insets.top + GAP;
  const bottom = (place === 'bottom' ? 0 : GAP) + insets.bottom;
  const maxHeight = height - top - bottom;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.page}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.column}>
          <Pressable
            style={[styles.backdrop, { paddingTop: top, paddingBottom: bottom, justifyContent: place === 'bottom' ? 'flex-end' : 'center' }]}
            onPress={onClose}
            accessibilityLabel="Close">
            <Pressable
              style={[styles.panel, place === 'bottom' ? styles.panelBottom : styles.panelCenter, { maxHeight }, panelStyle]}
              onPress={() => {}}>
              {children}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** A scroll area that shrinks to fit inside a PopupFrame. */
export function PopupScroll({ children, gap = 14 }: { children: ReactNode; gap?: number }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ gap, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

/** A pop-up panel with a title and an X, used for proof of payment, payment holiday and proxy. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <PopupFrame visible={visible} onClose={onClose}>
      <View style={styles.head}>
        <T serif size={22} color={colors.green} style={{ flex: 1 }}>
          {title}
        </T>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={styles.close}>
          <T size={20} color={colors.green}>
            ✕
          </T>
        </Pressable>
      </View>
      <PopupScroll>{children}</PopupScroll>
    </PopupFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'rgba(15,51,34,0.6)', alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? PHONE_WIDTH : undefined },
  backdrop: { flex: 1, paddingHorizontal: GAP },
  panel: { width: '100%', backgroundColor: colors.paper, padding: 18, gap: 10, overflow: 'hidden' },
  panelCenter: { borderRadius: 22 },
  panelBottom: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24, marginHorizontal: -GAP, width: 'auto' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
