import { router } from 'expo-router';
import { View } from 'react-native';

import { Field, Input } from '@/components/form';
import { ChoiceCard, GROUP_DOC_OPTIONS, MEMBERSHIP_TYPES, ROUTE_OPTIONS, StepHeader, useRegister } from '@/components/register';
import { Button, Screen, T } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Step 3 — membership type, link to Edo or FCT, and group details. Same as the website. */
export default function HowYouJoin() {
  const { draft, set } = useRegister();
  const group = draft.memberType === 'group';
  const type = MEMBERSHIP_TYPES.find((t) => t.value === draft.memberType);
  const needsDetail = draft.route === 'land' || draft.route === 'other';

  const missing = [
    !draft.memberType && 'choose a membership type',
    !draft.route && 'tell us your link to Edo or FCT',
    needsDetail && draft.routeDetail.trim().length < 3 && 'add a few details about your link',
    group && draft.groupName.trim().length < 2 && 'enter the group’s registered name',
    group && draft.repName.trim().length < 2 && 'enter the representative’s full name',
    group && !draft.groupDoc && 'choose the registration document',
  ].filter(Boolean) as string[];

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ gap: 16 }}>
      <StepHeader step={3} title="How you join" />
      <View style={{ gap: 4 }}>
        <T serif size={26} color={colors.green}>
          How you join
        </T>
        <T size={13} color={colors.muted}>
          Everyone gets one vote, whichever type you choose.
        </T>
      </View>

      <Field label="Membership type">
        <View style={{ gap: 8 }}>
          {MEMBERSHIP_TYPES.map((t) => (
            <ChoiceCard key={t.value} selected={draft.memberType === t.value} title={t.label} sub={t.sub} onPress={() => set({ memberType: t.value })} />
          ))}
        </View>
        {type ? (
          <T size={12} color={colors.inkSoft} style={{ marginTop: 4 }}>
            {type.more}
          </T>
        ) : null}
      </Field>

      <Field label="Your link to Edo State or Abuja FCT">
        <View style={{ gap: 8 }}>
          {ROUTE_OPTIONS.map((r) => (
            <ChoiceCard key={r.value} selected={draft.route === r.value} title={r.label} onPress={() => set({ route: r.value })} />
          ))}
        </View>
      </Field>

      {needsDetail ? (
        <Field label={draft.route === 'land' ? 'Where is the land or home?' : 'Tell us about your link'}>
          <Input
            value={draft.routeDetail}
            onChangeText={(v) => set({ routeDetail: v })}
            placeholder={draft.route === 'land' ? 'Town and state' : 'A few words'}
            multiline
            style={{ height: 80, paddingTop: 12, textAlignVertical: 'top' }}
          />
        </Field>
      ) : null}

      {draft.route === 'none' ? (
        <View style={{ backgroundColor: colors.cream, borderRadius: 12, padding: 12 }}>
          <T size={12}>You’ll join the Supporter list. You won’t be a member yet, but we’ll keep you updated and tell you if the rules change.</T>
        </View>
      ) : null}

      {group ? (
        <View style={{ gap: 14 }}>
          <T size={16} weight="semibold">
            About the group
          </T>
          <Field label="Group’s registered name">
            <Input value={draft.groupName} onChangeText={(v) => set({ groupName: v })} />
          </Field>
          <Field label="Representative’s full name">
            <Input value={draft.repName} onChangeText={(v) => set({ repName: v })} />
            <T size={12} color={colors.muted}>
              The one person who acts and votes for the group.
            </T>
          </Field>
          <Field label="Registration document">
            <View style={{ gap: 8 }}>
              {GROUP_DOC_OPTIONS.map((d) => (
                <ChoiceCard key={d.value} selected={draft.groupDoc === d.value} title={d.label} sub={d.sub} onPress={() => set({ groupDoc: d.value })} />
              ))}
            </View>
          </Field>
        </View>
      ) : null}

      <View style={{ marginTop: 'auto', gap: 8 }}>
        {missing.length ? (
          <T size={12} color={colors.goldText} style={{ textAlign: 'center' }}>
            To continue, please {missing.join(', ')}.
          </T>
        ) : null}
        <Button label="Continue" variant={missing.length ? 'disabled' : 'primary'} onPress={() => router.push('/register/verify-id')} />
      </View>
    </Screen>
  );
}
