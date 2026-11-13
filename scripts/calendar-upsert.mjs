import { createHash } from "node:crypto";

export async function upsertCalendarEvents({ calendar, calendarId, syncTag, entries }) {
  if (!entries.length) return { inserted: 0, updated: 0, unchanged: 0 };
  const all = [];
  const existing = [];
  const pages = new Set();
  let pageToken;
  do {
    if (pages.has(pageToken)) throw new Error("カレンダー一覧のページが重複したため、変更していません。");
    pages.add(pageToken);
    const { data } = await calendar.events.list({
      calendarId,
      maxResults: 2500, showDeleted: false, singleEvents: false, pageToken
    });
    if (!data || (data.items !== undefined && !Array.isArray(data.items))) {
      throw new Error("同期済み予定の一覧が不正なため、カレンダーを変更していません。");
    }
    if (data.items?.some(item => !item || typeof item.id !== "string" || !item.id))
      throw new Error("予定のIDを確認できないため、カレンダーを変更していません。");
    all.push(...(data.items || []).filter(item => item.status !== "cancelled"));
    if (all.length > 20000) throw new Error("カレンダーの件数が多いため、変更前に担当者の確認が必要です。");
    pageToken = data.nextPageToken;
  } while (pageToken);
  existing.push(...all.filter(item => item.extendedProperties?.private?.syncTag === syncTag));

  // Resolve all identities before making any writes. Never guess among duplicates.
  const planned = entries.map(entry => {
    const matches = existing.filter(item => {
      const props = item.extendedProperties.private;
      return props.syncKey === entry.key || (!props.syncKey && props.sourceId === entry.sourceId);
    });
    if (matches.length > 1) throw new Error(`同期済み予定が重複しています。変更前に確認してください: ${entry.body.summary}`);
    const id = createHash("sha256").update(JSON.stringify([calendarId, syncTag, entry.key])).digest("hex");
    return { ...entry, id, existing: matches[0] };
  });

  // The shop may already have entered this Facebook event by hand. Do not
  // create a second copy or silently take ownership of the existing event.
  for (const entry of planned) {
    const facebookId = /^facebook-(\d+)$/.exec(entry.key)?.[1];
    const sameTitle = value => String(value || "").replace(/\s+/g, " ").trim() === String(entry.body.summary || "").replace(/\s+/g, " ").trim();
    const conflict = all.find(item => item.id !== entry.existing?.id && (
      (facebookId && new RegExp(`facebook\\.com/events/(?:[^/\\s]+/)?${facebookId}(?:[/\\s?"'<]|$)`, "i").test(`${item.source?.url || ""} ${item.description || ""}`)) ||
      (sameTitle(item.summary) && sameStart(item.start, entry.body.start))
    ));
    if (conflict) throw new Error(`手動登録済み、または別の予定と重複する可能性があります。変更していません: ${entry.body.summary}`);
  }

  const result = { inserted: 0, updated: 0, unchanged: 0 };
  for (const entry of planned) {
    const body = {
      ...entry.body,
      extendedProperties: {
        ...entry.body.extendedProperties,
        private: { ...entry.body.extendedProperties?.private, syncTag, syncKey: entry.key }
      }
    };
    if (entry.existing) {
      if (matches(entry.existing, body)) result.unchanged++;
      else { await patch(entry.existing, body); result.updated++; }
      continue;
    }
    try {
      await calendar.events.insert({ calendarId, requestBody: { ...body, id: entry.id } });
      result.inserted++;
    } catch (error) {
      if (Number(error.code || error.response?.status) !== 409) throw error;
      // A previous request may have succeeded before its response was lost.
      const { data: found } = await calendar.events.get({ calendarId, eventId: entry.id });
      const props = found.extendedProperties?.private;
      if (props?.syncTag !== syncTag || props?.syncKey !== entry.key) throw error;
      if (found.status === "cancelled") {
        // A fresh staff save can intentionally republish a deleted managed event.
        // Scheduled runs with an older source must never undo a manual cancellation.
        const savedAt = Date.parse(entry.sourceUpdatedAt), cancelledAt = Date.parse(found.updated);
        if (!Number.isFinite(savedAt) || !Number.isFinite(cancelledAt) || savedAt <= cancelledAt || found.recurringEventId || found.recurrence) throw error;
        await patch(found, { ...body, status: "confirmed" }); result.updated++; continue;
      }
      if (matches(found, body)) result.unchanged++;
      else { await patch(found, body); result.updated++; }
    }
  }
  return result;

  async function patch(found, body) {
    await calendar.events.patch({
      calendarId, eventId: found.id,
      requestBody: {
        ...body,
        extendedProperties: {
          ...found.extendedProperties, ...body.extendedProperties,
          private: { ...found.extendedProperties?.private, ...body.extendedProperties.private }
        }
      }
    });
  }
}

function sameStart(actual, desired) {
  if (!actual || !desired) return false;
  if (actual.date || desired.date) return (actual.date || actual.dateTime?.slice(0, 10)) === (desired.date || desired.dateTime?.slice(0, 10));
  const instant = value => {
    if (!value.dateTime) return NaN;
    const offset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value.dateTime) ? "" : value.timeZone === "UTC" ? "Z" : "+09:00";
    return Date.parse(value.dateTime + offset);
  };
  return Number.isFinite(instant(actual)) && instant(actual) === instant(desired);
}

function matches(found, wanted) {
  return Object.entries(wanted).every(([key, value]) => {
    const actual = found?.[key];
    if ((key === "start" || key === "end") && value?.dateTime && actual?.dateTime && value.timeZone === actual.timeZone) {
      // Google returns the explicit offset for the named zone; our input is local wall time.
      return actual.dateTime.slice(0, 19) === value.dateTime.slice(0, 19);
    }
    return value && typeof value === "object" ? matches(actual, value) : actual === value;
  });
}
