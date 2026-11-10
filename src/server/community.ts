/// <reference types="node" />
// Meetings, votes, ideas and the at-a-glance figures for the member dashboard. Reads and writes
// the website's own collections with the website's rules (HomeBridge lib/meetings.ts,
// lib/votes.ts, lib/transparency.ts), so the app and the website always agree.

import { ObjectId } from 'mongodb';

import { recordAudit } from './audit';
import { getDb } from './db';
import { money } from './me';
import type { ContributionDoc, Currency, MemberDoc } from './types';

const MIN_MONTHLY = { ngn: 5_000, gbp: 25 };
const CHOICES = ['For', 'Against', 'Abstain'] as const;
export type Choice = (typeof CHOICES)[number];
export const isChoice = (v: unknown): v is Choice => typeof v === 'string' && (CHOICES as readonly string[]).includes(v);
const IDEA_LABEL: Record<string, string> = { new: 'New', seen: 'Seen by the office', planned: 'Planned', not_now: 'Not for now' };
const DAY = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' });

/** Today in Lagos. */
function lagosToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { period: `${get('year')}-${get('month')}`, date: `${get('year')}-${get('month')}-${get('day')}` };
}
const periodOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

// ---------- Meeting (AGM) ----------

type Agm = { id?: string; date: string; time: string; place: string; agenda: string; noticeSentAt: string };
const agmIdOf = (a: Agm) => a.id ?? `agm-${a.noticeSentAt}`;

async function upcomingAgm(): Promise<Agm | null> {
  const doc = await (await getDb()).collection<{ _id: string; value: Agm | null }>('settings').findOne({ _id: 'agm' });
  const agm = doc?.value ?? null;
  return agm && agm.date >= lagosToday().date ? agm : null;
}

function meetingLabel(date: string, time: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  return time ? `${day}, ${time}` : day;
}

export async function meetingFor(memberNo: string) {
  const agm = await upcomingAgm();
  if (!agm) return null;
  const mine = await (await getDb()).collection<{ agmId: string; memberNo: string; answer: 'yes' | 'no' }>('agm_replies').findOne({ agmId: agmIdOf(agm), memberNo });
  const daysLeft = Math.round((Date.parse(`${agm.date}T12:00:00Z`) - Date.parse(`${lagosToday().date}T12:00:00Z`)) / 86_400_000);
  return {
    when: meetingLabel(agm.date, agm.time),
    date: agm.date,
    place: agm.place,
    agenda: agm.agenda
      .split('\n')
      .map((l) => l.replace(/^\s*(\d+[.)]|[-*])\s*/, '').trim())
      .filter(Boolean),
    daysLeft,
    answer: mine?.answer ?? null,
  };
}

export async function replyToAgm(member: MemberDoc, answer: 'yes' | 'no') {
  if (!member.membership) return { ok: false as const, error: 'Only members can reply.' };
  const agm = await upcomingAgm();
  if (!agm) return { ok: false as const, error: 'There is no meeting to reply to just now.' };
  const memberNo = member.membership.memberNo;
  await (await getDb())
    .collection('agm_replies')
    .updateOne({ agmId: agmIdOf(agm), memberNo }, { $set: { answer, name: member.fullName, at: new Date() } }, { upsert: true });
  await recordAudit({ action: 'meeting.reply', actor: `Member (${memberNo})`, subject: 'Annual General Meeting', detail: answer === 'yes' ? 'Will attend' : 'Cannot attend' }).catch(() => {});
  return { ok: true as const };
}

// ---------- Votes ----------

type MotionDoc = { _id: ObjectId; title: string; details: string; status: 'draft' | 'open' | 'closed'; openedAt?: Date; closedAt?: Date };
type VoteDoc = { motionId: ObjectId; memberNo: string; choice: Choice; at: Date; byProxy?: string };
type ProxyDoc = { motionId: ObjectId; giverNo: string; giverName: string; holderNo: string; at: Date; live?: true; cancelledAt?: Date };
export const MAX_PROXIES_HELD = 5;

async function counts(motionId: ObjectId) {
  const rows = await (await getDb())
    .collection<VoteDoc>('votes')
    .aggregate<{ _id: Choice; n: number }>([{ $match: { motionId } }, { $group: { _id: '$choice', n: { $sum: 1 } } }])
    .toArray();
  const out = { For: 0, Against: 0, Abstain: 0 } as Record<Choice, number>;
  for (const r of rows) out[r._id] = r.n;
  return out;
}
const resultOf = (c: Record<Choice, number>) =>
  c.For + c.Against + c.Abstain === 0 ? 'No votes cast' : c.For > c.Against ? 'Passed' : c.Against > c.For ? 'Not passed' : 'Tied';

export async function motionsFor(memberNo: string) {
  const db = await getDb();
  const list = await db.collection<MotionDoc>('motions').find({ status: { $in: ['open', 'closed'] } }).sort({ openedAt: -1 }).limit(10).toArray();
  const ids = list.map((m) => m._id);
  const mine = await db.collection<VoteDoc>('votes').find({ memberNo, motionId: { $in: ids } }).toArray();
  const given = await db.collection<ProxyDoc>('proxies').find({ giverNo: memberNo, motionId: { $in: ids }, cancelledAt: { $exists: false } }).toArray();
  const held = await db.collection<ProxyDoc>('proxies').find({ holderNo: memberNo, motionId: { $in: ids }, cancelledAt: { $exists: false } }).toArray();
  const heldVotes = held.length
    ? await db.collection<VoteDoc>('votes').find({ motionId: { $in: ids }, memberNo: { $in: held.map((p) => p.giverNo) } }).toArray()
    : [];
  return Promise.all(
    list.map(async (m) => {
      const id = String(m._id);
      const c = m.status === 'closed' ? await counts(m._id) : null;
      const v = mine.find((x) => String(x.motionId) === id);
      return {
        id,
        title: m.title,
        details: m.details,
        status: m.status as 'open' | 'closed',
        myVote: v?.choice ?? null,
        myVoteByProxy: v?.byProxy ?? null,
        result: c ? { ...c, outcome: resultOf(c) } : null,
        closedAt: m.closedAt ? DAY.format(m.closedAt) : '',
        proxyGivenTo: given.find((p) => String(p.motionId) === id)?.holderNo ?? null,
        /** Members who gave this member their proxy on this motion, and whether their vote is in. */
        proxiesHeld: held
          .filter((p) => String(p.motionId) === id)
          .map((p) => ({
            memberNo: p.giverNo,
            name: p.giverName?.split(/\s+/)[0] ?? '',
            voted: heldVotes.find((x) => String(x.motionId) === id && x.memberNo === p.giverNo)?.choice ?? null,
          })),
      };
    }),
  );
}

export async function castVote(member: MemberDoc, motionId: string, choice: Choice, forMemberNo?: string) {
  if (!member.membership) return { ok: false as const, error: 'Only members can vote.', status: 403 };
  if (!ObjectId.isValid(motionId)) return { ok: false as const, error: 'That vote no longer exists.', status: 404 };
  const db = await getDb();
  const motion = await db.collection<MotionDoc>('motions').findOne({ _id: new ObjectId(motionId) });
  if (!motion) return { ok: false as const, error: 'That vote no longer exists.', status: 404 };
  if (motion.status !== 'open') return { ok: false as const, error: 'This vote is not open.', status: 409 };
  const me = member.membership.memberNo;
  const voter = forMemberNo ? forMemberNo.trim().toUpperCase() : me;
  const proxies = db.collection<ProxyDoc>('proxies');
  if (forMemberNo) {
    if (!(await proxies.findOne({ motionId: motion._id, giverNo: voter, holderNo: me, cancelledAt: { $exists: false } }))) {
      return { ok: false as const, error: 'You do not hold that member’s proxy for this vote.', status: 403 };
    }
  } else if (await proxies.findOne({ motionId: motion._id, giverNo: me, cancelledAt: { $exists: false } })) {
    return { ok: false as const, error: 'You have given your proxy on this vote. Cancel it first if you want to vote yourself.', status: 409 };
  }
  try {
    // The website keeps a unique index on (motionId, memberNo), so a member can only vote once.
    await db.collection<VoteDoc>('votes').insertOne({ motionId: motion._id, memberNo: voter, choice, at: new Date(), ...(forMemberNo ? { byProxy: me } : {}) });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return { ok: false as const, error: forMemberNo ? 'That member’s vote has already been cast.' : 'You have already voted on this.', status: 409 };
    }
    throw err;
  }
  await recordAudit({
    action: 'vote.cast',
    actor: `Member (${me})`,
    subject: motion.title,
    detail: forMemberNo ? `Vote recorded for ${voter} as their proxy (app)` : 'Vote recorded (app)',
  });
  return { ok: true as const };
}

// ---------- Proxies (bye-law 16.4) ----------

/** Same index as the website: one live proxy per member per motion. Harmless if it already exists. */
let proxyIndex: Promise<unknown> | null = null;
async function ensureProxyIndex() {
  proxyIndex ??= (await getDb())
    .collection('proxies')
    .createIndex({ motionId: 1, giverNo: 1 }, { name: 'one_live_proxy', unique: true, partialFilterExpression: { live: true } })
    .catch(() => {
      proxyIndex = null;
    });
  return proxyIndex;
}

/** Not yourself; the holder is a member; you haven't voted; they hold fewer than 5; no chains. */
export async function giveProxy(member: MemberDoc, motionId: string, holderNoRaw: string) {
  await ensureProxyIndex();
  if (!member.membership) return { ok: false as const, error: 'Only members can give a proxy.' };
  if (!ObjectId.isValid(motionId)) return { ok: false as const, error: 'That vote no longer exists.' };
  const holderNo = holderNoRaw.trim().toUpperCase().replace(/\s+/g, '');
  const me = member.membership.memberNo;
  if (holderNo === me) return { ok: false as const, error: 'You cannot give your proxy to yourself.' };
  const db = await getDb();
  const motion = await db.collection<MotionDoc>('motions').findOne({ _id: new ObjectId(motionId) });
  if (!motion || motion.status !== 'open') return { ok: false as const, error: 'This vote is not open.' };
  if (await db.collection<VoteDoc>('votes').findOne({ motionId: motion._id, memberNo: me })) return { ok: false as const, error: 'You have already voted on this.' };
  const holder = await db.collection('members').findOne({ 'membership.memberNo': holderNo }, { projection: { fullName: 1 } });
  if (!holder) return { ok: false as const, error: 'No member holds that number. Check it with them.' };
  const proxies = db.collection<ProxyDoc>('proxies');
  const live = { motionId: motion._id, cancelledAt: { $exists: false } };
  if (await proxies.findOne({ ...live, giverNo: holderNo })) return { ok: false as const, error: 'That member has given their own proxy away, so they cannot hold yours.' };
  if ((await proxies.countDocuments({ ...live, holderNo })) >= MAX_PROXIES_HELD) {
    return { ok: false as const, error: `That member already holds ${MAX_PROXIES_HELD} proxies, the most allowed.` };
  }
  try {
    await proxies.insertOne({ motionId: motion._id, giverNo: me, giverName: member.fullName, holderNo, at: new Date(), live: true });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return { ok: false as const, error: 'You have already given your proxy on this vote. Cancel it first.' };
    throw err;
  }
  await recordAudit({ action: 'vote.proxy_given', actor: `Member (${me})`, subject: motion.title, detail: `Proxy given to ${holderNo} (app)` });
  return { ok: true as const };
}

/** Takes a proxy back, as long as it hasn't been used. */
export async function cancelProxy(member: MemberDoc, motionId: string) {
  if (!member.membership || !ObjectId.isValid(motionId)) return { ok: false as const, error: 'Not found.' };
  const me = member.membership.memberNo;
  const db = await getDb();
  const motion = await db.collection<MotionDoc>('motions').findOne({ _id: new ObjectId(motionId) });
  if (!motion || motion.status !== 'open') return { ok: false as const, error: 'This vote is not open.' };
  if (await db.collection<VoteDoc>('votes').findOne({ motionId: motion._id, memberNo: me })) {
    return { ok: false as const, error: 'Your vote has already been cast, so the proxy cannot be cancelled.' };
  }
  const res = await db
    .collection<ProxyDoc>('proxies')
    .findOneAndUpdate({ motionId: motion._id, giverNo: me, cancelledAt: { $exists: false } }, { $set: { cancelledAt: new Date() }, $unset: { live: '' } });
  if (!res) return { ok: false as const, error: 'You have not given a proxy on this vote.' };
  await recordAudit({ action: 'vote.proxy_cancelled', actor: `Member (${me})`, subject: motion.title, detail: `Proxy to ${res.holderNo} cancelled (app)` });
  return { ok: true as const };
}

// ---------- Ideas ----------

type IdeaDoc = { memberRef: string; memberNo: string; name: string; chapter: string; text: string; at: Date; status: string; reply?: string };

export async function ideasFor(memberRef: string) {
  const rows = await (await getDb()).collection<IdeaDoc>('ideas').find({ memberRef }).sort({ at: -1 }).limit(10).toArray();
  return rows.map((i) => ({ id: String((i as IdeaDoc & { _id: ObjectId })._id), text: i.text, at: DAY.format(i.at), status: IDEA_LABEL[i.status] ?? i.status, reply: i.reply ?? '' }));
}

export async function sendIdea(member: MemberDoc, text: string) {
  if (!member.membership) return { ok: false as const, error: 'Only members can send ideas.' };
  const t = text.trim().slice(0, 2000);
  if (t.length < 5) return { ok: false as const, error: 'Write a little more about your idea.' };
  const ideas = (await getDb()).collection<IdeaDoc>('ideas');
  const today = await ideas.countDocuments({ memberRef: member.reference, at: { $gt: new Date(Date.now() - 86_400_000) } });
  if (today >= 5) return { ok: false as const, error: 'You have sent five ideas today. Please try again tomorrow.' };
  await ideas.insertOne({ memberRef: member.reference, memberNo: member.membership.memberNo, name: member.fullName, chapter: member.chapter, text: t, at: new Date(), status: 'new' });
  await recordAudit({ action: 'idea.sent', actor: `Member (${member.membership.memberNo})`, subject: 'Member idea', detail: t.slice(0, 120) });
  return { ok: true as const };
}

// ---------- HomeBridge at a glance ----------

type Totals = Partial<Record<Currency, number>>;
const meetsMinimum = (t: Totals) => (t.NGN ?? 0) >= MIN_MONTHLY.ngn || (t.GBP ?? 0) >= MIN_MONTHLY.gbp || (t.USD ?? 0) > 0;

export async function glance() {
  const { period, date } = lagosToday();
  const db = await getDb();
  const [admitted, contribs, pending, holidays] = await Promise.all([
    db.collection<MemberDoc>('members').find({ 'membership.memberNo': { $exists: true } }, { projection: { chapter: 1, membership: 1 } }).toArray(),
    db.collection<ContributionDoc>('contributions').find({}).toArray(),
    db.collection<{ memberNo: string }>('payment_proofs').find({ status: 'pending', period }, { projection: { memberNo: 1 } }).toArray().catch(() => []),
    db.collection<{ memberNo: string; months: string[] }>('payment_holidays').find({ status: 'approved' }, { projection: { memberNo: 1, months: 1 } }).toArray().catch(() => []),
  ]);
  const waiting = new Set(pending.map((p) => p.memberNo));
  const onHoliday = new Map<string, Set<string>>();
  for (const h of holidays) onHoliday.set(h.memberNo, new Set([...(onHoliday.get(h.memberNo) ?? []), ...h.months]));

  const funds = (['NGN', 'GBP', 'USD'] as const)
    .map((c) => [c, contribs.filter((x) => x.currency === c).reduce((t, x) => t + x.amount, 0)] as const)
    .filter(([, t]) => t > 0)
    .map(([c, t]) => money(t, c));

  const thisMonth = new Map<string, Totals>();
  for (const c of contribs.filter((x) => x.period === period)) {
    const t = thisMonth.get(c.memberNo) ?? {};
    t[c.currency] = (t[c.currency] ?? 0) + c.amount;
    thisMonth.set(c.memberNo, t);
  }
  const zones = new Map<string, { members: number; due: number; paid: number }>();
  let due = 0;
  let paid = 0;
  for (const m of admitted) {
    const no = m.membership!.memberNo;
    const z = zones.get(m.chapter || 'Other') ?? { members: 0, due: 0, paid: 0 };
    z.members++;
    if (periodOf(m.membership!.admittedAt) < period && !onHoliday.get(no)?.has(period)) {
      z.due++;
      due++;
      if (meetsMinimum(thisMonth.get(no) ?? {}) || waiting.has(no)) {
        z.paid++;
        paid++;
      }
    }
    zones.set(m.chapter || 'Other', z);
  }
  const pct = (p: number, d: number) => (d ? Math.round((p / d) * 100) : null);
  return {
    funds,
    members: admitted.length,
    percentUpToDate: pct(paid, due),
    zones: [...zones.entries()]
      .sort((a, b) => b[1].members - a[1].members || a[0].localeCompare(b[0]))
      .map(([zone, z]) => ({ zone, members: z.members, percentUpToDate: pct(z.paid, z.due) })),
    asOf: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)),
  };
}
