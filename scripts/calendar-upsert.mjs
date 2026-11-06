import { createHash } from "node:crypto";

export async function upsertCalendarEvents({ calendar, calendarId, syncTag, entries }) {
  const existing = [];
  let pageToken;
  do {
    const { data } = await calendar.events.list({
      calendarId, privateExtendedProperty: `syncTag=${syncTag}`,
      maxResults: 2500, showDeleted: false, singleEvents: false, pageToken
    });
    if (!data || (data.items !== undefined && !Array.isArray(data.items))) {
      throw new Error("同期済み予定の一覧が不正なため、カレンダーを変更していません。");
    }
    existing.push(...(data.items || []).filter(item => item.extendedProperties?.private?.syncTag === syncTag));
    pageToken = data.nextPageToken;
  } while (pageToken);

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
      if (props?.syncTag !== syncTag || props?.syncKey !== entry.key || found.status === "cancelled") throw error;
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
