/// <reference types="node" />
// The parts of the website's MongoDB records the app's API reads. Field names must match the
// website exactly (HomeBridge lib/members.ts, lib/contributions.ts, lib/documents.ts).

import type { ObjectId } from 'mongodb';

export type MemberStatus = 'Submitted' | 'In review' | 'Info requested' | 'Approved' | 'Declined';

export type MemberDoc = {
  _id?: ObjectId;
  reference: string;
  status: MemberStatus;
  supporter: boolean;
  title?: string;
  firstName?: string;
  fullName: string;
  dob: string;
  email: string;
  emailNorm: string;
  whatsapp: string;
  phoneNorm: string;
  contactMethod: string;
  contact: string;
  country: string;
  state: string;
  city: string;
  address: string;
  chapter: string;
  memberType: string;
  idChoice: string;
  submittedAt: Date;
  payment?: {
    status: 'Claimed' | 'Verified' | 'Not matched';
    method: string;
    datePaid: string;
    reference: string;
    receiptNo?: string;
  };
  nominees: { name: string; relationship: string; contact: string; share: number }[];
  passwordHash?: string;
  passwordReset?: { tokenHash: string; expiresAt: Date; requestedAt: Date };
  membership?: { memberNo: string; zone: string; seq: number; admittedAt: Date; category?: string };
  decision?: { reason?: string; at: Date };
  infoResponse?: { message: string; at: Date };
};

export type Currency = 'NGN' | 'GBP' | 'USD';

export type ContributionDoc = {
  receiptNo: string;
  memberNo: string;
  memberRef: string;
  amount: number;
  currency: Currency;
  period: string; // YYYY-MM
  paidAt: Date;
};

export type DocumentMeta = {
  _id: ObjectId;
  ownerRef: string;
  type: 'id' | 'address' | 'info' | 'declaration' | 'nominee_form' | 'payment_proof';
  name: string;
  contentType: string;
  bytes: number;
  uploadedAt: Date;
};
