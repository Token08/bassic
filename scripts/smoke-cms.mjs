import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

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
  }
];

if (!serviceDomain || !apiKey) {
  console.log("microCMS smoke check skipped: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY are not set.");
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
  try {
    const url = new URL(item?.[field]);
    if (url.protocol !== "https:") {
      errors.push(`${endpoint}.${field}: URL must start with https://.`);
    }
  } catch {
    errors.push(`${endpoint}.${field}: valid URL is required.`);
  }
}

function requiredImage(item, field, endpoint) {
  if (!item?.[field]?.url) {
    errors.push(`${endpoint}.${field}: image is required.`);
  }
}
