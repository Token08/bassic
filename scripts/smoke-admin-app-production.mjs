const adminAppUrl = (process.env.ADMIN_APP_URL || "https://bassic-admin.vercel.app/").replace(/\/+$/, "");
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is required. Example:");
  console.error('  $env:ADMIN_PASSWORD="your-admin-password"; npm run smoke:admin-app');
  process.exit(1);
}

const smokeTitle = `Codex smoke test ${new Date().toISOString()}`;
const smokePayload = {
  page: "home",
  title: smokeTitle,
  body: "Temporary unpublished admin smoke test item. This item is created and deleted by the smoke test.",
  displayOrder: 9999,
  isPublished: false
};

try {
  const cookie = await login();
  const health = await getJson(`${adminAppUrl}/api/health`, { headers: { cookie } });
  assert(health.ok, "health check failed");
  assert(
    Array.isArray(health.missing) && health.missing.length === 0,
    `health check reports missing env: ${(health.missing || []).map((item) => item.key).join(", ")}`
  );

  const created = await postJson(`${adminAppUrl}/api/content/custom-sections`, smokePayload, cookie);
  const createdId = created.data?.id;
  assert(createdId, "custom section create response did not include an id");

  await deleteJson(`${adminAppUrl}/api/content/custom-sections/${encodeURIComponent(createdId)}`, cookie);

  console.log(`Admin app production smoke passed. Created and deleted custom-sections item: ${createdId}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

async function login() {
  const response = await fetch(`${adminAppUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: adminPassword })
  });
  const body = await readApiBody(response);

  assert(response.ok && body.ok, body.message || `login failed with ${response.status}`);

  const setCookie = response.headers.get("set-cookie") || "";
  const sessionCookie = setCookie.split(";")[0];
  assert(sessionCookie.includes("bassic_admin_session="), "login response did not set admin session cookie");

  return sessionCookie;
}

async function getJson(url, init = {}) {
  const response = await fetch(url, init);
  const body = await readApiBody(response);

  assert(response.ok && body.ok, body.message || `${url} failed with ${response.status}`);

  return body;
}

async function postJson(url, payload, cookie) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie
    },
    body: JSON.stringify(payload)
  });
  const body = await readApiBody(response);

  assert(response.ok && body.ok, body.message || `${url} failed with ${response.status}`);

  return body;
}

async function deleteJson(url, cookie) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { cookie }
  });
  const body = await readApiBody(response);

  assert(response.ok && body.ok, body.message || `${url} failed with ${response.status}`);

  return body;
}

async function readApiBody(response) {
  return response.json().catch(async () => ({
    ok: false,
    message: await response.text().catch(() => "")
  }));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
