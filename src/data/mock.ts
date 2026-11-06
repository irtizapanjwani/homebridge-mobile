// Placeholder data matching the client design. Replace with API calls once the backend is connected.
import type { IconName } from '@/components/icon';

export const member = {
  firstName: 'Ada',
  fullName: 'Ada Okafor',
  initials: 'AO',
  memberId: 'HB-EDO-0123',
  type: 'Diaspora',
  city: 'London',
  cohort: 'Edo cohort',
  since: 'Jan 2026',
  balance: '£260.00',
  monthsPaid: 10,
  monthsTotal: 10,
  nextDue: '£25 due Sat 1 Nov',
};

export type Activity = {
  id: string;
  kind: 'payment' | 'vote';
  title: string;
  detail: string;
  value: string;
};

export const activity: Activity[] = [
  { id: 'a1', kind: 'payment', title: 'Monthly contribution', detail: '1 Oct · Card · receipt sent', value: '£25.00' },
  { id: 'a2', kind: 'vote', title: 'You voted · Motion 06', detail: '22 Sep · 2026 operating budget', value: 'Passed' },
  { id: 'a3', kind: 'payment', title: 'Monthly contribution', detail: '1 Sep · Card · receipt sent', value: '£25.00' },
];

export type ProjectStatus = 'Active' | 'Proposed' | 'Completed';

export type Project = {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  progress?: number;
  summary: string;
  summaryStrong?: string;
  note: string;
  noteHighlight?: boolean;
};

export const projects: Project[] = [
  {
    id: 'head-office',
    name: 'Head office fit-out',
    location: 'Ugbor, Benin City · Edo',
    status: 'Active',
    icon: 'building',
    iconBg: '#17452F',
    iconColor: '#C9A227',
    progress: 62,
    summaryStrong: '₦18.6m',
    summary: ' of ₦30m · phase 2 of 3',
    note: 'Vote open',
    noteHighlight: true,
  },
  {
    id: 'equity',
    name: 'Long-term equity portfolio',
    location: 'Expert-advised · all members',
    status: 'Active',
    icon: 'trend',
    iconBg: '#C9A227',
    iconColor: '#17452F',
    progress: 35,
    summaryStrong: '£4,200',
    summary: ' invested · quarterly report',
    note: 'Updated 2 days ago',
  },
  {
    id: 'abuja-housing',
    name: 'Abuja cohort — land and housing',
    location: 'FCT · proposed by 14 members',
    status: 'Proposed',
    icon: 'housing',
    iconBg: '#E8F0EA',
    iconColor: '#17452F',
    summary: 'Feasibility study in progress',
    note: 'Goes to vote in Nov',
  },
];

export const projectDetail = {
  name: 'Head office fit-out',
  cohort: 'Edo cohort',
  address: '4 Eregbowa Street, Ugbor Quarters, Benin City',
  raised: '₦18.6m',
  target: '₦30m',
  progress: 62,
  spent: '₦11.2m',
  phase: 'Phase 2',
  phaseOf: 'of 3',
  targetDate: 'Mar 2027',
  photos: 12,
  milestones: [
    { label: 'Site survey and approvals', when: 'Jun', state: 'done' as const },
    { label: 'Phase 1 — structure and roofing', when: 'Sep', state: 'done' as const },
    { label: 'Phase 2 — offices and shop units', when: 'Vote open', state: 'current' as const },
    { label: 'Phase 3 — fit-out and opening', when: '2027', state: 'todo' as const },
  ],
};

export const openMotion = {
  number: '07',
  title: 'Approve the phase 2 budget for the head office fit-out',
  body: 'Releases ₦9.5m for offices and shop units at Ugbor, Benin City. Three contractor quotes attached.',
  closes: 'Closes Sat 18 Oct, 11:59pm — UK and Lagos time',
  turnout: 41,
  quorum: 50,
  receipt: 'HB-V07-8841',
};

export const lastMotion = {
  title: 'Motion 06 · 2026 operating budget',
  result: 'Passed',
  forPct: 78,
  againstPct: 15,
  summary: '78% for · 15% against · 7% abstain · turnout 64%',
};

export const statements = [
  { id: 's1', label: 'October 2026', amount: '£25.00' },
  { id: 's2', label: 'Year to date — 2026', amount: '£260.00' },
];

// Office contact and website. The app links here for things that stay on the website (applying, nominee changes).
export const office = {
  email: 'info@homebridgecooperative.org',
  website: 'https://homebridge-two.vercel.app',
};

// "My account" screen. Mirrors what the website's member portal shows.
export const account = {
  status: 'Approved' as 'In review' | 'Information requested' | 'Approved',
  approvedOn: '14 Jan 2026',
  joiningFee: {
    amount: '£10.00',
    paid: true,
    paidOn: '12 Jan 2026',
    method: 'Card · Stripe',
    paidTo: 'VEKAT Group Ltd',
    reference: 'JF-EDO-0123',
  },
  documents: [
    { id: 'certificate', title: 'Membership certificate', detail: 'PDF · issued 14 Jan 2026', icon: 'award' as const },
    { id: 'fee-receipt', title: 'Joining fee receipt', detail: 'PDF · £10.00 · 12 Jan 2026', icon: 'doc' as const },
  ],
  email: 'ada.okafor@example.com',
  phone: '+44 7700 900123',
  address: '12 Example Road, Apt 3\nLondon E1 0AA\nUnited Kingdom',
  country: 'United Kingdom',
  homeCohort: 'Edo',
  nominee: {
    name: 'Chidi Okafor',
    initials: 'CO',
    relation: 'Brother · receives 100% of shares',
    phone: '+234 803 000 0000',
    livesIn: 'Benin City, Edo',
    email: 'chidi@example.com',
    added: 'Jan 2026',
  },
};
