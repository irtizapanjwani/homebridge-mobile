/// <reference types="node" />
// Fixed details the PDFs and forms print, copied word for word from the website (HomeBridge
// lib/settings.ts, lib/content.ts and lib/forms-text.ts). If the client changes any of these on the
// website, change them here too so both print the same thing.

export const JOINING_FEE = {
  ngn: 10_000,
  gbp: 10,
  payee: "VEKAT Group Ltd",
  payeeRole: "the cooperative’s appointed manager",
} as const;

export const MIN_MONTHLY = { ngn: 5_000, gbp: 25 }; // bye-law 11.2
export const FOUNDING_BLOCK = { ngn: 2_000_000, gbp: 1_000 }; // bye-law 5.4
export const SHARE_PRICE_NGN = 1_000; // bye-law 11.1

/** Bye-law 14.1: the Society's nominated accounts. Details still to be confirmed by the client. */
export const SOCIETY_ACCOUNTS = {
  NGN: {
    label: "UBA naira account",
    bank: "United Bank for Africa (UBA) — to be confirmed",
    accountName: "HomeBridge Cooperative Society Ltd",
    accountNumber: "[UBA naira account number — to be confirmed]",
    extra: null as null | { label: string; value: string },
  },
  USD: {
    label: "US dollar domiciliary",
    bank: "[Bank — to be confirmed]",
    accountName: "HomeBridge Cooperative Society Ltd",
    accountNumber: "[USD domiciliary number — to be confirmed]",
    extra: { label: "SWIFT / BIC", value: "[To be confirmed]" },
  },
  GBP: {
    label: "Pound sterling domiciliary",
    bank: "[Bank — to be confirmed]",
    accountName: "HomeBridge Cooperative Society Ltd",
    accountNumber: "[GBP domiciliary number — to be confirmed]",
    extra: { label: "SWIFT / BIC", value: "[To be confirmed]" },
  },
} as const;

export const CONTACT = {
  email: "info@homebridgecooperative.org",
  phoneDisplay: "0810 583 2602",
  phoneIntl: "+234 810 583 2602",
  phoneHref: "tel:+2348105832602",
  whatsapp: "https://wa.me/2348105832602",
  address: ["4 Eregbowa Street, off Trinity Road,", "Ugbor Quarters, Benin City, Edo State, Nigeria"],
};

export const DECLARATION_STATEMENTS: string[] = [
  "The information I gave in my application is true and complete, and I will tell HomeBridge promptly if it changes.",
  "I have received and read the Bye-laws, Member Handbook, Contribution and Payment Guide, Investment Risk Statement and Privacy Notice.",
  "I agree to abide by the Bye-laws of HomeBridge Cooperative and the lawful decisions of its General Meetings and Governing Board.",
  "I understand that my contributions buy shares, that their value can fall as well as rise, and that no return is guaranteed.",
  "I understand that the joining (registration) fee is non-refundable.",
  "I will make contributions only into HomeBridge Cooperative’s official accounts, quoting my membership number.",
  `I understand that ${JOINING_FEE.payee} manages the cooperative’s administration as its appointed manager.`,
  `I consent to HomeBridge Cooperative and ${JOINING_FEE.payee} processing my personal data as described in the Privacy Notice.`,
  "I am contributing my own funds, lawfully obtained.",
];

export const PHOTO_CONSENT = "I agree that photographs of me taken at HomeBridge events may be used in HomeBridge communications.";
