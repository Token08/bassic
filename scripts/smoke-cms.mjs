import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();
loadLocalEnv("admin-app/.env.local");

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

const requiredHomeFields = ["heroTitle", "heroLead", "firstVisitLead", "accessNote"];
const requiredSiteSettingsFields = [
  "address",
  "phone",
  "hoursLabel",
  "smokingLabel",
  "chargeLabel",
  "googleMapsUrl",
  "instagramUrl",
  "facebookUrl",
  "xUrl"
];
const endpointChecks = [
  {
    label: "hero-slides",
    path: "/hero-slides?limit=1",
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "party", "menu", "access"], "hero-slides");
      requiredImage(item, "image", "hero-slides");
    }
  },
  {
    label: "events",
    path: "/events?limit=1",
    validateItem: (item) => {
      requiredString(item, "title", "events");
      requiredString(item, "date", "events");
      requiredBoolean(item, "isPublished", "events");
      optionalTime(item, "openTime", "events");
      optionalTime(item, "startTime", "events");
      optionalTime(item, "endTime", "events");
      if (item.sourceUrl) {
        requiredUrl(item, "sourceUrl", "events");
      }
      if (item.sourceId) {
        requiredString(item, "sourceId", "events");
      }
      if (item.sourceType) {
        requiredEnum(item, "sourceType", ["facebook", "facebook_ical", "google_calendar"], "events");
      }
      if (item.sourceType === "facebook") {
        requiredFacebookEventUrl(item, "sourceUrl", "events");
      }
      optionalImage(item, "image", "events");
    }
  },
  {
    label: "menu",
    path: "/menu?limit=1",
    validateItem: (item) => {
      requiredString(item, "name", "menu");
      requiredEnum(item, "category", ["food", "drink"], "menu");
    }
  },
  {
    label: "drink-menu-sheets",
    path: "/drink-menu-sheets?limit=1",
    validateItem: (item) => {
      requiredString(item, "title", "drink-menu-sheets");
      requiredImage(item, "image", "drink-menu-sheets");
    }
  },
  {
    label: "party-plans",
    path: "/party-plans?limit=1",
    validateItem: (item) => {
      requiredString(item, "title", "party-plans");
      requiredString(item, "price", "party-plans");
      requiredString(item, "body", "party-plans");
    }
  },
  {
    label: "social-notices",
    path: "/social-notices?limit=1",
    validateItem: (item) => {
      requiredEnum(item, "platform", ["instagram", "facebook", "x"], "social-notices");
      requiredString(item, "title", "social-notices");
      requiredUrl(item, "url", "social-notices");
      requiredBoolean(item, "isPublished", "social-notices");
    }
  },
  {
    label: "page-copy",
    path: "/page-copy?limit=1",
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "page-copy");
      requiredBoolean(item, "isPublished", "page-copy");
    }
  },
  {
    label: "page-sections",
    path: "/page-sections?limit=1",
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "page-sections");
      requiredString(item, "sectionKey", "page-sections");
      requiredBoolean(item, "isPublished", "page-sections");
    }
  },
  {
    label: "custom-sections",
    path: "/custom-sections?limit=1",
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "custom-sections");
      requiredString(item, "title", "custom-sections");
      requiredString(item, "body", "custom-sections");
      requiredBoolean(item, "isPublished", "custom-sections");
    }
  }
];

if (!serviceDomain || !apiKey || serviceDomain === "example" || apiKey === "example") {
  console.log("microCMS smoke check skipped: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY are not set or are local dummy values.");
  process.exit(0);
}

const baseUrl = `https://${serviceDomain}.microcms.io/api/v1`;
const errors = [];

try {
  const home = await fetchJson("/home");
  for (const field of requiredHomeFields) {
    requiredString(home, field, "home");
  }
  if (home.instagramWidgetSrc) {
    requiredUrl(home, "instagramWidgetSrc", "home");
  }
  console.log("OK home");

  const siteSettings = await fetchJson("/site-settings");
  for (const field of requiredSiteSettingsFields) {
    if (field.endsWith("Url")) {
      requiredUrl(siteSettings, field, "site-settings");
    } else {
      requiredString(siteSettings, field, "site-settings");
    }
  }
  console.log("OK site-settings");

  const equipmentRental = await fetchJson("/equipment-rental");
  requiredString(equipmentRental, "title", "equipment-rental");
  requiredString(equipmentRental, "body", "equipment-rental");
  if (equipmentRental.pdfUrl) {
    requiredUrl(equipmentRental, "pdfUrl", "equipment-rental");
  }
  console.log("OK equipment-rental");

  for (const check of endpointChecks) {
    const list = await fetchJson(check.path);
    if (!Array.isArray(list.contents)) {
      errors.push(`${check.label}: response.contents must be an array.`);
      continue;
    }

    if (list.contents[0]) {
      check.validateItem(list.contents[0]);
    }

    console.log(`OK ${check.label} (${list.contents.length} sampled)`);
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length) {
  console.error("microCMS smoke check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("microCMS smoke check passed.");

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "X-MICROCMS-API-KEY": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function requiredString(item, field, endpoint) {
  if (typeof item?.[field] !== "string" || !item[field].trim()) {
    errors.push(`${endpoint}.${field}: non-empty text is required.`);
  }
}

function requiredBoolean(item, field, endpoint) {
  if (typeof item?.[field] !== "boolean") {
    errors.push(`${endpoint}.${field}: boolean is required.`);
  }
}

function requiredEnum(item, field, values, endpoint) {
  if (!values.includes(item?.[field])) {
    errors.push(`${endpoint}.${field}: must be one of ${values.join(", ")}.`);
  }
}

function requiredUrl(item, field, endpoint) {
  if (!isValidManagedUrl(item?.[field])) {
    errors.push(`${endpoint}.${field}: URL must start with https:// or /.`);
  }
}

function requiredFacebookEventUrl(item, field, endpoint) {
  const value = item?.[field];
  if (typeof value !== "string" || !getFacebookEventId(value)) {
    errors.push(`${endpoint}.${field}: Facebook events must use a single event URL like https://www.facebook.com/events/1234567890/.`);
  }
}

function optionalTime(item, field, endpoint) {
  const value = item?.[field];
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (typeof value !== "string" || !/(\d{1,2})[:時](\d{2})?/.test(value)) {
    errors.push(`${endpoint}.${field}: time should include HH:mm, for example 19:00.`);
  }
}

function requiredImage(item, field, endpoint) {
  if (!item?.[field]?.url) {
    errors.push(`${endpoint}.${field}: image is required.`);
    return;
  }

  if (!isValidManagedUrl(item[field].url)) {
    errors.push(`${endpoint}.${field}.url: URL must start with https:// or /.`);
  }
}

function optionalImage(item, field, endpoint) {
  if (!item?.[field]) {
    return;
  }

  if (!item[field]?.url) {
    errors.push(`${endpoint}.${field}: image URL is missing.`);
    return;
  }

  if (!isValidManagedUrl(item[field].url)) {
    errors.push(`${endpoint}.${field}.url: URL must start with https:// or /.`);
  }
}

function isValidManagedUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFacebookEventId(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "facebook.com" && host !== "m.facebook.com" && host !== "mbasic.facebook.com" && host !== "fb.me") {
      return "";
    }

    const eventsPath = url.pathname.match(/\/events\/(.+)/)?.[1] || "";
    if (!eventsPath) {
      return "";
    }

    return [...eventsPath
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)]
      .reverse()
      .find((part) => /^\d{6,}$/.test(part)) || "";
  } catch {
    return "";
  }
}
