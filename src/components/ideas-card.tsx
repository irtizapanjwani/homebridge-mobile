import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { api } from '@/lib/api';
import { useSession, type Me } from '@/lib/session';

// "Share an idea" — the same box as the website's, on Home and on Projects. Ideas go to the board
// through /api/ideas and the member sees their own ideas with any reply.

export function IdeasCard({ me }: { me: Me }) {
  const { token, refreshMe } = useSession();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!me.ideas) return null;

  const send = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/ideas', { token, body: { text } });
      setText('');
      setMsg({ ok: true, text: 'Thank you — your idea has been sent to the board.' });
      await refreshMe();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Your idea could not be sent.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, { gap: 10 }]}>
      <T size={16} weight="semibold">
        Share an idea
      </T>
      <T size={13} color={colors.inkSoft}>
        A project, an improvement, a question for the board. Every idea is read.
      </T>
      <TextInput
        value={text}
        onChangeText={(v) => setText(v.slice(0, 2000))}
        multiline
        placeholder="Your idea"
        placeholderTextColor={colors.muted}
        style={styles.ideaInput}
        accessibilityLabel="Your idea"
      />
      {busy ? (
        <ActivityIndicator color={colors.green} style={{ height: 44 }} />
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={text.trim().length < 5}
          onPress={send}
          style={({ pressed }) => [styles.btn, { opacity: text.trim().length < 5 ? 0.5 : pressed ? 0.75 : 1 }]}>
          <T size={14} weight="semibold" color={colors.white}>
            Send idea
          </T>
        </Pressable>
      )}
      {msg ? (
        <T size={13} color={msg.ok ? colors.green : '#9A3B26'}>
          {msg.text}
        </T>
      ) : null}
      {me.ideas.length ? (
        <View style={{ gap: 8, paddingTop: 4 }}>
          <T size={13} weight="semibold">
            Your ideas
          </T>
          {me.ideas.map((i) => (
            <View key={i.id} style={styles.idea}>
              <T size={13}>{i.text}</T>
              <T size={12} color={colors.muted}>
                {i.at} · {i.status}
              </T>
              {i.reply ? (
                <T size={12} color={colors.green}>
                  Reply: {i.reply}
                </T>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 16 },
  btn: { height: 44, borderRadius: 22, backgroundColor: colors.green, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  ideaInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
  },
  idea: { backgroundColor: colors.paper, borderRadius: 10, padding: 10, gap: 2 },
});
