import { loadLocalEnv } from "./load-local-env.mjs";
import { seedData } from "./microcms-seed-data.mjs";

loadLocalEnv();
loadLocalEnv("admin-app/.env.local");

const shouldApply = process.argv.includes("--apply");
const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
const isDummyEnv = !serviceDomain || !apiKey || serviceDomain === "example" || apiKey === "example";

const objectEntries = Object.entries(seedData.objects);
const listEntries = Object.entries(seedData.lists);
const listItemCount = listEntries.reduce((total, [, items]) => total + items.length, 0);
const seedErrors = validateSeedData();

console.log("Bassic. microCMS seed");
console.log(`- object endpoints: ${objectEntries.length}`);
console.log(`- list endpoints: ${listEntries.length}`);
console.log(`- list contents: ${listItemCount}`);

for (const [endpoint, item] of objectEntries) {
  console.log(`  object ${endpoint}: ${Object.keys(item).length} fields`);
}

for (const [endpoint, items] of listEntries) {
  console.log(`  list ${endpoint}: ${items.length} items`);
}

if (seedErrors.length) {
  console.error("\nSeed data check failed:");
  for (const error of seedErrors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("\nSeed data check passed.");

if (!shouldApply) {
  console.log("\nDry run only. To write to microCMS, run: npm run seed:cms -- --apply");
  process.exit(0);
}

if (isDummyEnv) {
  console.error("\nCannot write: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY must be real values, not local dummy values.");
  process.exit(1);
}

const baseUrl = `https://${serviceDomain}.microcms.io/api/v1`;

for (const [endpoint, item] of objectEntries) {
  await patchObject(endpoint, item);
}

for (const [endpoint, items] of listEntries) {
  for (const item of items) {
    await putListItem(endpoint, item.id, stripId(item));
  }
}

console.log("\nDone. Current Bassic. site data has been seeded to microCMS.");

async function patchObject(endpoint, item) {
  const response = await microCmsFetch(`/${endpoint}`, {
    method: "PATCH",
    body: JSON.stringify(item)
  });

  console.log(`OK ${endpoint} object ${response.status}`);
}

async function putListItem(endpoint, id, item) {
  if (!id) {
    throw new Error(`${endpoint}: list seed item is missing id.`);
  }

  const response = await microCmsFetch(`/${endpoint}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(item)
  });

  console.log(`OK ${endpoint}/${id} ${response.status}`);
}

async function microCmsFetch(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": apiKey,
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${path}: ${response.status} ${response.statusText}\n${message}`);
  }

  return response;
}

function stripId(item) {
  const { id, ...content } = item;
  return content;
}

function validateSeedData() {
  const errors = [];

  for (const [endpoint, item] of objectEntries) {
    if (!isPlainObject(item)) {
      errors.push(`${endpoint}: object endpoint seed must be an object.`);
      continue;
    }

    validateNestedUrls(endpoint, item, errors);
  }

  for (const [endpoint, items] of listEntries) {
    if (!Array.isArray(items)) {
      errors.push(`${endpoint}: list endpoint seed must be an array.`);
      continue;
    }

    const seenIds = new Set();
    for (const [index, item] of items.entries()) {
      const label = `${endpoint}[${index}]`;
      if (!isPlainObject(item)) {
        errors.push(`${label}: list item must be an object.`);
        continue;
      }

      if (typeof item.id !== "string" || !item.id.trim()) {
        errors.push(`${label}: id is required.`);
      } else if (seenIds.has(item.id)) {
        errors.push(`${label}: duplicate id ${item.id}.`);
      } else {
        seenIds.add(item.id);
      }

      validateNestedUrls(label, item, errors);
    }
  }

  return errors;
}

function validateNestedUrls(label, value, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNestedUrls(`${label}[${index}]`, item, errors));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedLabel = `${label}.${key}`;
    if (key === "url" || key.endsWith("Url")) {
      if (typeof nestedValue !== "string" || !isSupportedUrl(nestedValue)) {
        errors.push(`${nestedLabel}: URL must start with https:// or /.`);
      }
      continue;
    }

    validateNestedUrls(nestedLabel, nestedValue, errors);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSupportedUrl(value) {
  return value.startsWith("https://") || value.startsWith("/");
}
