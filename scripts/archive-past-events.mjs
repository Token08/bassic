import { mergeEventRecords, packEventRecord } from "../lib/event-storage.mjs";
const compactIds = new Set();
const compactLegacyIds = new Map();
const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
const enabled = process.env.AUTO_ARCHIVE_PAST_EVENTS === "true";
const dryRun = process.env.AUTO_ARCHIVE_PAST_EVENTS_DRY_RUN === "true";

async function main() {
  if (!enabled) {
    console.log("Skipping event archive because AUTO_ARCHIVE_PAST_EVENTS is not true.");
    return;
  }

  if (!serviceDomain || !apiKey) {
    console.log("Skipping event archive because microCMS credentials are not configured.");
    return;
  }

  const threshold = getStartOfPreviousMonth();

  const events = await fetchEvents();
  const targets = events.filter((event) => event.isPublished !== false && isBeforeThreshold(event.date, threshold));

  if (!targets.length) {
    console.log("No past events to archive.");
    return;
  }

  for (const event of targets) {
    const label = event.title || event.id;
    if (dryRun) {
      console.log(`[dry-run] archive ${label} (${event.date})`);
      continue;
    }

    await patchEvent(event, { isPublished: false });
    console.log(`Archived ${label} (${event.date})`);
  }
}

async function fetchEvents() {
  async function readAll(endpoint) {
    const items = [], ids = new Set();
    for (let offset = 0; ; offset += 100) {
      const data = await microCmsRequest(`/${endpoint}?limit=100&offset=${offset}`);
      if (!Array.isArray(data.contents)) throw new Error("Invalid CMS list; no archive writes performed");
      for (const item of data.contents) {
        if (!item || typeof item.id !== "string" || ids.has(item.id)) throw new Error("Invalid CMS pagination; no archive writes performed");
        ids.add(item.id);
      }
      items.push(...data.contents);
      if (data.contents.length < 100 || items.length >= data.totalCount) return items;
    }
  }
  const legacy = await readAll("events"), compact = await readAll("menu");
  for (const item of compact.filter(item => item.kind === "events")) { compactIds.add(item.id); compactLegacyIds.set(item.id, JSON.parse(item.body).legacyId); }
  return mergeEventRecords(legacy, compact);
}

function isBeforeThreshold(value, threshold) {
  if (!value) {
    return false;
  }

  const eventDate = new Date(`${String(value).slice(0, 10)}T00:00:00+09:00`);
  return !Number.isNaN(eventDate.getTime()) && eventDate < threshold;
}

function getStartOfPreviousMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

async function patchEvent(event, patch) {
  const { id } = event;
  if (!id) {
    return;
  }

  await microCmsRequest(`/${compactIds.has(id) ? "menu" : "events"}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(compactIds.has(id) ? packEventRecord({ ...event, ...patch }, { legacyId: compactLegacyIds.get(id) }) : patch)
  });
}

async function microCmsRequest(path, init = {}) {
  const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": apiKey,
      ...(init.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body.message || text || `microCMS request failed: ${response.status}`);
  }

  return body;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
