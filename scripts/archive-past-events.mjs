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

    await patchEvent(event.id, { isPublished: false });
    console.log(`Archived ${label} (${event.date})`);
  }
}

async function fetchEvents() {
  const params = new URLSearchParams({
    limit: "100",
    orders: "-date"
  });
  const data = await microCmsRequest(`/events?${params.toString()}`);
  return data.contents || [];
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

async function patchEvent(id, patch) {
  if (!id) {
    return;
  }

  await microCmsRequest(`/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
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
