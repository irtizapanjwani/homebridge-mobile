import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { T } from '@/components/ui';
import { colors } from '@/constants/theme';

/** A pop-up panel with a title and an X, used for proof of payment, payment holiday and proxy. */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
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
            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" style={{ maxHeight: 560 }}>
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,51,34,0.6)', justifyContent: 'center', padding: 14 },
  sheet: { backgroundColor: colors.paper, borderRadius: 22, padding: 18, maxWidth: 480, width: '100%', alignSelf: 'center', gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
