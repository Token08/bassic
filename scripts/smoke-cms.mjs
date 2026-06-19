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
    orderGroupFields: ["page"],
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "party", "menu", "access"], "hero-slides");
      requiredImage(item, "image", "hero-slides");
      optionalWholeNumber(item, "displayOrder", "hero-slides");
    }
  },
  {
    label: "events",
    path: "/events?limit=1",
    validateItem: (item) => {
      requiredText(item, "title", "events", 4);
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
        optionalFacebookSourceIdMatchesUrl(item, "events");
      }
      optionalImage(item, "image", "events");
    }
  },
  {
    label: "menu",
    path: "/menu?limit=100",
    orderGroupFields: ["category"],
    validateItem: (item) => {
      requiredString(item, "name", "menu");
      if (item.category) {
        requiredEnum(item, "category", ["food", "drink"], "menu");
      }
      optionalWholeNumber(item, "displayOrder", "menu");
      if (item.isPublished !== false) {
        requiredString(item, "price", "menu");
        requiredImage(item, "image", "menu");
      } else if (item.image) {
        optionalImage(item, "image", "menu");
      }
    }
  },
  {
    label: "drink-menu-sheets",
    path: "/drink-menu-sheets?limit=1",
    orderGroupFields: [],
    validateItem: (item) => {
      requiredString(item, "title", "drink-menu-sheets");
      requiredImage(item, "image", "drink-menu-sheets");
      optionalWholeNumber(item, "displayOrder", "drink-menu-sheets");
    }
  },
  {
    label: "party-plans",
    path: "/party-plans?limit=1",
    orderGroupFields: [],
    validateItem: (item) => {
      requiredText(item, "title", "party-plans", 4);
      requiredString(item, "price", "party-plans");
      requiredText(item, "body", "party-plans", 12);
      optionalWholeNumber(item, "displayOrder", "party-plans");
    }
  },
  {
    label: "social-notices",
    path: "/social-notices?limit=1",
    orderGroupFields: ["platform"],
    validateItem: (item) => {
      requiredEnum(item, "platform", ["instagram", "facebook", "x"], "social-notices");
      requiredText(item, "title", "social-notices", 6);
      if (item.isPublished !== false) {
        requiredText(item, "description", "social-notices", 10);
      } else if (item.description) {
        optionalText(item, "description", "social-notices", 10);
      }
      requiredUrl(item, "url", "social-notices");
      requiredSocialNoticeUrl(item, "social-notices");
      requiredBoolean(item, "isPublished", "social-notices");
    }
  },
  {
    label: "page-copy",
    path: "/page-copy?limit=1",
    orderGroupFields: ["page"],
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "page-copy");
      requiredBoolean(item, "isPublished", "page-copy");
      optionalWholeNumber(item, "displayOrder", "page-copy");
    }
  },
  {
    label: "page-sections",
    path: "/page-sections?limit=1",
    orderGroupFields: ["page"],
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "page-sections");
      requiredString(item, "sectionKey", "page-sections");
      requiredBoolean(item, "isPublished", "page-sections");
      optionalWholeNumber(item, "displayOrder", "page-sections");
    }
  },
  {
    label: "custom-sections",
    path: "/custom-sections?limit=1",
    orderGroupFields: ["page"],
    validateItem: (item) => {
      requiredEnum(item, "page", ["home", "events", "menu", "party", "access"], "custom-sections");
      requiredText(item, "title", "custom-sections", 6);
      requiredText(item, "body", "custom-sections", 20);
      requiredBoolean(item, "isPublished", "custom-sections");
      optionalImage(item, "image", "custom-sections");
      optionalUrl(item, "linkUrl", "custom-sections");
      optionalLinkPair(item, "linkLabel", "linkUrl", "custom-sections");
      optionalWholeNumber(item, "displayOrder", "custom-sections");
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
    requiredExternalUrl(home, "instagramWidgetSrc", "home");
  }
  console.log("OK home");

  const siteSettings = await fetchJson("/site-settings");
  for (const field of requiredSiteSettingsFields) {
    if (field.endsWith("Url")) {
      requiredExternalUrl(siteSettings, field, "site-settings");
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

    for (const item of list.contents) {
      check.validateItem(item);
    }
    if (check.orderGroupFields) {
      validateDisplayOrderUniqueness(list.contents, check.label, check.orderGroupFields);
    }

    console.log(`OK ${check.label} (${list.contents.length} checked)`);
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

function requiredText(item, field, endpoint, minLength) {
  const value = typeof item?.[field] === "string" ? item[field].trim() : "";
  if (!value) {
    errors.push(`${endpoint}.${field}: non-empty text is required.`);
    return;
  }

  if (countTextLength(value) < minLength) {
    errors.push(`${endpoint}.${field}: text is too short. Use at least ${minLength} characters for published content.`);
  }
}

function optionalText(item, field, endpoint, minLength) {
  const value = typeof item?.[field] === "string" ? item[field].trim() : "";
  if (!value) {
    return;
  }

  if (countTextLength(value) < minLength) {
    errors.push(`${endpoint}.${field}: text is too short. Use at least ${minLength} characters when this field is set.`);
  }
}

function countTextLength(value) {
  return value.replace(/\s+/g, "").length;
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

function optionalUrl(item, field, endpoint) {
  const value = item?.[field];
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!isValidManagedUrl(value)) {
    errors.push(`${endpoint}.${field}: URL must start with https:// or / when this field is set.`);
  }
}

function requiredExternalUrl(item, field, endpoint) {
  if (!isValidExternalUrl(item?.[field])) {
    errors.push(`${endpoint}.${field}: external URL must start with https://.`);
  }
}

function requiredFacebookEventUrl(item, field, endpoint) {
  const value = item?.[field];
  if (typeof value !== "string" || !getFacebookEventId(value)) {
    errors.push(`${endpoint}.${field}: Facebook events must use a single event URL like https://www.facebook.com/events/1234567890/.`);
  }
}

function optionalFacebookSourceIdMatchesUrl(item, endpoint) {
  const sourceId = typeof item?.sourceId === "string" ? item.sourceId.trim() : "";
  const eventId = getFacebookEventId(item?.sourceUrl);
  if (sourceId && eventId && sourceId !== eventId) {
    errors.push(`${endpoint}.sourceId: Facebook event ID should match the sourceUrl event ID.`);
  }
}

function optionalLinkPair(item, labelField, urlField, endpoint) {
  const label = typeof item?.[labelField] === "string" ? item[labelField].trim() : "";
  const url = typeof item?.[urlField] === "string" ? item[urlField].trim() : "";
  if (label && !url) {
    errors.push(`${endpoint}.${urlField}: URL is required when ${labelField} is set.`);
  }

  if (url && !label) {
    errors.push(`${endpoint}.${labelField}: label is required when ${urlField} is set.`);
  }
}

function requiredSocialNoticeUrl(item, endpoint) {
  const platform = item?.platform;
  const value = item?.url;
  if (typeof value !== "string" || !value.trim()) {
    return;
  }

  let host = "";
  try {
    host = new URL(value).hostname.replace(/^www\./, "");
  } catch {
    errors.push(`${endpoint}.url: social notice URLs must be full https:// URLs.`);
    return;
  }

  if (platform === "instagram" && host !== "instagram.com") {
    errors.push(`${endpoint}.url: Instagram notices must use instagram.com URLs.`);
  }

  if (platform === "facebook" && !["facebook.com", "m.facebook.com", "mbasic.facebook.com", "fb.me"].includes(host)) {
    errors.push(`${endpoint}.url: Facebook notices must use facebook.com URLs.`);
  }

  if (platform === "x" && !["x.com", "twitter.com"].includes(host)) {
    errors.push(`${endpoint}.url: X notices must use x.com or twitter.com URLs.`);
  }
}

function optionalTime(item, field, endpoint) {
  const value = item?.[field];
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (!isValidTimeValue(value)) {
    errors.push(`${endpoint}.${field}: time should be a valid HH:mm value, for example 19:00 or 02:00.`);
  }
}

function isValidTimeValue(value) {
  if (typeof value !== "string") {
    return false;
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function optionalWholeNumber(item, field, endpoint) {
  const value = item?.[field];
  if (value === undefined || value === null || value === "") {
    return;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${endpoint}.${field}: display order should be a whole number like 1, 2, 3.`);
  }
}

function validateDisplayOrderUniqueness(items, endpoint, groupFields) {
  const seen = new Map();

  for (const item of items) {
    if (item?.isPublished === false || item?.displayOrder === undefined || item?.displayOrder === null || item?.displayOrder === "") {
      continue;
    }

    const order = Number(item.displayOrder);
    if (!Number.isInteger(order) || order < 0) {
      continue;
    }

    const group = groupFields.length
      ? groupFields.map((field) => `${field}:${item?.[field] || "未設定"}`).join(" / ")
      : "all";
    const key = `${group}:${order}`;

    if (seen.has(key)) {
      errors.push(`${endpoint}.displayOrder: duplicate display order ${order} in ${group}. Use unique numbers for published items.`);
      continue;
    }

    seen.set(key, true);
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

function isValidExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
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
