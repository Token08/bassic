// Compatibility reader for older event records that kept poster metadata here.
const prefix = "bassic-event-v1:";

// The same JSON/text storage used by site settings also stores event drafts.
// External URLs remain data; the CMS never needs to fetch a Facebook poster.
export function packEventRecord(event, { legacyId, removed = false } = {}) {
  const clean = Object.fromEntries(Object.entries(event).filter(([key, value]) =>
    !["id", "createdAt", "updatedAt", "publishedAt", "revisedAt"].includes(key) && !key.startsWith("__") && value !== undefined));
  return { kind: "events", category: "cms", title: String(clean.title || ""), body: JSON.stringify({ bassicEventVersion: 1, event: clean, ...(legacyId ? { legacyId } : {}), ...(removed ? { removed: true } : {}) }) };
}

export function mergeEventRecords(legacy, compact) {
  const migratedIds = new Set(), removedIds = new Set();
  const current = compact.filter(item => item.kind === "events").map(item => {
    let data;
    try { data = JSON.parse(item.body); } catch { throw new Error("保存済みイベントの内容を確認できません。"); }
    if (data?.bassicEventVersion !== 1 || !data.event || typeof data.event !== "object" || Array.isArray(data.event) || typeof item.id !== "string" ||
        (data.legacyId !== undefined && typeof data.legacyId !== "string") || (data.removed !== undefined && typeof data.removed !== "boolean"))
      throw new Error("保存済みイベントの形式を確認できません。");
    if (data.legacyId) migratedIds.add(data.legacyId);
    if (data.removed) removedIds.add(item.id);
    return { ...data.event, id: item.id, ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}) };
  });
  const identities = new Set(current.map(eventIdentity).filter(Boolean));
  const previous = legacy.map(decodeEventFromStorage).filter(item => !migratedIds.has(item.id) && !identities.has(eventIdentity(item)));
  const ids = new Set();
  for (const item of [...current, ...previous]) {
    if (!item || typeof item.id !== "string" || ids.has(item.id)) throw new Error("保存済みイベントのIDが重複しています。");
    ids.add(item.id);
  }
  return [...current, ...previous].filter(item => !removedIds.has(item.id));
}

function eventIdentity(event) {
  try {
    const url = new URL(event.sourceUrl);
    if (["www.facebook.com", "facebook.com", "m.facebook.com", "mbasic.facebook.com"].includes(url.hostname)) {
      const id = /^\/events\/(?:[^/]+\/)?(\d+)(?:\/|$)/.exec(url.pathname)?.[1];
      if (id) return `facebook-${id}`;
    }
  } catch { /* Manual entries can have a source ID without a URL. */ }
  return event.sourceId ? `${event.sourceType === "facebook" ? "facebook" : "source"}-${event.sourceId}` : "";
}

export function decodeEventFromStorage(item) {
  if (!item || typeof item !== "object") return item;
  let result = { ...item };
  if (typeof item.sourceType === "string" && item.sourceType.startsWith(prefix)) {
    try {
      const meta = JSON.parse(item.sourceType.slice(prefix.length));
      if (typeof meta.sourceType === "string" && typeof meta.image?.url === "string") {
        result = { ...result, sourceType: meta.sourceType, image: meta.image };
      }
    } catch { /* Preserve malformed legacy values; never invent poster data. */ }
  }
  if (typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(result.date) && Number.isFinite(Date.parse(result.date))) {
    result.date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", dateStyle: "short" }).format(new Date(result.date));
  }
  return result;
}
