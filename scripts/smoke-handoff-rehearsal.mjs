import { readFile } from "node:fs/promises";

const adminAppUrl = (process.env.ADMIN_APP_URL || "https://bassic-admin.vercel.app/").replace(/\/+$/, "");
const adminPassword = process.env.ADMIN_PASSWORD;
const shouldTriggerDeploy = process.env.RUN_PUBLIC_DEPLOY_REHEARSAL === "true";
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const sourceEventId = "9876543210987654";
const sourceEventUrl = `https://www.facebook.com/events/${sourceEventId}/`;
const eventTitle = `Handoff Rehearsal Event ${runId}`;
const createdItems = [];

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is required. Example:");
  console.error('  $env:ADMIN_PASSWORD="your-admin-password"; npm run smoke:handoff-rehearsal');
  process.exit(1);
}

try {
  const cookie = await login();
  await checkHealth(cookie);
  await rehearseTopSave(cookie);
  await rehearseFacebookUrlValidation(cookie);
  await rehearseEventDraft(cookie);
  await rehearseMenuDraft(cookie);
  const reusableImage = await getReusableImage(cookie);
  await rehearseHeroImageDraft(cookie, reusableImage);
  await rehearseSocialDrafts(cookie);

  if (shouldTriggerDeploy) {
    await cleanup();
    await postJson(`${adminAppUrl}/api/deploy`, {}, cookie);
    console.log("OK public deploy request accepted");
  } else {
    console.log("SKIP public deploy request. Set RUN_PUBLIC_DEPLOY_REHEARSAL=true to test publish trigger.");
  }

  console.log("Handoff operation rehearsal passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await cleanup().catch((error) => {
    console.error(`Cleanup failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  });
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

async function checkHealth(cookie) {
  const health = await getJson(`${adminAppUrl}/api/health`, cookie);
  assert(health.ok, "health check failed");
  assert(
    Array.isArray(health.missing) && health.missing.length === 0,
    `health check reports missing env: ${(health.missing || []).map((item) => item.key).join(", ")}`
  );
  console.log("OK admin health");
}

async function rehearseTopSave(cookie) {
  const home = await getContent("home", cookie);
  assert(typeof home?.heroTitle === "string", "home content did not include heroTitle");
  await postJson(`${adminAppUrl}/api/content/home`, home, cookie);
  console.log("OK TOP object save");
}

async function rehearseFacebookUrlValidation(cookie) {
  const response = await fetch(`${adminAppUrl}/api/facebook-event-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie
    },
    body: JSON.stringify({ url: "https://www.facebook.com/bar.Bassic/" })
  });
  const body = await readApiBody(response);
  assert(response.status === 400 && body.message, "invalid Facebook event URL was not rejected");
  console.log("OK Facebook event URL validation");
}

async function rehearseEventDraft(cookie) {
  const event = await createContent(
    "events",
    {
      title: `Handoff Rehearsal Event ${runId}`,
      date: "2026-08-01",
      openTime: "18:30",
      startTime: "19:00",
      endTime: "21:00",
      performers: "Handoff rehearsal performer",
      price: "確認用",
      reservation: "確認用。公開しないテストです。",
      sourceUrl: sourceEventUrl,
      sourceId: sourceEventId,
      sourceType: "facebook",
      isPublished: false
    },
    cookie
  );
  track("events", event.id);
  console.log("OK EVENT draft create");
}

async function rehearseMenuDraft(cookie) {
  const menu = await createContent(
    "menu",
    {
      name: `Handoff Rehearsal Menu ${runId}`,
      englishName: "Handoff Rehearsal Menu",
      category: "food",
      price: "確認用",
      description: "公開しない納品前リハーサル用のメニューです。",
      displayOrder: 9999,
      isPublished: false
    },
    cookie
  );
  track("menu", menu.id);
  console.log("OK MENU draft create");
}

async function getReusableImage(cookie) {
  const heroSlides = await getContent("hero-slides", cookie);
  const heroImage = (heroSlides.contents || [])
    .map((item) => item.image)
    .find((image) => typeof image?.url === "string" && image.url.startsWith("http"));

  if (heroImage) {
    return heroImage;
  }

  const drinkSheets = await getContent("drink-menu-sheets", cookie);
  const drinkImage = (drinkSheets.contents || [])
    .map((item) => item.image)
    .find((image) => typeof image?.url === "string" && image.url.startsWith("http"));

  if (drinkImage) {
    return drinkImage;
  }

  const uploaded = await uploadRehearsalImage(cookie);
  assert(uploaded?.url, "image upload did not return a URL for image rehearsal");
  return uploaded;
}

async function rehearseHeroImageDraft(cookie, reusableImage) {
  const slide = await createContent(
    "hero-slides",
    {
      page: "home",
      title: `Handoff Rehearsal Image ${runId}`,
      image: reusableImage.url,
      displayOrder: 9999,
      isPublished: false
    },
    cookie
  );
  track("hero-slides", slide.id);
  await patchContent("hero-slides", slide.id, { displayOrder: 9998 }, cookie);
  console.log("OK image draft create and reorder");
}

async function rehearseSocialDrafts(cookie) {
  const event = {
    title: eventTitle,
    date: "2026-08-01",
    startTime: "19:00",
    endTime: "21:00",
    performers: "Handoff rehearsal performer",
    reservation: "確認用。公開しないテストです。",
    sourceUrl: sourceEventUrl,
    sourceId: sourceEventId,
    sourceType: "facebook",
    isPublished: false
  };

  const first = await postJson(
    `${adminAppUrl}/api/event-publish-flow`,
    { event, platforms: ["instagram", "x"], allowDraftCreation: true },
    cookie
  );
  assert(arrayIncludesAll(first.data?.created, ["instagram", "x"]), "SNS drafts were not created for Instagram and X");

  const second = await postJson(
    `${adminAppUrl}/api/event-publish-flow`,
    { event, platforms: ["instagram", "x"], allowDraftCreation: true },
    cookie
  );
  assert(arrayIncludesAll(second.data?.skipped, ["instagram", "x"]), "duplicate SNS drafts were not skipped");

  const notices = await getContent("social-notices", cookie);
  for (const notice of notices.contents || []) {
    if ((notice.sourceEventId === sourceEventId || notice.sourceEventTitle === eventTitle) && notice.id) {
      track("social-notices", notice.id);
    }
  }
  console.log("OK SNS draft create and duplicate skip");
}

async function getContent(endpoint, cookie) {
  const body = await getJson(`${adminAppUrl}/api/content/${endpoint}`, cookie);
  return body.data;
}

async function createContent(endpoint, payload, cookie) {
  const body = await postJson(`${adminAppUrl}/api/content/${endpoint}`, payload, cookie);
  assert(body.data?.id, `${endpoint} create response did not include an id`);
  return body.data;
}

async function patchContent(endpoint, id, payload, cookie) {
  const body = await fetchJson(`${adminAppUrl}/api/content/${endpoint}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie
    },
    body: JSON.stringify(payload)
  });
  assert(body.ok, body.message || `${endpoint}/${id} patch failed`);
  return body.data;
}

async function getJson(url, cookie) {
  return fetchJson(url, { headers: { cookie } });
}

async function postJson(url, payload, cookie) {
  return fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie
    },
    body: JSON.stringify(payload)
  });
}

async function uploadRehearsalImage(cookie) {
  const image = await readFile("public/assets/brand/top-slides/hero-01.jpg");
  const formData = new FormData();
  formData.set("file", new Blob([image], { type: "image/jpeg" }), `handoff-rehearsal-${runId}.jpg`);
  const body = await fetchJson(`${adminAppUrl}/api/media`, {
    method: "POST",
    headers: { cookie },
    body: formData
  });
  console.log(`OK image upload ${body.data?.url || ""}`.trim());
  return body.data;
}

async function deleteContent(endpoint, id, cookie) {
  const body = await fetchJson(`${adminAppUrl}/api/content/${endpoint}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { cookie }
  });
  assert(body.ok, body.message || `${endpoint}/${id} delete failed`);
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init);
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

function track(endpoint, id) {
  if (id) {
    createdItems.push({ endpoint, id });
  }
}

async function cleanup() {
  if (!createdItems.length || !adminPassword) {
    return;
  }

  const cookie = await login();
  const items = createdItems.splice(0, createdItems.length).reverse();
  for (const item of items) {
    await deleteContent(item.endpoint, item.id, cookie);
    console.log(`OK cleanup ${item.endpoint}/${item.id}`);
  }
}

function arrayIncludesAll(value, expected) {
  return Array.isArray(value) && expected.every((item) => value.includes(item));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
