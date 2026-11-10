import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, ErrorBox } from '@/components/applicant';
import { Icon, type IconName } from '@/components/icon';
import { BackButton, Button, Screen, T } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useSession } from '@/lib/session';
import { pickFile, uploadDocument, type Picked } from '@/lib/upload';

const MAX = 1000;

function Attach({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.attach}>
      <Icon name={icon} size={16} color={colors.green} strokeWidth={2} />
      <T size={13} weight="semibold" color={colors.green}>
        {label}
      </T>
    </Pressable>
  );
}

export default function ReplyToOffice() {
  const { me, token, refreshMe } = useSession();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (!me || !token) return null;

  const choose = async (source: 'camera' | 'library' | 'file') => {
    setError('');
    const p = await pickFile(source);
    if (p === 'denied') return setError('Please allow HomeBridge to use your camera or photos in your phone’s settings.');
    if (p) setFile(p);
  };

  const send = async () => {
    if (!message.trim() && !file) return setError('Add a message or a file.');
    setBusy(true);
    setError('');
    try {
      await uploadDocument(token, 'info', file, message.trim());
      setSent(true);
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your reply. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View style={styles.top}>
      <BackButton />
      <T serif size={24} color={colors.green}>
        Reply to the office
      </T>
    </View>
  );

  if (sent || (!me.infoRequest && me.infoRepliedAt)) {
    return (
      <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
        {header}
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <View style={styles.okIcon}>
            <Icon name="check" size={28} color={colors.white} strokeWidth={3} />
          </View>
          <T serif size={22} color={colors.green} style={{ textAlign: 'center' }}>
            We received your reply
          </T>
          <T size={14} color={colors.inkSoft} style={{ textAlign: 'center' }}>
            {me.infoRepliedAt ? `Sent on ${me.infoRepliedAt}. ` : ''}Your application is back with an officer. We’ll let you know the
            outcome by email.
          </T>
        </Card>
        <Button label="Back to my dashboard" onPress={() => router.replace('/applicant')} />
      </Screen>
    );
  }

  if (!me.infoRequest) {
    return (
      <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
        {header}
        <Card>
          <T size={14}>The office hasn’t asked you for anything. If they do, it will show here and on your dashboard.</T>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      {header}

      <View style={styles.asked}>
        <T size={11} weight="semibold" color={colors.goldText} style={{ letterSpacing: 1 }}>
          WHAT THE OFFICE ASKED FOR
        </T>
        <T size={15}>{me.infoRequest.needed || 'More information about your application.'}</T>
        <View style={styles.by}>
          <Icon name="calendar" size={14} color={colors.goldText} strokeWidth={2} />
          <T size={13} weight="semibold" color={colors.goldText}>
            Please reply by {me.infoRequest.by}
          </T>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <T size={13} weight="medium">
          Your reply
        </T>
        <TextInput
          value={message}
          onChangeText={(v) => setMessage(v.slice(0, MAX))}
          multiline
          placeholder="Write your answer here"
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel="Your reply"
        />
        <T size={11} color={colors.muted} style={{ alignSelf: 'flex-end' }}>
          {message.length}/{MAX}
        </T>
      </View>

      <View style={{ gap: 8 }}>
        <T size={13} weight="medium">
          Attach a photo or file (optional)
        </T>
        {file ? (
          <View style={styles.file}>
            {file.mimeType.startsWith('image/') ? (
              <Image source={{ uri: file.uri }} style={styles.thumb} />
            ) : (
              <Icon name="doc" size={20} color={colors.green} strokeWidth={1.8} />
            )}
            <T size={13} numberOfLines={1} style={{ flex: 1 }}>
              {file.name}
            </T>
            <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={() => setFile(null)} hitSlop={8}>
              <T size={13} weight="semibold" color={colors.muted}>
                Remove
              </T>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Attach icon="camera" label="Camera" onPress={() => choose('camera')} />
            <Attach icon="photo" label="Gallery" onPress={() => choose('library')} />
            <Attach icon="doc" label="File" onPress={() => choose('file')} />
          </View>
        )}
      </View>

      {error ? <ErrorBox text={error} /> : null}

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.green} />
            <T size={14} color={colors.muted}>
              Sending…
            </T>
          </View>
        ) : (
          <Button label="Send reply" variant={message.trim() || file ? 'primary' : 'disabled'} onPress={send} />
        )}
        <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>
          Sending puts your application back with an officer.
        </T>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  asked: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.gold, borderRadius: 18, padding: 16, gap: 8 },
  by: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  attach: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.mint,
  },
  file: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10 },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54 },
  okIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
});
