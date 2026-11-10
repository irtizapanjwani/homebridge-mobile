import * as ImagePicker from 'expo-image-picker';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { BackButton, T } from '@/components/ui';
import { colors } from '@/constants/theme';

// Same values as the website (lib/settings.ts and lib/register-data.ts).
export const JOINING_FEE = { ngn: 10_000, gbp: 10, payee: 'VEKAT Group Ltd' };
export const MIN_MONTHLY = { ngn: 5_000, gbp: 25 };
// Same as the website (lib/member-auth.ts).
export const MIN_PASSWORD_LENGTH = 10;
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

// Same lists and wording as the website (lib/register-data.ts, lib/content.ts).
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano',
  'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];
export const OTHER_COUNTRY = 'Another country';
export const COUNTRIES = [
  'Nigeria', 'United Kingdom', 'United States', 'Canada', 'Ireland', 'Germany', 'Netherlands', 'Italy',
  'France', 'Spain', 'Belgium', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'South Africa', 'Ghana',
  'Kenya', 'Australia', OTHER_COUNTRY,
];
export const CHAPTERS = ['HomeBridge Edo', 'HomeBridge Abuja', 'HomeBridge UK', 'None yet'];
export const HEARD_OPTIONS = ['WhatsApp', 'Friend or family', 'Church, mosque or union', 'Zoom launch', 'Social media', 'Other'];
export const MEMBERSHIP_TYPES = [
  { value: 'home', label: 'Home member', sub: 'Living in Nigeria', more: 'For people who live in Nigeria. Monthly shares from ₦5,000.' },
  { value: 'diaspora', label: 'Diaspora member', sub: 'Living abroad', more: 'For people who live outside Nigeria. Monthly shares from £25.' },
  {
    value: 'founding',
    label: 'Founding member',
    sub: '£1,000 / ₦2m block, year one',
    more: 'For people who join in the first 12 months and take a founding block of at least £1,000 or ₦2,000,000. Same rights and one vote, like everyone else.',
  },
  { value: 'professional', label: 'Professional member', sub: 'Pay up to half in skills', more: 'Up to half of your monthly contribution can be paid in professional hours, at a rate the Board approves.' },
  { value: 'group', label: 'Group member', sub: 'Union, church, mosque, business', more: 'A registered union, cooperative, religious body, association or business joins through one named representative.' },
] as const;
export const ROUTE_OPTIONS = [
  { value: 'lives', label: 'I live in Edo State or Abuja FCT' },
  { value: 'land', label: 'I live elsewhere, but I or my family own or hold land or a home in Edo or FCT' },
  { value: 'other', label: 'Another link to Edo or FCT (sent for Director approval)' },
  { value: 'none', label: 'None of these yet: add me to the Supporter list' },
] as const;
export const GROUP_DOC_OPTIONS = [
  { value: 'cac', label: 'CAC certificate', sub: 'Corporate Affairs Commission' },
  { value: 'regcert', label: 'Another registration certificate', sub: 'For example a cooperative, union or religious body' },
] as const;
export const MAX_NOMINEES = 5;

export type NomineeDraft = { id: string; name: string; relationship: string; contact: string; share: string };
export type Decl = { character: boolean; bylaws: boolean; risk: boolean; privacy: boolean };

export type Draft = {
  home: boolean;
  name: string;
  code: string;
  phone: string;
  email: string;
  contactMethod: 'phone' | 'email'; // how they sign in and get codes, like the website
  password: string; // kept in memory only, never saved to the phone
  passwordConfirm: string;
  country: string;
  cohort: string;
  agreed: boolean;
  // About you
  dob: string; // DD/MM/YYYY
  countryOther: string;
  state: string;
  city: string;
  address: string;
  occupation: string;
  heard: string;
  chapter: string;
  // How you join
  memberType: string;
  route: string;
  routeDetail: string;
  groupName: string;
  repName: string;
  groupDoc: string;
  // Nominee and agreements
  nominees: NomineeDraft[];
  decl: Decl;
  // Verify ID
  idType: string;
  idNumber: string;
  idPhoto: string | null; // local photo uri
  addressProof: string | null;
  // Step 3
  payMethod: 'card' | 'bank' | '';
  datePaid: string;
  payReference: string;
  // Step 4
  monthly: number;
  payDay: number;
  /** Set once the application is saved: HBA-YYMM-NNNN (or SUP-… for a supporter). */
  reference: string;
};

const empty = (home: boolean): Draft => ({
  home,
  name: '',
  code: home ? '+234' : '+44',
  phone: '',
  email: '',
  contactMethod: 'phone',
  password: '',
  passwordConfirm: '',
  country: home ? 'Nigeria' : 'United Kingdom',
  cohort: 'Edo',
  agreed: false,
  dob: '',
  countryOther: '',
  state: home ? 'Edo' : '',
  city: '',
  address: '',
  occupation: '',
  heard: '',
  chapter: home ? 'HomeBridge Edo' : 'HomeBridge UK',
  memberType: home ? 'home' : 'diaspora',
  route: '',
  routeDetail: '',
  groupName: '',
  repName: '',
  groupDoc: '',
  nominees: [{ id: 'n1', name: '', relationship: '', contact: '', share: '100' }],
  decl: { character: false, bylaws: false, risk: false, privacy: false },
  idType: '',
  idNumber: '',
  idPhoto: null,
  addressProof: null,
  payMethod: '',
  datePaid: '',
  payReference: '',
  monthly: home ? MIN_MONTHLY.ngn : MIN_MONTHLY.gbp,
  payDay: 1,
  reference: '',
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
export const TOTAL_STEPS = 7;

/** Age in whole years from DD/MM/YYYY, or null if the date isn't valid. */
export function ageFrom(dob: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dob.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}

export function StepHeader({ step, title, back = true }: { step: number; title: string; back?: boolean }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.row, !back && { minHeight: 44 }]}>
        {back && <BackButton />}
        <T size={13} color={colors.muted}>
          Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS} · {title}
        </T>
      </View>
      <View style={styles.steps}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
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

/** Open the camera or photo library and return the picked photo's uri (or null if cancelled). */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  const perm =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** Photo upload box: Camera / Gallery buttons, then a preview with Change and Remove. */
export function UploadBox({ label, hint, uri, onChange }: { label: string; hint: string; uri: string | null; onChange: (uri: string | null) => void }) {
  const [denied, setDenied] = useState(false);

  const pick = async (source: 'camera' | 'library') => {
    const picked = await pickPhoto(source);
    if (picked) {
      setDenied(false);
      onChange(picked);
    } else if (source === 'camera') {
      // Camera not allowed or not available (e.g. on a computer): fall back to the gallery.
      const fromLibrary = await pickPhoto('library');
      if (fromLibrary) onChange(fromLibrary);
      else setDenied(true);
    }
  };

  return (
    <View style={[styles.upload, uri && styles.uploadDone]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} accessibilityLabel={`${label} preview`} />
        ) : (
          <View style={styles.choiceIcon}>
            <Icon name="camera" size={20} color={colors.green} strokeWidth={1.8} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <T size={14} weight="semibold">
            {label}
          </T>
          <T size={12} color={uri ? colors.green : colors.muted}>
            {uri ? 'Photo added ✓' : hint}
          </T>
        </View>
      </View>
      {denied && (
        <T size={12} color={colors.goldText}>
          Please allow HomeBridge to use your camera or photos in your phone’s settings.
        </T>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {uri ? (
          <>
            <SmallButton label="Change photo" onPress={() => pick('library')} onMint />
            <SmallButton label="Remove" onPress={() => onChange(null)} subtle />
          </>
        ) : (
          <>
            <SmallButton label="Take photo" icon="camera" onPress={() => pick('camera')} />
            <SmallButton label="Gallery" icon="photo" onPress={() => pick('library')} />
          </>
        )}
      </View>
    </View>
  );
}

function SmallButton({ label, icon, onPress, subtle, onMint }: { label: string; icon?: IconName; onPress: () => void; subtle?: boolean; onMint?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.smallBtn, onMint && { backgroundColor: colors.white }, subtle && { backgroundColor: 'transparent' }, { opacity: pressed ? 0.7 : 1 }]}>
      {icon && <Icon name={icon} size={16} color={colors.green} strokeWidth={2} />}
      <T size={13} weight="semibold" color={subtle ? colors.muted : colors.green} numberOfLines={1}>
        {label}
      </T>
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
    gap: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: 14,
    backgroundColor: colors.white,
    padding: 14,
  },
  uploadDone: { borderStyle: 'solid', borderColor: colors.green, backgroundColor: colors.mint },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.lineSoft },
  smallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.mint,
    paddingHorizontal: 8,
  },
});
