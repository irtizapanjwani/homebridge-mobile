/// <reference types="node" />
// Registration ("Send application"). A copy of the website's rules — HomeBridge
// app/api/apply/route.ts, lib/register-data.ts, lib/members.ts and lib/numbering.ts — so an
// application sent from the app is stored exactly like one sent from the website:
//   - same validation (bye-laws 5.1 age 18+, 5.2 link to Edo/FCT, 10.1 nominees add to 100%)
//   - same reference: HBA-YYMM-NNNN from the shared "application_seq" counter (SUP-XXXXXX for supporters)
//   - same "people" record, matched by email or phone across both sites
//   - same member document shape, status "Submitted", payment "Claimed"

import { randomBytes } from 'node:crypto';

import { getDb } from './db';

export const BANK_METHOD = 'Bank transfer to VEKAT First Bank 2049483671 (₦10,000)';
export const CARD_METHOD = 'Secure card payment link (£10)';
export const MIN_PASSWORD_LENGTH = 10;

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
export const MEMBER_TYPES = ['home', 'diaspora', 'founding', 'professional', 'group'];
export const TYPE_LABEL: Record<string, string> = {
  home: 'Home member', diaspora: 'Diaspora member', founding: 'Founding member', professional: 'Professional member', group: 'Group member',
};
const ROUTES = ['lives', 'land', 'other', 'none'];
const ID_NIGERIA = ['bvn', 'nin'];
const ID_ABROAD = ['nrbvn', 'passport'];
const GROUP_DOCS = ['cac', 'regcert'];

export type Nominee = { name: string; relationship: string; contact: string; share: string };
export type Draft = {
  contactMethod: 'phone' | 'email';
  contact: string;
  password: string;
  passwordConfirm: string;
  fullName: string;
  dob: string; // yyyy-mm-dd
  country: string;
  countryOther: string;
  state: string;
  city: string;
  address: string;
  whatsapp: string;
  email: string;
  occupation: string;
  heard: string;
  chapter: string;
  memberType: string;
  route: string;
  routeDetail: string;
  idChoice: string;
  groupName: string;
  repName: string;
  groupDoc: string;
  nominees: Nominee[];
  decl: { character: boolean; bylaws: boolean; risk: boolean; privacy: boolean };
  supporterConsent: boolean;
  paymentMethod: string;
  datePaid: string;
  paymentReference: string;
  payerName: string;
};

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const oneOf = (v: unknown, list: readonly string[]) => {
  const s = str(v, 80);
  return list.includes(s) ? s : '';
};

/** Rebuilds a Draft from untrusted JSON using only known fields (an ID number is never kept). */
export function toDraft(body: Record<string, unknown>): Draft {
  const decl = (body.decl ?? {}) as Record<string, unknown>;
  const nominees = Array.isArray(body.nominees) ? body.nominees.slice(0, 5) : [];
  return {
    contactMethod: body.contactMethod === 'email' ? 'email' : 'phone',
    contact: str(body.contact, 120),
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirm: typeof body.passwordConfirm === 'string' ? body.passwordConfirm : '',
    fullName: str(body.fullName, 120),
    dob: str(body.dob, 10),
    country: oneOf(body.country, COUNTRIES),
    countryOther: str(body.countryOther, 80),
    state: oneOf(body.state, NIGERIAN_STATES),
    city: str(body.city, 80),
    address: str(body.address, 300),
    whatsapp: str(body.whatsapp, 40),
    email: str(body.email, 120),
    occupation: str(body.occupation, 100),
    heard: oneOf(body.heard, HEARD_OPTIONS),
    chapter: oneOf(body.chapter, CHAPTERS),
    memberType: oneOf(body.memberType, MEMBER_TYPES),
    route: oneOf(body.route, ROUTES),
    routeDetail: str(body.routeDetail, 400),
    idChoice: oneOf(body.idChoice, [...ID_NIGERIA, ...ID_ABROAD]),
    groupName: str(body.groupName, 160),
    repName: str(body.repName, 120),
    groupDoc: oneOf(body.groupDoc, GROUP_DOCS),
    nominees: nominees.map((raw) => {
      const n = (raw ?? {}) as Record<string, unknown>;
      return { name: str(n.name, 120), relationship: str(n.relationship, 60), contact: str(n.contact, 120), share: str(n.share, 3) };
    }),
    paymentMethod: oneOf(body.paymentMethod, [BANK_METHOD, CARD_METHOD]),
    datePaid: str(body.datePaid, 10),
    paymentReference: str(body.paymentReference, 80),
    payerName: str(body.payerName, 120),
    decl: { character: decl.character === true, bylaws: decl.bylaws === true, risk: decl.risk === true, privacy: decl.privacy === true },
    supporterConsent: body.supporterConsent === true,
  };
}

// ---------- Validation (website lib/register-data.ts) ----------

export const livesInNigeria = (d: Pick<Draft, 'country'>) => d.country === 'Nigeria';
export const countryName = (d: Pick<Draft, 'country' | 'countryOther'>) =>
  d.country === OTHER_COUNTRY ? d.countryOther.trim() || 'Another country' : d.country;
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v: string) => /^\+?\d{10,15}$/.test(v.trim().replace(/[\s\-().]/g, ''));
const nomineeTotal = (list: Nominee[]) => list.reduce((s, n) => s + (/^\d{1,3}$/.test(n.share.trim()) ? Number(n.share.trim()) : 0), 0);

export function ageOn(dob: string, today: Date): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return NaN;
  const y = +m[1], mo = +m[2], d = +m[3];
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (birth.getUTCFullYear() !== y || birth.getUTCMonth() !== mo - 1 || birth.getUTCDate() !== d) return NaN;
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age--;
  return age;
}

type StepId = 'account' | 'about' | 'join' | 'identity' | 'nominee' | 'fee' | 'supporter';
const flowFor = (d: Draft): StepId[] =>
  d.route === 'none' ? ['account', 'about', 'join', 'supporter'] : ['account', 'about', 'join', 'identity', 'nominee', 'fee'];

/** Errors for one step; keys are field names, values are messages to show. */
export function validateStep(step: StepId, d: Draft, today = new Date()): Record<string, string> {
  const e: Record<string, string> = {};
  const need = (key: string, ok: boolean, msg: string) => {
    if (!ok && !e[key]) e[key] = msg;
  };
  switch (step) {
    case 'account':
      if (d.contactMethod === 'phone') need('contact', isPhone(d.contact), 'Enter a full phone number, for example 0810 583 2602 or +44 7700 900123.');
      else need('contact', isEmail(d.contact), 'Enter an email address like name@example.com.');
      need('password', d.password.trim().length >= MIN_PASSWORD_LENGTH, `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
      need('passwordConfirm', d.password === d.passwordConfirm, 'The two passwords don’t match.');
      break;
    case 'about': {
      need('fullName', d.fullName.length >= 3 && /\s/.test(d.fullName), 'Enter your full name, first and last.');
      const age = ageOn(d.dob, today);
      need('dob', !Number.isNaN(age) && age < 120, 'Enter a real date of birth.');
      need('dob', !(age < 18), 'You need to be 18 or older to join (bye-law 5.1).');
      need('country', d.country !== '', 'Choose the country you live in.');
      if (d.country === OTHER_COUNTRY) need('countryOther', d.countryOther.length >= 2, 'Tell us which country you live in.');
      if (livesInNigeria(d)) need('state', NIGERIAN_STATES.includes(d.state), 'Choose your state.');
      need('city', d.city.length >= 2, 'Enter your town or city.');
      need('address', d.address.length >= 6, 'Enter your home address.');
      need('whatsapp', isPhone(d.whatsapp), 'Enter a full WhatsApp number, with the country code if you live abroad.');
      if (d.contactMethod === 'phone' || d.email) need('email', isEmail(d.email), 'Enter your email address.');
      need('occupation', d.occupation.length >= 2, 'Tell us your occupation, or say if you are retired or a student.');
      need('heard', d.heard !== '', 'Tell us how you heard about HomeBridge.');
      need('chapter', d.chapter !== '', 'Choose a chapter, or “None yet”.');
      break;
    }
    case 'join':
      if (d.route !== 'none') need('memberType', d.memberType !== '', 'Choose a membership type.');
      need('route', d.route !== '', 'Choose your link to Edo State or Abuja FCT.');
      if (d.route === 'land' || d.route === 'other') need('routeDetail', d.routeDetail.length >= 6, 'Tell us a little more about your link to Edo or the FCT.');
      break;
    case 'identity':
      if (d.memberType === 'group') {
        need('groupName', d.groupName.length >= 2, 'Enter the group’s registered name.');
        need('repName', d.repName.length >= 3, 'Enter the representative’s full name.');
        need('groupDoc', GROUP_DOCS.includes(d.groupDoc), 'Choose the group’s registration document.');
      }
      need('idChoice', (livesInNigeria(d) ? ID_NIGERIA : ID_ABROAD).includes(d.idChoice), 'Choose which ID you will use.');
      break;
    case 'nominee':
      if (d.memberType !== 'group') {
        d.nominees.forEach((n, i) => {
          need(`nominee-${i}-name`, n.name.length >= 3, `Enter nominee ${i + 1}’s full name.`);
          need(`nominee-${i}-relationship`, n.relationship.length >= 2, `Enter how nominee ${i + 1} is related to you.`);
          need(`nominee-${i}-contact`, isPhone(n.contact) || isEmail(n.contact), `Enter a phone number or email for nominee ${i + 1}.`);
          need(`nominee-${i}-share`, /^\d{1,3}$/.test(n.share) && +n.share >= 1 && +n.share <= 100, 'Enter a whole number from 1 to 100.');
        });
        need('nomineeTotal', nomineeTotal(d.nominees) === 100, `Shares must add up to exactly 100%. They add up to ${nomineeTotal(d.nominees)}%.`);
      }
      need('decl', d.decl.character && d.decl.bylaws && d.decl.risk && d.decl.privacy, 'Please confirm all four declarations.');
      break;
    case 'supporter':
      need('supporterConsent', d.supporterConsent, 'Please confirm we may contact you.');
      break;
    case 'fee':
      need('paymentMethod', d.paymentMethod === BANK_METHOD || d.paymentMethod === CARD_METHOD, 'Choose how you are paying the joining fee.');
      if (d.datePaid) need('datePaid', /^\d{4}-\d{2}-\d{2}$/.test(d.datePaid) && d.datePaid <= today.toISOString().slice(0, 10), 'Enter the date you paid. It cannot be in the future.');
      if (d.paymentReference) need('paymentReference', d.paymentReference.length >= 3, 'Enter at least 3 characters, or leave it blank.');
      break;
  }
  return e;
}

/** The first step with a problem, its errors, or null when everything is fine. */
export function firstProblem(d: Draft, today = new Date()) {
  for (const step of flowFor(d)) {
    const errors = validateStep(step, d, today);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}

// ---------- Storage (website lib/members.ts and lib/numbering.ts) ----------

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeReference(prefix: string) {
  return `${prefix}-${Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}
const normEmail = (v: string) => v.trim().toLowerCase();
const normPhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

/** HBA-YYMM-NNNN from the same counter the website uses, so the two never clash. */
export async function issueApplicationRef(at = new Date()) {
  const db = await getDb();
  const doc = await db
    .collection<{ _id: string; value: number }>('counters')
    .findOneAndUpdate({ _id: 'application_seq' }, { $inc: { value: 1 } }, { upsert: true, returnDocument: 'after' });
  if (!doc) throw new Error('Could not take the next application reference');
  const yy = String(at.getUTCFullYear()).slice(-2);
  const mm = String(at.getUTCMonth() + 1).padStart(2, '0');
  return `HBA-${yy}${mm}-${String(doc.value).padStart(4, '0')}`;
}

/** Finds the person behind an email or phone, or creates one (shared with the website and VEKAT). */
export async function upsertPerson(input: { name: string; email?: string; phone?: string }) {
  const people = (await getDb()).collection('people');
  const email = input.email ? normEmail(input.email) : '';
  const phone = input.phone ? normPhone(input.phone) : '';
  const or = [...(email ? [{ emails: email }] : []), ...(phone.length >= 7 ? [{ phones: phone }] : [])];
  const existing = or.length ? await people.findOne({ $or: or }) : null;
  const now = new Date();
  if (existing) {
    await people.updateOne(
      { reference: existing.reference },
      {
        $addToSet: { ...(email ? { emails: email } : {}), ...(phone ? { phones: phone } : {}) },
        $set: { updatedAt: now, ...(input.name ? { name: input.name } : {}) },
      },
    );
    return existing.reference as string;
  }
  const reference = makeReference('HB');
  await people.insertOne({ reference, emails: email ? [email] : [], phones: phone ? [phone] : [], name: input.name, createdAt: now, updatedAt: now });
  return reference;
}

/** The stored member document, field for field the same as the website's draftToMember. */
export function draftToMember(d: Draft, opts: { reference: string; personRef: string; passwordHash: string }) {
  const supporter = d.route === 'none';
  const now = new Date();
  const email = d.email || (d.contactMethod === 'email' ? d.contact : '');
  const phone = d.whatsapp || (d.contactMethod === 'phone' ? d.contact : '');
  return {
    reference: opts.reference,
    personRef: opts.personRef,
    status: 'Submitted',
    supporter,
    fullName: d.fullName,
    dob: d.dob,
    email,
    emailNorm: email ? normEmail(email) : '',
    whatsapp: d.whatsapp,
    phoneNorm: phone ? normPhone(phone) : '',
    contactMethod: d.contactMethod,
    contact: d.contact,
    country: d.country === OTHER_COUNTRY ? d.countryOther : d.country,
    state: d.state,
    city: d.city,
    address: d.address,
    occupation: d.occupation,
    heard: d.heard,
    chapter: d.chapter,
    memberType: supporter ? '' : d.memberType,
    route: d.route,
    routeDetail: d.routeDetail,
    idChoice: d.idChoice,
    groupName: d.groupName,
    repName: d.repName,
    groupDoc: d.groupDoc,
    nominees:
      supporter || d.memberType === 'group'
        ? []
        : d.nominees.map((n) => ({ name: n.name, relationship: n.relationship, contact: n.contact, share: Number(n.share) || 0 })),
    declarations: supporter ? null : d.decl,
    ...(supporter
      ? {}
      : {
          payment: {
            status: 'Claimed',
            method: d.paymentMethod,
            datePaid: d.datePaid,
            reference: d.paymentReference,
            receiptEmailed: false,
            payerName: d.payerName,
            verifiedAt: null,
            verifiedBy: null,
            amount: null,
          },
        }),
    passwordHash: opts.passwordHash,
    source: 'homebridge',
    submittedAt: now,
    updatedAt: now,
  };
}
