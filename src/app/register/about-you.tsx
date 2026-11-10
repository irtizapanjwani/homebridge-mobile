import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DateInput, Field, Input, ListPicker } from '@/components/form';
import { ageFrom, CHAPTERS, ChoiceCard, COUNTRIES, HEARD_OPTIONS, NIGERIAN_STATES, OTHER_COUNTRY, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Step 2 — same questions as the website's "About you". */
export default function AboutYou() {
  const { draft, set } = useRegister();
  const nigeria = draft.country === 'Nigeria';
  const other = draft.country === OTHER_COUNTRY;
  const age = ageFrom(draft.dob);

  const missing = [
    age === null && 'enter your date of birth as DD/MM/YYYY',
    age !== null && age < 18 && 'note you need to be 18 or older to join',
    !draft.country && 'choose the country you live in',
    other && draft.countryOther.trim().length < 2 && 'tell us which country',
    nigeria && !draft.state && 'choose your state',
    draft.city.trim().length < 2 && 'enter your town or city',
    draft.address.trim().length < 5 && 'enter your home address',
    draft.occupation.trim().length < 2 && 'enter your occupation',
    !draft.heard && 'tell us how you heard about us',
    !draft.chapter && 'choose a chapter',
  ].filter(Boolean) as string[];

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={2} title="About you" />
      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          About you
        </T>
        <T size={13} color={colors.muted}>
          As it appears on your ID. We use these details for your membership record.
        </T>
      </View>

      <Field label="Date of birth">
        <DateInput value={draft.dob} onChangeText={(v) => set({ dob: v })} autoComplete="birthdate-full" />
        <T size={12} color={age !== null && age < 18 ? '#9A3B26' : colors.muted}>
          You need to be 18 or older to join.
        </T>
      </Field>

      <Field label="Country you live in">
        <ListPicker label="Country you live in" value={draft.country} options={COUNTRIES} onChange={(v) => set({ country: v, state: v === 'Nigeria' ? draft.state : '' })} />
      </Field>
      {other ? (
        <Field label="Which country?">
          <Input value={draft.countryOther} onChangeText={(v) => set({ countryOther: v })} placeholder="Country" />
        </Field>
      ) : null}
      {nigeria ? (
        <Field label="State">
          <ListPicker label="State" value={draft.state} options={NIGERIAN_STATES} onChange={(v) => set({ state: v })} />
        </Field>
      ) : null}
      <Field label="Town or city">
        <Input value={draft.city} onChangeText={(v) => set({ city: v })} placeholder={nigeria ? 'e.g. Benin City' : 'e.g. London'} autoComplete="postal-address-locality" />
      </Field>
      <Field label="Home address">
        <Input value={draft.address} onChangeText={(v) => set({ address: v })} placeholder="House number and street" autoComplete="street-address" />
      </Field>
      <Field label="Occupation">
        <Input value={draft.occupation} onChangeText={(v) => set({ occupation: v })} placeholder="Or say if you are retired or a student" />
      </Field>

      <Field label="How did you hear about us?">
        <View style={styles.chips}>
          {HEARD_OPTIONS.map((h) => {
            const on = draft.heard === h;
            return (
              <Pressable
                key={h}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => set({ heard: h })}
                style={[styles.chip, on && styles.chipOn]}>
                <T size={13} weight="semibold" color={on ? colors.white : colors.ink}>
                  {h}
                </T>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Chapter">
        <T size={12} color={colors.muted} style={{ marginTop: -2 }}>
          The local group you would like to meet with.
        </T>
        <View style={{ gap: 8 }}>
          {CHAPTERS.map((c) => (
            <ChoiceCard key={c} selected={draft.chapter === c} title={c} onPress={() => set({ chapter: c })} />
          ))}
        </View>
      </Field>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {missing.length ? (
          <T size={12} color={colors.goldText} style={{ textAlign: 'center' }}>
            To continue, please {missing.join(', ')}.
          </T>
        ) : null}
        <Button label="Continue" variant={missing.length ? 'disabled' : 'primary'} onPress={() => router.push('/register/how-you-join')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.chipBorder, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
});
