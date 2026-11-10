import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Checkbox, Field, Input } from '@/components/form';
import { MAX_NOMINEES, StepHeader, useRegister, type Decl, type NomineeDraft } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

const WEBSITE = 'https://homebridge-two.vercel.app';

/** Step 5 — nominees (shares must add up to 100%) and the four declarations. Same as the website. */
export default function Nominees() {
  const { draft, set } = useRegister();
  const group = draft.memberType === 'group';
  const total = draft.nominees.reduce((t, n) => t + (Number(n.share) || 0), 0);

  const update = (id: string, patch: Partial<NomineeDraft>) => set({ nominees: draft.nominees.map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  const add = () => set({ nominees: [...draft.nominees, { id: `n${Date.now()}`, name: '', relationship: '', contact: '', share: '' }] });
  const remove = (id: string) => set({ nominees: draft.nominees.filter((n) => n.id !== id) });
  const decl = (patch: Partial<Decl>) => set({ decl: { ...draft.decl, ...patch } });

  const incomplete = draft.nominees.some((n) => n.name.trim().length < 2 || n.relationship.trim().length < 2 || n.contact.trim().length < 5 || !Number(n.share));
  const missing = [
    !group && incomplete && 'fill in every nominee’s name, relationship, phone or email and share',
    !group && total !== 100 && 'make the shares add up to 100%',
    !Object.values(draft.decl).every(Boolean) && 'tick all four declarations',
  ].filter(Boolean) as string[];

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={5} title="Nominee and agreements" />
      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          {group ? 'Agreements' : 'Nominee and agreements'}
        </T>
        <T size={13} color={colors.muted}>
          {group
            ? 'A group member doesn’t name nominees. Please read and confirm the declarations.'
            : 'Your nominee receives your savings and shares under the bye-laws if you pass away. You can name up to five.'}
        </T>
      </View>

      {!group ? (
        <View style={{ gap: 12 }}>
          {draft.nominees.map((n, i) => (
            <View key={n.id} style={styles.nominee}>
              <View style={styles.between}>
                <T size={15} weight="semibold">
                  Nominee {i + 1}
                </T>
                {draft.nominees.length > 1 ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove nominee ${i + 1}`} onPress={() => remove(n.id)} hitSlop={8}>
                    <T size={13} weight="semibold" color={colors.muted}>
                      Remove
                    </T>
                  </Pressable>
                ) : null}
              </View>
              <Field label="Full name">
                <Input value={n.name} onChangeText={(v) => update(n.id, { name: v })} />
              </Field>
              <Field label="Relationship to you">
                <Input value={n.relationship} onChangeText={(v) => update(n.id, { relationship: v })} placeholder="e.g. Wife, son, sister" />
              </Field>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Field label="Phone or email" flex>
                  <Input value={n.contact} onChangeText={(v) => update(n.id, { contact: v })} autoCapitalize="none" />
                </Field>
                <View style={{ width: 92, gap: 6 }}>
                  <T size={13} weight="medium">
                    Share %
                  </T>
                  <Input value={n.share} onChangeText={(v) => update(n.id, { share: v.replace(/\D/g, '').slice(0, 3) })} keyboardType="number-pad" placeholder="%" />
                </View>
              </View>
            </View>
          ))}
          <View style={styles.between}>
            {draft.nominees.length < MAX_NOMINEES ? (
              <Pressable accessibilityRole="button" onPress={add} style={styles.add}>
                <T size={14} weight="semibold" color={colors.green}>
                  + Add another nominee
                </T>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={[styles.total, total === 100 ? { backgroundColor: colors.mint } : { backgroundColor: colors.cream }]}>
              <T size={13} weight="semibold" color={total === 100 ? colors.green : colors.goldText}>
                Total {total}%{total === 100 ? ' ✓' : ''}
              </T>
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <T size={16} weight="semibold">
          Declarations
        </T>
        <Checkbox checked={draft.decl.character} onPress={() => decl({ character: !draft.decl.character })}>
          <T size={13} style={{ flex: 1 }}>
            {group ? 'The group and its representative are' : 'I am'} of good character and have never been convicted of fraud or dishonesty (bye-law 5.1b).
          </T>
        </Checkbox>
        <Checkbox checked={draft.decl.bylaws} onPress={() => decl({ bylaws: !draft.decl.bylaws })}>
          <T size={13} style={{ flex: 1 }}>
            I have read and accept the{' '}
            <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(`${WEBSITE}/documents`)}>
              HomeBridge bye-laws
            </T>
            .
          </T>
        </Checkbox>
        <Checkbox checked={draft.decl.risk} onPress={() => decl({ risk: !draft.decl.risk })}>
          <T size={13} style={{ flex: 1 }}>
            I understand the risk notice: there is no guaranteed return, HomeBridge is not a savings or deposit scheme, and shares can only be withdrawn after 3 years, with 6
            months’ notice.
          </T>
        </Checkbox>
        <Checkbox checked={draft.decl.privacy} onPress={() => decl({ privacy: !draft.decl.privacy })}>
          <T size={13} style={{ flex: 1 }}>
            I have read the{' '}
            <T size={13} weight="semibold" color={colors.green} style={{ textDecorationLine: 'underline' }} onPress={() => Linking.openURL(`${WEBSITE}/documents`)}>
              privacy notice
            </T>
            . My details are handled under Nigeria’s Data Protection Act 2023 and, for people in the UK, the UK GDPR.
          </T>
        </Checkbox>
      </View>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {missing.length ? (
          <T size={12} color={colors.goldText} style={{ textAlign: 'center' }}>
            To continue, please {missing.join(', ')}.
          </T>
        ) : null}
        <Button label="Continue" variant={missing.length ? 'disabled' : 'primary'} onPress={() => router.push('/register/joining-fee')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  nominee: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, gap: 12 },
  add: { minHeight: 44, justifyContent: 'center' },
  total: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
});
