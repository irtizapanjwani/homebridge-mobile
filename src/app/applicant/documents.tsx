import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import { Card, ErrorBox, OPEN_STATUSES } from '@/components/applicant';
import { Icon, type IconName } from '@/components/icon';
import { BackButton, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useSession } from '@/lib/session';
import { pickFile, uploadDocument, type Picked } from '@/lib/upload';

type Kind = 'id' | 'address';

const INFO: Record<Kind, { title: string; hint: string }> = {
  id: { title: 'Photo of your ID', hint: 'Passport, national ID or NIN slip — all 4 corners showing.' },
  address: { title: 'Proof of address', hint: 'A utility bill, bank statement or tenancy agreement from the last 3 months.' },
};

function SourceButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.source, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={16} color={colors.green} strokeWidth={2} />
      <T size={13} weight="semibold" color={colors.green} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

function UploadCard({ kind }: { kind: Kind }) {
  const { me, token, refreshMe } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Picked | null>(null);
  if (!me || !token) return null;

  const received = me.documents.filter((d) => d.type === kind);
  const latest = received[0];
  const canUpload = OPEN_STATUSES.includes(me.status) && !me.supporter;

  const choose = async (source: 'camera' | 'library' | 'file') => {
    setError('');
    const picked = await pickFile(source);
    if (picked === 'denied') return setError('Please allow HomeBridge to use your camera or photos in your phone’s settings.');
    if (!picked) return;
    setPreview(picked);
    setBusy(true);
    try {
      await uploadDocument(token, kind, picked);
      await refreshMe();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={[{ gap: 12 }, latest && { borderColor: colors.green }]}>
      <View style={styles.head}>
        <View style={[styles.icon, latest && { backgroundColor: colors.green }]}>
          <Icon name={latest ? 'check' : kind === 'id' ? 'profile' : 'home'} size={18} color={latest ? colors.white : colors.green} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={15} weight="semibold">
            {INFO[kind].title}
          </T>
          <T size={12} color={latest ? colors.green : colors.muted}>
            {latest ? `Received ${latest.uploadedAt} · ${latest.name}` : INFO[kind].hint}
          </T>
        </View>
      </View>

      {preview && preview.mimeType.startsWith('image/') ? (
        <Image source={{ uri: preview.uri }} style={styles.preview} accessibilityLabel={`${INFO[kind].title} preview`} resizeMode="cover" />
      ) : preview ? (
        <View style={styles.fileRow}>
          <Icon name="doc" size={16} color={colors.green} strokeWidth={1.8} />
          <T size={13} numberOfLines={1} style={{ flex: 1 }}>
            {preview.name}
          </T>
        </View>
      ) : null}

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.green} />
          <T size={13} color={colors.muted}>
            Uploading securely…
          </T>
        </View>
      ) : canUpload ? (
        <View style={{ gap: 8 }}>
          {latest ? (
            <T size={12} color={colors.muted}>
              Sent the wrong one? Add a new file — the office sees the newest.
            </T>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SourceButton icon="camera" label="Camera" onPress={() => choose('camera')} />
            <SourceButton icon="photo" label="Gallery" onPress={() => choose('library')} />
            <SourceButton icon="doc" label="PDF" onPress={() => choose('file')} />
          </View>
        </View>
      ) : (
        <T size={12} color={colors.muted}>
          Your application has been decided, so documents can’t be changed here.
        </T>
      )}

      {error ? <ErrorBox text={error} /> : null}
    </Card>
  );
}

export default function UploadDocuments() {
  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <View style={styles.top}>
        <BackButton />
        <T serif size={24} color={colors.green}>
          Upload documents
        </T>
      </View>
      <T size={14} color={colors.inkSoft}>
        We need both to check your application. A clear phone photo is fine — make sure the text is readable.
      </T>

      <UploadCard kind="id" />
      <UploadCard kind="address" />

      <Card style={{ backgroundColor: colors.mint, borderColor: colors.mint, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="shield" size={18} color={colors.green} strokeWidth={1.8} />
        <T size={12} style={{ flex: 1 }}>
          Your documents are encrypted and only seen by the officer checking your ID. They are never shown to other members.
        </T>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  source: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
  },
  preview: { width: '100%', height: 160, borderRadius: 12, backgroundColor: colors.lineSoft },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.paper, borderRadius: 10, padding: 10 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
});
