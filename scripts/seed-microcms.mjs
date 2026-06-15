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
