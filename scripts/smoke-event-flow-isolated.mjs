// Run npm run build:admin-app first. All provider responses stay in memory.
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { packEventRecord, mergeEventRecords } from "../lib/event-storage.mjs";
import { decodeSocialNoticeRecord } from "../lib/social-notice-storage.mjs";

const require = createRequire(new URL("../admin-app/package.json", import.meta.url));
const next = require("next");
const adminDir = fileURLToPath(new URL("../admin-app/", import.meta.url));
const password = "isolated-event-flow-fixture";
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
Object.assign(process.env, {
  ADMIN_PASSWORD: password,
  ADMIN_SESSION_SECRET: password,
  MICROCMS_SERVICE_DOMAIN: "bassic-fixture",
  MICROCMS_API_KEY: password,
  GITHUB_OWNER: "fixture",
  GITHUB_REPO: "fixture",
  GITHUB_DISPATCH_TOKEN: password,
  GOOGLE_CALENDAR_ID: "isolated-calendar",
  GOOGLE_CALENDAR_SYNC_ENABLED: "false",
  GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON: JSON.stringify({
    client_email: "fixture@example.invalid",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" })
  }),
  GOOGLE_CALENDAR_SYNC_TAG: "bassic-facebook-sync"
});

const legacyUrl = "https://www.facebook.com/events/12345678/";
const newUrl = "https://www.facebook.com/events/87654321/";
const guidedUrl = "https://www.facebook.com/events/77777777/";
const bassicArchiveUrl = "https://www.facebook.com/events/5208864859197487/";
const image = { url: "https://images.example.invalid/poster.png" };
const events = new Map([["legacy", { id: "legacy", title: "Earlier title", sourceUrl: legacyUrl, image, isPublished: true }]]);
const notices = new Map();
const readNotices = () => [...notices.values()].filter(item => item.kind === "social-notices").map(decodeSocialNoticeRecord).filter(item => !item.__removed);
const compactEvents = new Map();
let nextMenuId = 1;
function changeEvent(id, patch) {
  const item = mergeEventRecords([...events.values()], [...compactEvents.values()]).find(item => item.id === id);
  assert.ok(item);
  if (compactEvents.has(id)) compactEvents.set(id, { ...packEventRecord({ ...item, ...patch }), id });
  else events.set(id, { ...item, ...patch });
}
const slides = new Map();
let calendarItems = [];
let calendarUnavailable = false;
let socialUnavailable = false;
let loseSocialWriteResponse = false;
let cmsReadMode = "ok";
let publishRequests = 0;
let calendarRequests = 0;
let lastPublishId = "";
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  if (url.hostname === "127.0.0.1") return realFetch(input, init);

  if (url.hostname === "www.bassic.jp") {
    const markup = url.pathname === "/events/"
      ? '<section class="event-calendar-section"><h2>Googleカレンダー</h2><iframe title="calendar fixture" src="https://calendar.google.com/calendar/embed?src=fixture"></iframe></section>'
      : '<header class="site-header">Bassic.</header><section class="page-hero" style="min-height:900px">Hero</section><section class="intro"><h2>初めての方へ</h2></section>';
    return new Response("<!doctype html><html><body>" + markup + "</body></html>", { headers: { "Content-Type": "text/html" } });
  }

  if (url.hostname === "www.facebook.com") {
    if (url.href === bassicArchiveUrl && process.env.BASSIC_QA_FACEBOOK_READ === "1") return realFetch(input, init);
    if (url.href === newUrl) return new Response("Unavailable", { status: 503 });
    const event = {
      "@type": "Event",
      url: url.href,
      name: url.href === guidedUrl ? "Guided live" : "Fixture live",
      startDate: url.href === guidedUrl ? "2027-07-07" : "2027-05-04T19:30:00-07:00",
      ...(url.href === guidedUrl ? { image: image.url } : {}),
      description: url.href === guidedUrl ? "18:00 OPEN" : "18:00 OPEN / 19:00 START"
    };
    return new Response(`<script type="application/ld+json">${JSON.stringify(event)}</script>`);
  }

  if (url.hostname === "bassic-fixture.microcms.io") {
    const [endpoint, id] = url.pathname.split("/").slice(3);
    if (endpoint === "menu" && socialUnavailable) return new Response(null, { status: 503 });
    let collection = endpoint === "events" ? events : endpoint === "menu" ? notices : endpoint === "hero-slides" ? slides : null;
    assert.ok(collection, "Unexpected fixture CMS endpoint");
    if (method === "GET") {
      if (cmsReadMode === "unavailable") return new Response(null, { status: 503 });
      if (cmsReadMode === "malformed") return Response.json({ contents: "invalid" });
      if (endpoint === "menu") collection = new Map([...notices, ...compactEvents]);
      if (id) return Response.json(collection.get(id));
      const offset = cmsReadMode === "repeat" ? 0 : Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 100);
      return Response.json({ contents: [...collection.values()].slice(offset, offset + limit), totalCount: collection.size });
    }
    const body = init?.body ?? await input.text();
    const storedPayload = JSON.parse(body);
    if (storedPayload.kind === "social-notices" && (!storedPayload.body?.includes("bassicSocialNoticeVersion") || storedPayload.image !== undefined))
      return Response.json({ message: "Unsupported raw SNS field format" }, { status: 400 });
    if (endpoint === "menu" && (storedPayload.kind === "events" || compactEvents.has(id))) collection = compactEvents;
    if (endpoint === "events") return Response.json({ message: "Legacy event writes timed out" }, { status: 504 });
    if (endpoint === "events" && ((storedPayload.image !== undefined && storedPayload.image !== null && (typeof storedPayload.image !== "string" || !storedPayload.image.startsWith("https://images.microcms-assets.io/"))) || (storedPayload.date !== undefined && !/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(storedPayload.date)))) {
      return Response.json({ message: "Invalid microCMS image or date write format" }, { status: 400 });
    }
    if (method === "POST") {
      assert.equal(id, undefined);
      const generatedId = endpoint === "menu" ? `fixture-menu-${nextMenuId++}` : `fixture-${endpoint}-${collection.size + 1}`;
      collection.set(generatedId, { ...JSON.parse(body), id: generatedId });
      if (endpoint === "menu" && storedPayload.kind !== "events" && loseSocialWriteResponse) {
        loseSocialWriteResponse = false;
        return new Response("Response lost after write", { status: 503 });
      }
      return Response.json({ id: generatedId });
    }
    assert.equal(method, "PATCH");
    assert.ok(collection.has(id));
    collection.set(id, { ...collection.get(id), ...JSON.parse(body), id });
    return Response.json({ id });
  }

  if (url.hostname === "api.github.com") {
    if (url.pathname === "/repos/fixture/fixture/dispatches") {
      assert.equal(method, "POST");
      const dispatch = JSON.parse(init?.body ?? await input.text());
      if (dispatch.event_type === "bassic_calendar_sync") calendarRequests += 1;
      else { lastPublishId = dispatch.client_payload.requestId; publishRequests += 1; }
      return new Response(null, { status: 204 });
    }
    assert.equal(method, "GET");
    if (url.pathname === "/repos/fixture/fixture/actions/workflows/deploy-pages.yml/runs") {
      return Response.json({ workflow_runs: [{ id: 123, display_title: "Bassic publish " + lastPublishId, status: "completed", conclusion: "success" }] });
    }
    assert.equal(url.pathname, "/repos/fixture/fixture/actions/runs/123/jobs");
    return Response.json({ jobs: [{ name: "publish-lolipop-release", steps: [{ name: "Confirm release served by the production site", conclusion: "success" }] }] });
  }
  if (url.hostname === "oauth2.googleapis.com") return Response.json({ access_token: "fixture" });
  if (url.hostname === "www.googleapis.com") {
    assert.equal(method, "GET");
    if (calendarUnavailable) return new Response("Calendar unavailable", { status: 503 });
    assert.ok(["syncKey=facebook-87654321", "syncKey=facebook-77777777"].includes(url.searchParams.get("privateExtendedProperty")));
    return Response.json({ items: calendarItems });
  }
  throw new Error(`Unexpected external request to ${url.hostname}`);
};

const app = next({ dev: false, dir: adminDir, hostname: "127.0.0.1" });
const server = createServer(app.getRequestHandler());
try {
  await app.prepare();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "";
  async function post(path, body, status = 200, method = "POST") {
    const response = await realFetch(base + "/api/" + path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.status, status, `${path}: ${JSON.stringify(result)}`);
    return { result, response };
  }

  await post("facebook-event-preview", { url: legacyUrl }, 401);
  await post("calendar-status", {}, 401);
  assert.equal((await realFetch(base + "/api/calendar-status")).status, 401);
  await post("calendar-sync", { eventId: "legacy" }, 401);
  await post("event-publish-flow", {}, 401);
  const login = await post("login", { password });
  cookie = login.response.headers.get("set-cookie").split(";")[0];

  async function get(path, status = 200) {
    const response = await realFetch(base + "/api/" + path, { headers: { Cookie: cookie } });
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result.data;
  }
  for (const mode of ["unavailable", "malformed"]) {
    cmsReadMode = mode;
    await get("content/events", 502);
    await get("content/home", 502);
  }
  cmsReadMode = "ok";
  const standardLinksStatus = await get("ops-status");
  assert.ok(!standardLinksStatus.alerts.some((alert) => alert.id === "site-social-links"), "Public standard SNS links must not be reported as missing");
  for (let index = 0; index < 105; index++) {
    events.set(`pagination-${index}`, { id: `pagination-${index}`, title: `Page test ${index}`, date: "2027-06-01" });
    notices.set(`pagination-${index}`, { id: `pagination-${index}`, kind: "menu", title: `Menu test ${index}` });
  }
  notices.set("pagination-home", { id: "pagination-home", kind: "home", body: JSON.stringify({ heroTitle: "Stored beyond the first page" }) });
  assert.equal((await get("content/events")).contents.length, 106);
  assert.equal((await get("content/home")).heroTitle, "Stored beyond the first page");
  cmsReadMode = "repeat";
  await get("content/events", 502);
  await get("content/home", 502);
  cmsReadMode = "ok";
  notices.get("pagination-home").body = "invalid JSON";
  await get("content/home", 502);
  for (const collection of [events, notices]) for (const id of collection.keys()) if (id.startsWith("pagination-")) collection.delete(id);
  console.log("CMS read safety passed: errors and malformed data stop editing; events and settings beyond 100 records are loaded.");

  const preview = (await post("facebook-event-preview", { url: legacyUrl })).result.data;
  assert.deepEqual([preview.title, preview.date, preview.startTime, preview.imageUrl], ["Fixture live", "2027-05-05", "11:30", ""]);
  assert.equal(preview.existingEvents[0].id, "legacy");
  const unavailable = (await post("facebook-event-preview", { url: newUrl })).result.data;
  assert.deepEqual([unavailable.sourceId, unavailable.title, unavailable.date, unavailable.imageUrl], ["87654321", "", "", ""]);
  if (process.env.BASSIC_QA_FACEBOOK_READ === "1") {
    const archive = (await post("facebook-event-preview", { url: bassicArchiveUrl })).result.data;
    assert.equal(archive.title, "GUNkondo LIVE!!");
    assert.equal(archive.date, "2022-08-26");
    assert.ok(archive.startTime === "" || archive.startTime === "20:00");
    assert.match(archive.imageUrl, /^https:\/\//);
    console.log("Read-only Bassic event: title, date and image matched. START " + (archive.startTime || "requires staff entry") + ".");
  }

  const event = { title: "Isolated live", date: "2027-05-05", startTime: "19:00", image, sourceUrl: newUrl, isPublished: true };
  await post("content/events", { ...event, sourceUrl: legacyUrl }, 409);
  const saved = (await post("content/events", event)).result.data;
  assert.equal(events.size, 1, "The failing legacy endpoint must not receive new event writes");
  assert.equal(compactEvents.get(saved.id)?.kind, "events");
  assert.equal(compactEvents.get(saved.id)?.image, undefined, "Posters stay in the JSON body, never a physical CMS image field");
  const canonical=(await get("content/events")).contents.find(item=>item.id===saved.id);
  assert.deepEqual(canonical.image,image);
  assert.equal(canonical.date,event.date);
  assert.equal(canonical.sourceType,undefined);
  await post("content/events", event, 409);
  assert.equal(events.size + compactEvents.size, 2);
  await post(`content/events/${saved.id}`, { startTime: "20:00" }, 200, "PATCH");
  const edited = (await get("content/events")).contents.find(item => item.id === saved.id);
  assert.equal(edited.startTime, "20:00");
  assert.equal(edited.title, event.title);
  assert.deepEqual(edited.image, image, "A partial edit must preserve the poster");
  await post(`content/events/${saved.id}`, { startTime: event.startTime }, 200, "PATCH");

  const migrationUrl = "https://www.facebook.com/events/99999999/";
  const migration = { ...event, id: "legacy-migration", sourceUrl: migrationUrl };
  events.set(migration.id, migration);
  const migrated = (await post(`content/events/${migration.id}`, { startTime: "21:00" }, 200, "PATCH")).result.data;
  assert.notEqual(migrated.id, migration.id);
  assert.equal(events.get(migration.id).startTime, event.startTime, "Migrating must not write to the legacy endpoint");
  const migrationMatches = (await get("content/events")).contents.filter(item => item.sourceUrl === migrationUrl);
  assert.equal(migrationMatches.length, 1);
  assert.equal(migrationMatches[0].startTime, "21:00");
  assert.deepEqual(migrationMatches[0].image, image);
  await post(`content/events/${migrated.id}`, {}, 200, "DELETE");
  assert.equal((await get("content/events")).contents.filter(item => item.sourceUrl === migrationUrl).length, 0, "Deleting a migrated record must not resurrect the legacy event");
  assert.ok(events.has(migration.id), "No legacy record is destroyed during migration/removal");
  events.delete(migration.id); compactEvents.delete(migrated.id);

  const flow = { event: { ...event, ...saved }, platforms: ["x", "instagram"] };
  const first = (await post("event-publish-flow", flow)).result.data;
  assert.deepEqual(first.created, flow.platforms);
  const xDraft = readNotices().find((notice) => notice.platform === "x");
  assert.match(xDraft.postText, /START 19:00/);
  assert.deepEqual(xDraft.image, image);
  assert.equal(xDraft.isPublished, false);
  await post(`content/social-notices/${xDraft.id}`, { postText: "Staff edited text" }, 200, "PATCH");
  const second = (await post("event-publish-flow", { ...flow, event: { ...flow.event, startTime: "20:00" } })).result.data;
  assert.deepEqual(second, { created: [], skipped: flow.platforms, review: flow.platforms });
  assert.equal(notices.size, 2);
  assert.equal(readNotices().find(item => item.id === xDraft.id).postText, "Staff edited text");
  assert.deepEqual(readNotices().find(item => item.id === xDraft.id).image, image, "Editing draft text must preserve its poster URL");

  // A response may be lost after the first platform was saved. Retry using the
  // saved event, not the old browser payload, and only create the missing draft.
  notices.clear();
  loseSocialWriteResponse = true;
  await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms }, 502);
  assert.equal(notices.size, 1);
  const partial = readNotices()[0];
  const partialId = partial.id;
  await post(`content/social-notices/${partialId}`, { postText: "Staff edited after partial failure" }, 200, "PATCH");
  changeEvent(saved.id, { startTime: "20:00" });
  const recovered = (await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms })).result.data;
  assert.deepEqual(recovered.created, ["instagram"]);
  assert.deepEqual(recovered.skipped, ["x"]);
  assert.equal(notices.size, 2);
  assert.equal(readNotices().find(item => item.id === partialId).postText, "Staff edited after partial failure");
  assert.match(readNotices().find(item => item.platform === "instagram").postText, /START 20:00/);
  changeEvent(saved.id, { isPublished: false });
  await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms }, 409);
  assert.equal(notices.size, 2);
  changeEvent(saved.id, { isPublished: true, startTime: event.startTime });
  // Restore the fixture used later to check preservation of staff text.
  await post(`content/social-notices/${readNotices().find(item => item.platform === "x").id}`, { postText: "Staff edited text" }, 200, "PATCH");
  console.log("Partial SNS failure passed: retry uses current saved data, preserves staff edits, creates only the missing platform and rejects withdrawn events.");
  const removable = (await post("content/social-notices", { ...readNotices()[0], id: undefined, sourceEventId: "soft-remove-fixture" })).result.data;
  await post(`content/social-notices/${removable.id}`, {}, 200, "DELETE");
  assert.ok(!(await get("content/social-notices")).contents.some(item => item.id === removable.id));
  assert.ok(notices.has(removable.id), "Deleted drafts must remain recoverable");
  notices.delete(removable.id);

  socialUnavailable = true;
  const [publication] = await Promise.all([post("deploy", {}), post("event-publish-flow", flow, 502)]);
  assert.ok(publication.result.data.requestId);
  assert.equal(publishRequests, 1);
  socialUnavailable = false;

  assert.equal((await get("calendar-status")).configured, false);
  await post("calendar-sync", { eventId: saved.id }, 403);
  process.env.GOOGLE_CALENDAR_SYNC_ENABLED = "true";
  assert.equal((await get("calendar-status")).configured, true);
  await post("calendar-sync", { eventId: "missing" }, 409);
  await post("calendar-sync", null, 400);
  await post("calendar-sync", { eventId: "../other" }, 400);
  await post("calendar-sync", { eventId: saved.id });
  assert.equal(calendarRequests, 1);
  const syncPreviewEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  await post("calendar-sync", { eventId: saved.id }, 403);
  if (syncPreviewEnv === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = syncPreviewEnv;
  changeEvent(saved.id, { isPublished: false });
  await post("calendar-sync", { eventId: saved.id }, 409);
  changeEvent(saved.id, { isPublished: true });
  process.env.GOOGLE_CALENDAR_SYNC_ENABLED = "false";
  const check = { id: "87654321", title: event.title, date: event.date, startTime: event.startTime };
  assert.equal((await post("calendar-status", check)).result.data.state, "not-found");
  calendarItems = [{
    summary: event.title,
    start: { dateTime: "2027-05-05T10:00:00Z" },
    end: { dateTime: "2027-05-05T12:00:00Z" },
    extendedProperties: { private: { syncTag: "bassic-facebook-sync" } }
  }];
  assert.equal((await post("calendar-status", check)).result.data.state, "matched");
  const fullCheck = { ...check, syncKey: "facebook-87654321", sourceUrl: newUrl, imageUrl: image.url };
  assert.equal((await post("calendar-status", fullCheck)).result.data.state, "review");
  calendarItems[0].description = "START 19:00\n\nイベント詳細: " + newUrl + "\n\n画像: " + image.url;
  assert.equal((await post("calendar-status", fullCheck)).result.data.state, "review", "Calendar-only details cannot confirm public visibility");
  calendarItems[0].visibility = "public";
  assert.equal((await post("calendar-status", fullCheck)).result.data.state, "matched");
  assert.equal((await post("calendar-status", { ...fullCheck, imageUrl: "https://images.example.invalid/replaced.png" })).result.data.state, "review", "A changed image URL must not be reported as synced before the calendar updates");
  assert.equal((await post("calendar-status", { ...fullCheck, endTime: "22:00" })).result.data.state, "review");
  assert.equal((await post("calendar-status", { ...check, startTime: "20:00" })).result.data.state, "review");
  calendarUnavailable = true;
  await post("calendar-status", check, 502);
  calendarUnavailable = false;
  calendarItems.push(structuredClone(calendarItems[0]));
  assert.equal((await post("calendar-status", check)).result.data.state, "review", "Duplicate calendar entries must never be reported as matched");
  calendarItems = [{ ...calendarItems[0], status: "cancelled" }];
  assert.equal((await post("calendar-status", check)).result.data.state, "not-found");
  const originalVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  try {
    await post("content/events", { ...event, sourceUrl: "https://www.facebook.com/events/66666666/" }, 502);
    assert.equal(events.size + compactEvents.size, 2);
    await post("deploy", {}, 403);
    assert.equal(publishRequests, 1);
  } finally {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  }
  console.log("Isolated admin flow passed: Facebook fallback, event and SNS deduplication, staff edits, independent publishing, calendar status.");

  socialUnavailable = false;
  if (process.env.BASSIC_QA_SIMPLIFIED === "1" || (process.env.BASSIC_QA_PLAYWRIGHT && process.env.BASSIC_QA_CHROMIUM)) {
    process.env.GOOGLE_CALENDAR_SYNC_ENABLED = "true";
    const { chromium } = require(process.env.BASSIC_QA_PLAYWRIGHT);
    const browser = await chromium.launch({ executablePath: process.env.BASSIC_QA_CHROMIUM });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
      await page.route("**/*", route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await page.goto(base);
      await page.getByLabel("共有パスワード").fill(password);
      await page.getByRole("button",{name:"ログイン",exact:true}).click();
      await page.getByRole("button",{name:"イベントスケジュール",exact:true}).click();
      try { await page.frameLocator("iframe.public-canvas-frame").getByText(/ここでは配置だけ/).waitFor({timeout:5000}); } catch (error) { await page.screenshot({path:join(process.env.TEMP,"bassic-calendar-preview-debug.png")}); console.log("FRAMES",await page.locator("iframe").evaluateAll(nodes=>nodes.map(n=>({title:n.title,html:n.srcdoc.slice(0,4000)})))); throw error; }
      assert.equal(await page.frameLocator("iframe.public-canvas-frame").locator("iframe[src*='calendar.google.com']").count(),0);
      await page.getByRole("button",{name:"イベントを追加",exact:true}).click();
      const panel=page.getByRole("region",{name:"Facebookイベント取り込み"});
      await panel.locator("input#sourceUrl").fill(guidedUrl);
      await panel.getByRole("button",{name:"Facebookから読み取る",exact:true}).click();
      await page.waitForFunction(() => document.querySelector("input#title")?.value === "Guided live");
      await panel.getByText("未入力：開始時刻", { exact: true }).waitFor();
      await panel.locator("input#title").fill("Compact calendar fixture");
      await panel.locator("input#date").fill("2027-07-07");
      await panel.locator("input#startTime").fill("19:00");
      assert.equal(await panel.getByText("未入力：開始時刻", { exact: true }).count(), 0);
      assert.equal(await page.getByRole("button",{name:"この端末に保存",exact:true}).count(),0);
      const beforePublish=publishRequests, beforeCalendar=calendarRequests;
      await page.getByRole("button",{name:"登録内容を確認",exact:true}).click();
      const review=page.getByRole("dialog",{name:"イベントの登録内容を確認"});
      await review.getByRole("heading",{name:"この内容で登録します"}).waitFor();
      assert.equal(await review.locator("iframe").count(),0);
      await review.getByText("Compact calendar fixture",{exact:true}).waitFor();
      await review.getByText("19:00",{exact:true}).waitFor();
      await review.getByText("未定（カレンダーは仮の2時間枠）",{exact:true}).waitFor();
      assert.equal(publishRequests,beforePublish,"Review must not publish");
      assert.equal(calendarRequests,beforeCalendar,"Review must not register");
      const shots=join(process.env.TEMP||"/tmp","bassic-event-simple-qa"); await mkdir(shots,{recursive:true});
      await page.screenshot({path:join(shots,"calendar-confirmation-desktop.png")});
      await review.getByRole("button",{name:"この内容で登録",exact:true}).click();
      await page.getByText("登録内容を保存しました",{exact:true}).waitFor();
      const calendarStatus=page.getByRole("region",{name:"Googleカレンダーの反映状況"});
      await calendarStatus.getByText(/Googleカレンダーに登録中/).waitFor();
      assert.equal(publishRequests,beforePublish,"Events must not dispatch a site build");
      assert.equal(calendarRequests,beforeCalendar+1,"Events must dispatch calendar only");
      const directSocial = page.getByRole("region", { name: "SNSで使う", exact: true });
      await directSocial.getByRole("link", { name: "Xの投稿画面を開く", exact: true }).waitFor();
      assert.match(await directSocial.getByRole("link", { name: "Xの投稿画面を開く", exact: true }).getAttribute("href"), /Compact\+calendar\+fixture/);
      await directSocial.getByRole("link", { name: "文面をコピーしてInstagramを開く", exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "SNS用の文面を開く", exact: true }).count(), 0);
      const currentX = readNotices().find(item => item.sourceEventId === "77777777" && item.platform === "x");
      await post(`content/social-notices/${currentX.id}`, { postText: "Staff latest direct-post text" }, 200, "PATCH");
      await page.evaluate(() => window.dispatchEvent(new Event("bassic-social-draft-saved")));
      await page.waitForFunction(() => [...document.querySelectorAll('a')].some(link => link.textContent === "Xの投稿画面を開く" && link.href.includes("Staff+latest+direct-post+text")));
      await directSocial.scrollIntoViewIfNeeded();
      await page.screenshot({path:join(shots,"direct-social-desktop.png")});
      assert.equal(calendarRequests,beforeCalendar+1,"Reading saved SNS drafts must not re-register a calendar event");
      const saved=mergeEventRecords([...events.values()],[...compactEvents.values()]).find(item=>item.title==="Compact calendar fixture");
      assert.ok(saved?.id,"Confirmed event must be stored canonically");
      await page.reload();
      await page.getByRole("button",{name:"イベントを追加",exact:true}).click();
      assert.equal(await page.locator("input#startTime").inputValue(),"","A new event must not restore an old browser draft");
      await page.setViewportSize({width:390,height:844});
      await page.locator("input#sourceUrl").fill("https://www.facebook.com/events/88888888/");
      await page.locator("input#title").fill("Mobile calendar fixture");
      await page.locator("input#date").fill("2027-07-08");
      await page.locator("input#startTime").fill("20:00");
      await page.getByRole("button",{name:"登録内容を確認",exact:true}).click();
      await page.getByRole("dialog",{name:"イベントの登録内容を確認"}).waitFor();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:join(shots,"calendar-confirmation-mobile.png")});
      await page.getByRole("button", { name: "この内容で登録", exact: true }).click();
      await page.getByRole("region", { name: "SNSで使う", exact: true }).getByRole("link", { name: "Xの投稿画面を開く", exact: true }).waitFor();
      await page.getByRole("region", { name: "SNSで使う", exact: true }).scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:join(shots,"direct-social-mobile.png")});
      console.log("Simplified event UI passed: compact review, calendar-only dispatch, no device save, independent SNS, clean new event, mobile layout.");
    } finally {await browser.close();}
  }

} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await app.close();
  globalThis.fetch = realFetch;
}
// Next's development file watcher can outlive the closed HTTP server.
if (process.env.BASSIC_QA_PUBLIC_SITE === "1") process.exit(process.exitCode || 0);
