import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { BackButton, T } from '@/components/ui';
import { colors } from '@/constants/theme';

// Same values as the website (lib/settings.ts and lib/register-data.ts).
export const JOINING_FEE = { ngn: 10_000, gbp: 10, payee: 'VEKAT Group Ltd' };
export const MIN_MONTHLY = { ngn: 5_000, gbp: 25 };
export const BANK = { name: 'First Bank', accountName: 'VEKAT Nigeria Limited', accountNumber: '2049483671' };

export const ID_OPTIONS = {
  home: [
    { value: 'bvn', label: 'BVN', sub: 'Bank Verification Number', needsNumber: true },
    { value: 'nin', label: 'NIN', sub: 'National Identification Number', needsNumber: true },
  ],
  abroad: [
    { value: 'nrbvn', label: 'Non-Resident BVN', sub: 'For Nigerians banking from abroad', needsNumber: true },
    { value: 'passport', label: 'Passport', sub: 'Nigerian or other passport', needsNumber: false },
  ],
} as const;

export type Draft = {
  home: boolean;
  name: string;
  code: string;
  phone: string;
  email: string;
  country: string;
  cohort: string;
  agreed: boolean;
  // Step 2
  idType: string;
  idNumber: string;
  idPhoto: boolean;
  addressProof: boolean;
  // Step 3
  payMethod: 'card' | 'bank' | '';
  datePaid: string;
  payReference: string;
  // Step 4
  monthly: number;
  payDay: number;
};

const empty = (home: boolean): Draft => ({
  home,
  name: '',
  code: home ? '+234' : '+44',
  phone: '',
  email: '',
  country: home ? 'Nigeria' : 'United Kingdom',
  cohort: 'Edo',
  agreed: false,
  idType: '',
  idNumber: '',
  idPhoto: false,
  addressProof: false,
  payMethod: '',
  datePaid: '',
  payReference: '',
  monthly: home ? MIN_MONTHLY.ngn : MIN_MONTHLY.gbp,
  payDay: 1,
});

type Ctx = { draft: Draft; set: (patch: Partial<Draft>) => void; reset: (home: boolean) => void };
const RegisterContext = createContext<Ctx | null>(null);

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(empty(false));
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const reset = (home: boolean) => setDraft(empty(home));
  return <RegisterContext.Provider value={{ draft, set, reset }}>{children}</RegisterContext.Provider>;
}

export function useRegister() {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error('useRegister must be used inside the register screens');
  return ctx;
}

/** Money in the member's currency: £ abroad, ₦ at home. */
export function money(draft: Pick<Draft, 'home'>, gbp: number, ngn: number) {
  return draft.home ? `₦${ngn.toLocaleString('en-GB')}` : `£${gbp}`;
}

/** Back button, "Step x of 4 · title" and the 4 progress bars. */
export function StepHeader({ step, title, back = true }: { step: number; title: string; back?: boolean }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.row, !back && { minHeight: 44 }]}>
        {back && <BackButton />}
        <T size={13} color={colors.muted}>
          Step {step} of 4 · {title}
        </T>
      </View>
      <View style={styles.steps}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.step, { backgroundColor: i <= step ? colors.green : colors.line }]} />
        ))}
      </View>
    </View>
  );
}

/** Big selectable card with a radio dot (ID type, payment method). */
export function ChoiceCard({ selected, title, sub, icon, onPress }: { selected: boolean; title: string; sub?: string; icon?: IconName; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}>
      {icon && (
        <View style={styles.choiceIcon}>
          <Icon name={icon} size={20} color={colors.green} strokeWidth={1.8} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <T size={15} weight="semibold">
          {title}
        </T>
        {sub ? (
          <T size={12} color={colors.muted}>
            {sub}
          </T>
        ) : null}
      </View>
      <View style={[styles.radio, selected && { borderColor: colors.green }]}>{selected && <View style={styles.radioDot} />}</View>
    </Pressable>
  );
}

/** Photo upload box. Demo only: tapping marks it as added. */
export function UploadBox({ label, hint, done, onPress }: { label: string; hint: string; done: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={done ? `${label}, added. Tap to replace` : `Add ${label}`}
      onPress={onPress}
      style={[styles.upload, done && styles.uploadDone]}>
      <View style={[styles.choiceIcon, done && { backgroundColor: colors.green }]}>
        <Icon name={done ? 'check' : 'camera'} size={20} color={done ? colors.white : colors.green} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={14} weight="semibold">
          {label}
        </T>
        <T size={12} color={colors.muted}>
          {done ? 'Added · tap to replace' : hint}
        </T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 5, borderRadius: 3 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
    minHeight: 64,
  },
  choiceOn: { borderColor: colors.green, borderWidth: 1.5, backgroundColor: colors.mint },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
  },
  uploadDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.mint },
});
