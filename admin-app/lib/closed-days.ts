import { createHash } from "node:crypto";
import { validDay, shiftDay, monthRange, overlaps } from "../../lib/closed-days-view.mjs";
export { validDay, shiftDay, monthRange, overlaps };

export type CalendarItem = {
  id: string; etag: string; summary?: string; status?: string;
  start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string };
  recurringEventId?: string; recurrence?: string[]; attendees?: unknown[]; conferenceData?: unknown;
  description?: string; location?: string; colorId?: string; transparency?: string; visibility?: string;
  reminders?: unknown; extendedProperties?: { private?: Record<string, string>; shared?: Record<string, string> };
};
export type CalendarBody = Omit<CalendarItem, "etag">;
export type CalendarAccess = {
  list(from: string, until: string): Promise<CalendarItem[]>;
  get(id: string): Promise<CalendarItem | null>;
  insert(body: CalendarBody): Promise<CalendarItem>;
  remove(id: string, etag: string): Promise<void>;
};
export type DayEvent = { id: string; etag: string; title: string; start: string; end: string; editable: boolean; recurring: boolean };
export type DayChange = { date: string; action: "add" | "remove"; events: DayEvent[] };
export type DayResult = { date: string; state: "applied" | "conflict" | "failed" | "unknown"; message?: string };
const titles = new Set(["店休日", "定休日", "休業日"]);
export const closedDayKind = "bassic-closed-day-v1";
export function editableClosedDay(event: CalendarItem) {
  return event.status !== "cancelled" && Boolean(event.start?.date && event.end?.date && validDay(event.start.date) && validDay(event.end.date) && event.start.date < event.end.date) &&
    titles.has(event.summary || "") && !event.attendees?.length && !event.conferenceData && !event.recurrence?.length;
}
const jstDate = (value: string) => new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 10);
export function dayEvent(event: CalendarItem): DayEvent {
  const start = event.start?.date || jstDate(event.start?.dateTime || "");
  const end = event.end?.date || shiftDay(jstDate(new Date(Date.parse(event.end?.dateTime || "") - 1).toISOString()), 1);
  return { id: event.id, etag: event.etag, title: event.summary || "予定あり", start, end, editable: editableClosedDay(event), recurring: Boolean(event.recurringEventId) };
}
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const statusOf = (error: unknown) => (error as { status?: number })?.status;
function marked(event: CalendarItem, operation: string, source: string) {
  const p = event.extendedProperties?.private;
  return p?.closedDayKind === closedDayKind && p.closedDayOperation === operation && p.closedDaySource === source;
}
function sameRetained(actual: CalendarItem, wanted: CalendarBody, operation: string, source: string) {
  return actual.status !== "cancelled" && actual.summary === wanted.summary && actual.start?.date === wanted.start?.date &&
    actual.end?.date === wanted.end?.date && marked(actual, operation, source);
}
async function ensureInsert(calendar: CalendarAccess, body: CalendarBody, matches: (event: CalendarItem) => boolean) {
  let found = await calendar.get(body.id);
  if (found && found.status !== "cancelled") {
    if (!matches(found)) throw Error("予定が変更されています。再読み込みしてください。");
    return found;
  }
  try { await calendar.insert(body); }
  catch (error) {
    // A response can be lost after Google accepted a write. Read before retrying.
    found = await calendar.get(body.id);
    if (found && matches(found)) return found;
    throw error;
  }
  found = await calendar.get(body.id);
  if (!found || !matches(found)) throw Error("保存結果を確認できませんでした。");
  return found;
}
async function addDay(calendar: CalendarAccess, calendarId: string, date: string, operation: string) {
  const current = (await calendar.list(date, shiftDay(date, 1))).filter(editableClosedDay);
  if (current.length) return;
  // Deterministic per-date generations serialize concurrent adds without reusing
  // deleted Google IDs. Retrying an accepted insert reuses the active generation.
  for (let generation = 0; generation < 64; generation++) {
    const id = "bc" + digest(calendarId + ":" + date) + "g" + generation.toString(16);
    const existing = await calendar.get(id);
    if (existing?.status === "cancelled") continue;
    const body: CalendarBody = { id, summary: "店休日", start: { date }, end: { date: shiftDay(date, 1) },
      transparency: "transparent", visibility: "public", extendedProperties: { private: { closedDayKind, closedDayOperation: operation } } };
    await ensureInsert(calendar, body, event => editableClosedDay(event) && event.start?.date === date && event.end?.date === shiftDay(date, 1) && event.extendedProperties?.private?.closedDayKind === closedDayKind);
    return;
  }
  throw Error("この日付の履歴を確認する必要があります。担当者へ連絡してください。");
}
function retainedBodies(original: CalendarItem, removed: Set<string>, operation: string): CalendarBody[] {
  const start = original.start!.date!, end = original.end!.date!;
  if ((Date.parse(end) - Date.parse(start)) / 86400000 > 366) throw Error("長期間の予定はGoogleカレンダーで確認してください。");
  const spans: Array<[string, string]> = [];
  let first = "";
  for (let date = start; date < end; date = shiftDay(date, 1)) {
    if (removed.has(date)) { if (first) spans.push([first, date]); first = ""; }
    else if (!first) first = date;
  }
  if (first) spans.push([first, end]);
  return spans.map(([from, until]) => ({
    id: "br" + digest(original.id + ":" + original.etag + ":" + operation + ":" + from + ":" + until),
    summary: original.summary, description: original.description, location: original.location, colorId: original.colorId,
    transparency: original.transparency, visibility: original.visibility, reminders: original.reminders,
    start: { date: from }, end: { date: until },
    extendedProperties: { shared: original.extendedProperties?.shared, private: { ...original.extendedProperties?.private,
      closedDayKind, closedDayOperation: operation, closedDaySource: original.id } }
  }));
}
async function removeDays(calendar: CalendarAccess, snapshot: DayEvent, dates: Set<string>, operation: string) {
  const original = await calendar.get(snapshot.id);
  const expectedBodies = retainedBodies({ id: snapshot.id, etag: snapshot.etag, summary: snapshot.title, start: { date: snapshot.start }, end: { date: snapshot.end } }, dates, operation);
  async function copies() {
    return (await calendar.list(snapshot.start, snapshot.end)).filter(event => marked(event, operation, snapshot.id) && event.status !== "cancelled");
  }
  async function verifyCopies() {
    const actual = await copies();
    if (expectedBodies.some(body => !actual.some(event => sameRetained(event, body, operation, snapshot.id)))) {
      throw Object.assign(Error("残す店休日の確認が必要です。担当者へ連絡してください。"), { unknown: true });
    }
  }
  if (!original || original.status === "cancelled") {
    if (expectedBodies.length && !(await copies()).length) throw Object.assign(Error("元の予定が変更されています。再読み込みして確認してください。"), { status: 412 });
    await verifyCopies(); return;
  }
  if (!editableClosedDay(original) || original.etag !== snapshot.etag || original.start?.date !== snapshot.start || original.end?.date !== snapshot.end || original.summary !== snapshot.title) {
    throw Object.assign(Error("予定が変更されています。再読み込みして確認してください。"), { status: 412 });
  }
  const bodies = retainedBodies(original, dates, operation);
  const retained: CalendarItem[] = [];
  let deleteAttempted = false;
  async function rollbackCopies() {
    for (const found of await copies()) {
      if (bodies.some(body => sameRetained(found, body, operation, original!.id))) await calendar.remove(found.id, found.etag);
    }
  }
  try {
    for (const body of bodies) {
      let found = false;
      for (let generation = 0; generation < 64; generation++) {
        const candidate = { ...body, id: body.id + "g" + generation.toString(16) };
        if ((await calendar.get(candidate.id))?.status === "cancelled") continue;
        retained.push(await ensureInsert(calendar, candidate, event => sameRetained(event, body, operation, original.id)));
        found = true; break;
      }
      if (!found) throw Error("残す予定の履歴を確認する必要があります。担当者へ連絡してください。");
    }
    const latest = await calendar.get(original.id);
    if (!latest || latest.status === "cancelled" || latest.etag !== original.etag) throw Object.assign(Error("予定が変更されています。再読み込みして確認してください。"), { status: 412 });
    deleteAttempted = true;
    await calendar.remove(original.id, original.etag);
    const after = await calendar.get(original.id);
    if (after && after.status !== "cancelled") throw Error("取り消し結果を確認できませんでした。");
    for (const copy of retained) {
      const found = await calendar.get(copy.id);
      if (!found || !sameRetained(found, copy, operation, original.id)) throw Error("残す店休日を確認できませんでした。");
    }
  } catch (error) {
    if (!deleteAttempted || [404, 410, 412].includes(statusOf(error) || 0)) {
      try { await rollbackCopies(); }
      catch { throw Object.assign(Error("元の予定は変更していません。作成したコピーの復旧確認が必要です。担当者へ連絡してください。"), { unknown: true }); }
      if ([404, 410, 412].includes(statusOf(error) || 0)) throw Object.assign(Error("予定が変更されています。再読み込みして確認してください。"), { status: 412 });
      throw Object.assign(error instanceof Error ? error : Error("予定を変更できませんでした。"), { definitive: true });
    }
    // Never remove retained dates unless the original is confirmed to still exist.
    let source: CalendarItem | null;
    try { source = await calendar.get(original.id); }
    catch { throw Object.assign(Error("反映結果を確認中です。同じ変更の結果をもう一度確認してください。"), { unknown: true }); }
    if (!source || source.status === "cancelled") {
      await verifyCopies();
      return;
    }
    // Roll back only the copies made by this operation, with ETags.
    try {
      await rollbackCopies();
    } catch { throw Object.assign(Error("元の店休日は残っています。復旧の確認が必要です。担当者へ連絡してください。"), { unknown: true }); }
    if (source.etag !== original.etag) throw Object.assign(Error("予定が変更されています。再読み込みして確認してください。"), { status: 412 });
    throw Object.assign(error instanceof Error ? error : Error("予定を変更できませんでした。"), { definitive: true });
  }
}
export async function applyClosedDays(calendar: CalendarAccess, calendarId: string, changes: DayChange[], operation: string): Promise<DayResult[]> {
  const results = new Map<string, DayResult>();
  const removals = new Map<string, { snapshot: DayEvent; dates: Set<string> }>();
  for (const change of changes) {
    if (change.action === "remove") for (const event of change.events) {
      const group = removals.get(event.id) || { snapshot: event, dates: new Set<string>() };
      if (group.snapshot.etag !== event.etag) throw Error("同じ予定の内容が一致しません。再読み込みしてください。");
      group.dates.add(change.date); removals.set(event.id, group);
    }
  }
  for (const { snapshot, dates } of removals.values()) {
    try { await removeDays(calendar, snapshot, dates, operation); }
    catch (error) { for (const date of dates) results.set(date, { date, state: statusOf(error) === 412 ? "conflict" : (error as { definitive?: boolean }).definitive ? "failed" : "unknown", message: error instanceof Error ? error.message : "取り消せませんでした。" }); }
  }
  for (const change of changes) {
    if (results.has(change.date)) continue;
    try {
      if (change.action === "add") await addDay(calendar, calendarId, change.date, operation);
      const actual = (await calendar.list(change.date, shiftDay(change.date, 1))).filter(editableClosedDay);
      if ((change.action === "add") !== Boolean(actual.length)) throw Object.assign(Error("店休日の内容が変わっています。再読み込みして確認してください。"), { status: 412 });
      results.set(change.date, { date: change.date, state: "applied" });
    } catch (error) { results.set(change.date, { date: change.date, state: statusOf(error) === 412 ? "conflict" : "unknown", message: error instanceof Error ? error.message : "反映結果を確認できませんでした。" }); }
  }
  // Dates from the same original span must be retried together: keeping their
  // complete removal set is necessary to verify split copies after a lost reply.
  for (let pass = 0; pass < changes.length; pass++) {
    for (const { dates } of removals.values()) {
      const incomplete = [...dates].map(date => results.get(date)!).find(result => result.state !== "applied");
      if (incomplete) for (const date of dates) if (results.get(date)?.state === "applied") results.set(date, { date, state: incomplete.state, message: "同じ連休の変更結果をまとめて再確認してください。" });
    }
  }
  return changes.map(change => results.get(change.date)!);
}
