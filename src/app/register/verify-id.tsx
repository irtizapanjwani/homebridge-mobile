import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Field, Input } from '@/components/form';
import { Icon } from '@/components/icon';
import { ChoiceCard, ID_OPTIONS, StepHeader, UploadBox, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function VerifyId() {
  const { draft, set } = useRegister();
  const options = draft.home ? ID_OPTIONS.home : ID_OPTIONS.abroad;
  const chosen = options.find((o) => o.value === draft.idType);

  const numberOk = !chosen?.needsNumber || draft.idNumber.replace(/\D/g, '').length === 11;
  const canContinue = !!chosen && numberOk && draft.idPhoto && draft.addressProof;

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={2} title="Verify your ID" />

      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          Verify your ID
        </T>
        <T size={13} color={colors.muted}>
          One member, one vote — so we check every member is a real person. Takes about a minute.
        </T>
      </View>

      <Field label="Which ID will you use?">
        <View style={{ gap: 10 }}>
          {options.map((o) => (
            <ChoiceCard
              key={o.value}
              selected={draft.idType === o.value}
              title={o.label}
              sub={o.sub}
              onPress={() => set({ idType: o.value, idNumber: '' })}
            />
          ))}
        </View>
      </Field>

      {chosen?.needsNumber && (
        <Field label={`Your ${chosen.label} (11 digits)`}>
          <Input
            value={draft.idNumber}
            onChangeText={(v) => set({ idNumber: v.replace(/\D/g, '').slice(0, 11) })}
            placeholder="12345678901"
            keyboardType="number-pad"
            maxLength={11}
          />
        </Field>
      )}

      {/* TODO: open the camera / photo library (expo-image-picker) and upload to the website. */}
      <View style={{ gap: 10 }}>
        <UploadBox
          label={chosen?.value === 'passport' ? 'Photo of your passport' : 'Photo of your ID'}
          hint="Take a photo or choose one · all 4 corners showing"
          done={draft.idPhoto}
          onPress={() => set({ idPhoto: true })}
        />
        <UploadBox
          label="Proof of address"
          hint="Utility bill, bank statement or tenancy · last 3 months"
          done={draft.addressProof}
          onPress={() => set({ addressProof: true })}
        />
      </View>

      <View style={styles.note}>
        <Icon name="shield" size={18} color={colors.green} strokeWidth={1.8} />
        <T size={12} style={{ flex: 1 }}>
          Your documents are encrypted and only seen by the Treasurer for the ID check. They are never shown to other members.
        </T>
      </View>

      <Button
        label="Continue"
        variant={canContinue ? 'primary' : 'disabled'}
        style={{ marginTop: 'auto' }}
        onPress={() => router.push('/register/joining-fee')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
});
