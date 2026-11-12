// Run npm run build:admin-app first. All provider responses stay in memory.
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

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
const slides = new Map();
let calendarItems = [];
let calendarUnavailable = false;
let socialUnavailable = false;
let loseSocialWriteResponse = false;
let cmsReadMode = "ok";
let publishRequests = 0;
let lastPublishId = "";
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  if (url.hostname === "127.0.0.1") return realFetch(input, init);

  if (url.hostname === "www.bassic.jp") {
    const markup = url.pathname === "/events/"
      ? '<section aria-labelledby="upcoming-events-heading"><h2 id="upcoming-events-heading">開催予定のイベント</h2></section>'
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
      startDate: url.href === guidedUrl ? "2027-07-07T19:00:00+09:00" : "2027-05-04T19:30:00-07:00",
      description: "18:00 OPEN / 19:00 START"
    };
    return new Response(`<script type="application/ld+json">${JSON.stringify(event)}</script>`);
  }

  if (url.hostname === "bassic-fixture.microcms.io") {
    const [endpoint, id] = url.pathname.split("/").slice(3);
    if (endpoint === "menu" && socialUnavailable) return new Response(null, { status: 503 });
    const collection = endpoint === "events" ? events : endpoint === "menu" ? notices : endpoint === "hero-slides" ? slides : null;
    assert.ok(collection, "Unexpected fixture CMS endpoint");
    if (method === "GET") {
      if (cmsReadMode === "unavailable") return new Response(null, { status: 503 });
      if (cmsReadMode === "malformed") return Response.json({ contents: "invalid" });
      if (id) return Response.json(collection.get(id));
      const offset = cmsReadMode === "repeat" ? 0 : Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 100);
      return Response.json({ contents: [...collection.values()].slice(offset, offset + limit), totalCount: collection.size });
    }
    const body = init?.body ?? await input.text();
    if (method === "POST") {
      assert.equal(id, undefined);
      const generatedId = `fixture-${endpoint}-${collection.size + 1}`;
      collection.set(generatedId, { ...JSON.parse(body), id: generatedId });
      if (endpoint === "menu" && loseSocialWriteResponse) {
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
      lastPublishId = JSON.parse(init?.body ?? await input.text()).client_payload.requestId;
      publishRequests += 1;
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
    assert.equal(url.searchParams.get("privateExtendedProperty"), "syncKey=facebook-87654321");
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
  async function post(path, body, status = 200) {
    const response = await realFetch(base + "/api/" + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    assert.equal(response.status, status, `${path}: ${JSON.stringify(result)}`);
    return { result, response };
  }

  await post("facebook-event-preview", { url: legacyUrl }, 401);
  await post("calendar-status", {}, 401);
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
  assert.equal(events.get(saved.id)?.sourceUrl, newUrl);
  await post("content/events", event, 409);
  assert.equal(events.size, 2);

  const flow = { event: { ...event, ...saved }, platforms: ["x", "instagram"] };
  const first = (await post("event-publish-flow", flow)).result.data;
  assert.deepEqual(first.created, flow.platforms);
  const xDraft = [...notices.values()].find((notice) => notice.platform === "x");
  assert.match(xDraft.postText, /START 19:00/);
  assert.deepEqual(xDraft.image, image);
  assert.equal(xDraft.isPublished, false);
  xDraft.postText = "Staff edited text";
  const second = (await post("event-publish-flow", { ...flow, event: { ...flow.event, startTime: "20:00" } })).result.data;
  assert.deepEqual(second, { created: [], skipped: flow.platforms, review: flow.platforms });
  assert.equal(notices.size, 2);
  assert.equal(xDraft.postText, "Staff edited text");

  // A response may be lost after the first platform was saved. Retry using the
  // saved event, not the old browser payload, and only create the missing draft.
  notices.clear();
  loseSocialWriteResponse = true;
  await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms }, 502);
  assert.equal(notices.size, 1);
  const partial = [...notices.values()][0];
  const partialId = partial.id;
  partial.postText = "Staff edited after partial failure";
  events.get(saved.id).startTime = "20:00";
  const recovered = (await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms })).result.data;
  assert.deepEqual(recovered.created, ["instagram"]);
  assert.deepEqual(recovered.skipped, ["x"]);
  assert.equal(notices.size, 2);
  assert.equal(notices.get(partialId).postText, "Staff edited after partial failure");
  assert.match([...notices.values()].find(item => item.platform === "instagram").postText, /START 20:00/);
  events.get(saved.id).isPublished = false;
  await post("event-publish-flow", { eventId: saved.id, platforms: flow.platforms }, 409);
  assert.equal(notices.size, 2);
  events.get(saved.id).isPublished = true;
  events.get(saved.id).startTime = event.startTime;
  // Restore the fixture used later to check preservation of staff text.
  [...notices.values()].find(item => item.platform === "x").postText = "Staff edited text";
  console.log("Partial SNS failure passed: retry uses current saved data, preserves staff edits, creates only the missing platform and rejects withdrawn events.");

  socialUnavailable = true;
  const [publication] = await Promise.all([post("deploy", {}), post("event-publish-flow", flow, 502)]);
  assert.ok(publication.result.data.requestId);
  assert.equal(publishRequests, 1);

  const check = { id: "87654321", title: event.title, date: event.date, startTime: event.startTime };
  assert.equal((await post("calendar-status", check)).result.data.state, "not-found");
  calendarItems = [{
    summary: event.title,
    start: { dateTime: "2027-05-05T10:00:00Z" },
    extendedProperties: { private: { syncTag: "bassic-facebook-sync" } }
  }];
  assert.equal((await post("calendar-status", check)).result.data.state, "matched");
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
    assert.equal(events.size, 2);
    await post("deploy", {}, 403);
    assert.equal(publishRequests, 1);
  } finally {
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  }
  console.log("Isolated admin flow passed: Facebook fallback, event and SNS deduplication, staff edits, independent publishing, calendar status.");

  socialUnavailable = false;
  // Optional browser check with a locally installed Playwright and Chromium.
  if (process.env.BASSIC_QA_PLAYWRIGHT && process.env.BASSIC_QA_CHROMIUM) {
    const { chromium } = require(process.env.BASSIC_QA_PLAYWRIGHT);
    const browser = await chromium.launch({ executablePath: process.env.BASSIC_QA_CHROMIUM });
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      await page.route("**/*", (route) => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await page.goto(base);
      await page.getByLabel("共有パスワード").fill(password);
      await page.getByRole("button", { name: "ログイン", exact: true }).click();
      const pageNav = page.getByRole("navigation", { name: "編集するページ" });
      const topNav = pageNav.getByRole("button", { name: "TOPページ", exact: true });
      const eventsNav = pageNav.getByRole("button", { name: "イベントスケジュール", exact: true });
      await topNav.waitFor();
      await page.getByRole("heading",{name:"TOPページ",exact:true}).waitFor();
      assert.equal(await topNav.getAttribute("aria-current"), "page");
      const workspace = page.locator(".admin-workspace-content");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow in mobile admin");
      await page.setViewportSize({ width: 1440, height: 900 });
      const navBox = await pageNav.boundingBox();
      const workspaceBox = await workspace.boundingBox();
      assert.ok(navBox.x + navBox.width < workspaceBox.x, "Desktop page navigation should sit left of the editor");
      await eventsNav.click();
      assert.equal(await eventsNav.getAttribute("aria-current"), "page");
      await page.setViewportSize({ width: 390, height: 844 });
      console.log("Admin navigation passed: desktop sidebar, mobile layout and active page.");

      await page.getByText('登録情報・非表示の項目',{exact:true}).click();
      await page.getByRole('button',{name:'イベント一覧',exact:true}).click();
      const panel = page.getByRole("region", { name: "Facebookイベント取り込み" });
      const sourceField = page.locator(".editable-field-card").filter({ hasText: "FacebookイベントURL・詳細URL" });
      const sourceInput = sourceField.getByRole("textbox");
      let releaseOldResponse;
      let requestStarted;
      const oldResponseGate = new Promise(resolve => { releaseOldResponse = resolve; });
      const startedGate = new Promise(resolve => { requestStarted = resolve; });
      await page.route("**/api/facebook-event-preview", async route => {
        requestStarted();
        await oldResponseGate;
        await route.fulfill({ json: { ok: true, data: preview } });
      }, { times: 1 });
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await startedGate;
      await sourceInput.fill(newUrl);
      releaseOldResponse();
      await panel.getByRole("button", { name: "Facebookから読み取る" }).waitFor({ state: "visible" });
      await page.waitForFunction(() => !document.querySelector('.facebook-import-panel button')?.disabled);
      assert.equal(await panel.getByText("Fixture live", { exact: true }).count(), 0, "An old URL response must not populate the new event");
      assert.equal(await sourceInput.inputValue(), newUrl);
      await sourceInput.fill(legacyUrl);
      console.log("Facebook race passed: changing the URL discards the previous in-flight result without changing the entered URL.");
      await page.route("**/api/facebook-event-preview", route => route.fulfill({ json: {
        ok: true, data: { ...preview, imageUrl: "https://images.example.invalid/broken-image.png" }
      } }), { times: 1 });
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await panel.getByText(/画像を表示できません/).waitFor();
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await panel.getByText("Fixture live", { exact: true }).waitFor();
      await panel.getByRole("button", { name: "登録済みのイベントを編集" }).click();
      const startField = page.locator(".editable-field-card").filter({ has: page.getByText("START", { exact: true }) });
      const startInput = startField.getByRole("textbox");
      await startInput.fill("");
      assert.match(await panel.getByRole("textbox", { name: "Google Calendar反映依頼メモ" }).inputValue(), /START: 未入力/);
      assert.equal(await panel.getByRole("button", { name: "コピーする", exact: true }).isDisabled(), true);
      await startInput.fill("11:30");
      await page.route("**/api/facebook-event-preview", route => route.fulfill({ json: {
        ok: true, data: { ...preview, title: "", date: "", startTime: "", imageUrl: "", existingEvents: [] }
      } }), { times: 1 });
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await panel.getByText(/取得できなかった項目は/).waitFor();
      assert.equal(await startInput.inputValue(), "11:30", "Missing import data must not erase staff input");
      assert.match(await panel.getByRole("textbox", { name: "Google Calendar反映依頼メモ" }).inputValue(), /START: 11:30/);
      await page.getByRole("button", { name: "この端末に保存", exact: true }).click();
      await page.getByText(/このブラウザに下書きを保存しました/).waitFor();
      const eventImageField = page.locator(".editable-field-card").filter({ hasText: "イベント画像" });
      let uploadStarted, releaseUpload, uploadHandled;
      const startedUpload = new Promise(resolve => { uploadStarted = resolve; });
      const uploadGate = new Promise(resolve => { releaseUpload = resolve; });
      const handledUpload = new Promise(resolve => { uploadHandled = resolve; });
      await page.route("**/api/media", async route => {
        uploadStarted();
        await uploadGate;
        try { await route.fulfill({ json: { ok: true, data: { url: "https://images.example.invalid/uploaded-race.png" } } }); }
        catch { /* Navigating away cancels this upload request. */ }
        finally { uploadHandled(); }
      }, { times: 1 });
      await eventImageField.locator('input[type="file"]').setInputFiles({ name: "fixture.png", mimeType: "image/png", buffer: Buffer.from("isolated upload") });
      await startedUpload;
      await page.locator(".item-list").getByRole("button", { name: /^Isolated live/ }).click();
      releaseUpload();
      await handledUpload;
      assert.equal(await page.locator('img[src*="uploaded-race"]').count(), 0);
      assert.equal(await page.locator(".dirty-pill").count(), 0, "A late upload must not modify the newly selected event");
      await page.locator(".item-list").getByRole("button", { name: /^Earlier title/ }).click();
      await page.getByText("このブラウザに保存した下書きを開きました。", { exact: true }).waitFor();
      console.log("Upload isolation passed: selecting another event cancels the old upload and leaves the new event unchanged.");
      await page.getByLabel("現在の編集場所").waitFor();
      if (process.env.BASSIC_QA_ARTIFACT_DIR) {
        await mkdir(process.env.BASSIC_QA_ARTIFACT_DIR, { recursive: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: join(process.env.BASSIC_QA_ARTIFACT_DIR, "admin-editor.png") });
        await page.setViewportSize({ width: 390, height: 844 });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow at mobile width");
      console.log("Mobile admin browser passed: login, Facebook import, existing event selection and draft save.");

      socialUnavailable = false;
      await page.getByRole("button", { name: "掲載前に確認", exact: true }).click();
      await page.getByRole("checkbox", { name: "入力内容、画像、リンク先、公開後の確認項目を見ました。" }).check();
      await page.waitForFunction(()=>!document.querySelector('.preview-modal .primary-button')?.disabled);
      socialUnavailable=true;
      await page.getByRole("button", { name: "サイトに掲載", exact: true }).evaluate(button => { button.click(); button.click(); });
      await page.getByText("公開サイトに反映されました", { exact: true }).waitFor();
      assert.equal(publishRequests, 2);
      assert.equal(events.get("legacy").title, "Fixture live");
      assert.equal(events.get("legacy").startTime, "11:30");
      assert.deepEqual(events.get("legacy").image, image);
      await page.getByRole("button", { name: "SNS下書きだけをやり直す", exact: true }).waitFor();
      assert.equal(notices.size, 2);
      socialUnavailable = false;
      await page.route("**/api/event-publish-flow", route => route.fulfill({ json: { ok: true, data: { created: [], skipped: [] } } }), { times: 1 });
      await page.getByRole("button", { name: "SNS下書きだけをやり直す", exact: true }).click();
      await page.getByText("SNS下書きの作成結果を確認できませんでした。", { exact: true }).waitFor();
      await page.getByRole("button", { name: "SNS下書きだけをやり直す", exact: true }).evaluate(button => { button.click(); button.click(); });
      await page.getByText(/自動投稿はしていません/).waitFor();
      assert.equal(publishRequests, 2, "SNS recovery must not republish the site");
      assert.equal(notices.size, 4);
      console.log("Mobile publication passed: existing event updated, missing image preserved, two drafts created, site status verified.");

      await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
      await page.getByRole("button", { name: "EVENT SCHEDULEへ戻る" }).click();
      await page.getByRole('heading',{name:'EVENT SCHEDULE',exact:true}).waitFor();
      await page.getByText('登録情報・非表示の項目',{exact:true}).click();await page.getByRole('button',{name:'SNS投稿の下書き',exact:true}).click();
      const socialPanel = page.getByRole("region", { name: "SNSへの投稿準備" });
      for (const [platform, linkName, href] of [
        ["X", "Xの投稿画面を開く", "https://x.com/compose/post"],
        ["INSTAGRAM", "Instagramを開く", "https://www.instagram.com/"]
      ]) {
        await page.getByRole("button", { name: "Isolated live (" + platform + ")" }).click();
        assert.equal(await socialPanel.getByRole("link", { name: linkName }).getAttribute("href"), href);
        assert.equal(await socialPanel.getByRole("link", { name: "画像を確認" }).getAttribute("href"), image.url);
        await socialPanel.getByRole("button", { name: "投稿文をコピー" }).click();
        await socialPanel.getByText("投稿文をコピーしました。").waitFor();
        const expected = platform === "X" ? "Staff edited text" : [...notices.values()].find((notice) => notice.platform === "instagram").postText;
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        assert.equal(copied.replace(/\r\n/g, "\n"), expected);
      }
      console.log("Mobile SNS browser passed: X and Instagram clipboard text, poster links and posting destinations.");

      await page.getByRole("navigation", { name: "編集するページ" }).getByRole("button", { name: "イベントを追加", exact: true }).click();
      const entryGuide = page.getByRole("region", { name: "イベント追加の流れ" });
      await entryGuide.waitFor();
      assert.equal(await entryGuide.getByRole("listitem").count(), 4);
      assert.equal(await page.locator(".item-list").count(), 0, "The event entry opens a new event instead of selecting an existing one");
      const entryUrl = page.getByRole("region", { name: "1 FacebookのURLを貼る", exact: true }).getByRole("textbox");
      assert.equal(await entryUrl.inputValue(), "");
      await page.getByRole("button", { name: "内容を確認してサイトに掲載", exact: true }).click();
      const entryFeedback = page.locator('.editor-feedback[role="alert"]');
      await entryFeedback.getByRole("region", { name: "直す項目" }).waitFor();
      await page.waitForFunction(() => document.activeElement?.classList.contains("editor-feedback"));
      assert.ok((await entryFeedback.boundingBox()).y < 160, "Validation errors must be revealed at the top");
      await entryFeedback.getByRole("link", { name: "イベント名", exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.id === "title");
      await entryUrl.fill(guidedUrl);
      await page.getByRole("region", { name: "Facebookイベント取り込み" }).getByRole("button", { name: "Facebookから読み取る" }).click();
      await page.waitForFunction(() => document.querySelector('input#title')?.value === "Guided live");
      assert.equal([...events.values()].filter(item => item.sourceUrl === guidedUrl).length, 0, "Reading alone must not save the event");
      await page.getByRole("button", { name: "内容を確認してサイトに掲載", exact: true }).click();
      assert.equal([...events.values()].filter(item => item.sourceUrl === guidedUrl).length, 0, "Preview alone must not publish the event");
      await page.getByRole("checkbox", { name: "入力内容、画像、リンク先、公開後の確認項目を見ました。" }).check();
      let failNextEventSave = true;
      await page.route("**/api/content/events", route => {
        if (route.request().method() === "POST" && failNextEventSave) {
          failNextEventSave = false;
          return route.fulfill({ status: 503, json: { ok: false, message: "テスト用：保存に失敗しました" } });
        }
        return route.fallback();
      });
      await page.getByRole("button", { name: "サイトに掲載", exact: true }).click();
      await entryFeedback.getByText(/テスト用：保存に失敗しました/).waitFor();
      await page.waitForFunction(() => document.activeElement?.classList.contains("editor-feedback"));
      assert.ok((await entryFeedback.boundingBox()).y < 160, "A failed CMS save must reveal the error after closing preview");
      assert.equal(await page.locator('input#title').inputValue(), "Guided live");
      assert.equal([...events.values()].filter(item => item.sourceUrl === guidedUrl).length, 0);
      await page.getByRole("button", { name: "内容を確認してサイトに掲載", exact: true }).click();
      await page.getByRole("checkbox", { name: "入力内容、画像、リンク先、公開後の確認項目を見ました。" }).check();
      await page.route("**/api/deploy?*", route => route.fulfill({ json: { ok: true, data: { state: "failed" } } }), { times: 1 });
      await page.getByRole("button", { name: "サイトに掲載", exact: true }).click();
      await page.getByText("公開サイトへの反映に失敗しました", { exact: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.classList.contains("deploy-status"));
      assert.ok((await page.locator('.deploy-status[role="alert"]').boundingBox()).y < 160, "Asynchronous publishing failures must reveal their retry action");
      await page.getByRole("button", { name: "反映だけをやり直す", exact: true }).click();
      await page.getByText("公開サイトに反映されました", { exact: true }).waitFor();
      assert.equal([...events.values()].filter(item => item.sourceUrl === guidedUrl && item.isPublished).length, 1);
      const guidedDrafts = [...notices.values()].filter(item => item.sourceEventId === "77777777");
      assert.equal(guidedDrafts.length, 2);
      await page.getByRole("button", { name: "SNS用の文面を開く", exact: true }).click();
      await page.locator(".item-list").getByRole("button", { name: "Guided live (INSTAGRAM)" }).click();
      await page.getByRole("region", { name: "SNSへの投稿準備" }).getByRole("button", { name: "投稿文をコピー" }).click();
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /Guided live/);
      assert.equal(await page.locator(".item-list").getByRole("button", { name: /Isolated live|Fixture live/ }).count(), 0, "The SNS handoff must show only this event's drafts");
      console.log("Guided event entry passed: sidebar shortcut, blank URL, reviewed publication, and related SNS drafts with clipboard copy.");

      if (process.env.BASSIC_QA_PUBLIC_SITE === "1") {
        socialUnavailable = false;
        await post("content/home", {
          heroTitle: "public bar Bassic.",
          heroLead: "Isolated TOP lead",
          homeHeroTitle: "",
          heroMobileTitle: "Short mobile heading",
          mobileHideMap: true,
          firstVisitCard1MobilePosition: "top",
          heroCallLabel: "Isolated call",
          headerLogo: { ...image, alt: "Isolated header logo" },
          footerCopyright: "Isolated footer",
          visitInfoCard1Title: "Isolated business hours",
          homeAccessDirectionsLabel: "Isolated route button",
          firstVisitTitle: "Isolated First Visit heading",
          firstVisitDescription: "Isolated First Visit description",
          firstVisitCard1Title: "Updated First Visit card",
          firstVisitCard1Image: { ...image, alt: "Isolated First Visit poster" },
          visitInfoTitle: "Isolated visit information",
          localSearchCard1Text: "Isolated directions card description",
          socialTitleLine1: "Isolated social heading",
          homeAccessTitle: "Isolated access heading"
        });
        const mobileImage = { url: "https://images.example.invalid/mobile.png" };
        await post("content/hero-slides", { page: "home", title: "Fixture slide", image, mobileImage, mobilePosition: "right", displayOrder: 1, isPublished: true });
        await post("content/hero-slides", { page: "home", title: "Shared-only slide", image, displayOrder: 2, isPublished: true });
        await post("content/page-copy", { page: "home", heroTitle: "Isolated main heading", heroLead: "Published hero description", isPublished: true });
        await post("content/page-sections", { page: "home", sectionKey: "firstVisit", displayOrder: 4, isPublished: true });
        await post("content/page-sections", { page: "home", sectionKey: "localSearch", displayOrder: 2, isPublished: false });
        await post("content/custom-sections", { page: "home", title: "Isolated custom block", body: "Isolated custom block for the publication order check.", displayOrder: 2.5, isPublished: true });
        events.set("unpublished", { ...event, id: "unpublished", title: "Hidden fixture live", isPublished: false });
        for (const [id, url] of [["portrait", "https://images.example.invalid/portrait.svg"], ["landscape", "https://images.example.invalid/landscape.svg"], ["text-only", ""]]) {
          events.set(id, { ...event, id, title: id + "-" + "LongEventName".repeat(16), image: url ? { url } : undefined });
        }
        process.env.NODE_ENV = "development";
        const publicRequire = createRequire(new URL("../package.json", import.meta.url));
        const publicApp = publicRequire("next")({
          dev: true,
          dir: fileURLToPath(new URL("../", import.meta.url)),
          hostname: "127.0.0.1",
          conf: { distDir: ".next/isolated-public", trailingSlash: true, images: { unoptimized: true } }
        });
        const publicServer = createServer(publicApp.getRequestHandler());
        try {
          await publicApp.prepare();
          await new Promise((resolve) => publicServer.listen(0, "127.0.0.1", resolve));
          const publicBase = `http://127.0.0.1:${publicServer.address().port}`;
          const publicPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
          publicPage.setDefaultTimeout(10000);
          await publicPage.route("**/*", (route) => {
            const requestUrl = route.request().url();
            if (new URL(requestUrl).origin === publicBase) return route.continue();
            if (/^https:\/\/images\.example\.invalid\/(portrait|landscape)\.svg$/.test(requestUrl)) return route.fulfill({
              contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" width="${requestUrl.includes("portrait") ? 300 : 1200}" height="600"><rect width="100%" height="100%" fill="black"/></svg>`
            });
            if (requestUrl === image.url || requestUrl === mobileImage.url) return route.fulfill({
              contentType: "image/svg+xml",
              body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="black"/></svg>'
            });
            return route.abort();
          });
          await publicPage.goto(publicBase + "/events/");
          const upcoming = publicPage.getByRole("region", { name: "開催予定のイベント" });
          await upcoming.getByRole("heading", { name: event.title }).waitFor();
          await upcoming.getByRole("heading", { name: "Fixture live" }).waitFor();
          assert.equal(await upcoming.locator(".event-card").filter({ has: publicPage.getByRole("heading", { name: event.title, exact: true }) }).getByText("19:00", { exact: true }).count(), 1);
          assert.equal(await upcoming.getByText("Hidden fixture live", { exact: true }).count(), 0);
          const poster = upcoming.getByRole("img", { name: event.title });
          await poster.scrollIntoViewIfNeeded();
          await publicPage.waitForFunction(() => [...document.querySelectorAll(".event-card-image img")].some((element) => element.naturalWidth > 0));
          assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow on public event page");
          for (const width of [320, 390, 768, 1440]) {
            await publicPage.setViewportSize({ width, height: 844 });
            assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Event page overflow at ${width}px`);
            for (const card of await upcoming.locator(".event-card").all()) {
              assert.equal(await card.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length), width <= 768 ? 1 : await card.locator(".event-card-image").count() ? 3 : 2);
            }
          }
          await publicPage.setViewportSize({ width: 390, height: 844 });
          console.log("Mobile public preview passed: saved title, START and poster render; unpublished fixture is absent.");
          await publicPage.goto(publicBase + "/");
          for (const heading of ["Short mobile heading", "Isolated business hours", "Isolated First Visit heading", "Updated First Visit card", "Isolated visit information", "Isolated access heading"]) {
            await publicPage.getByRole("heading", { name: heading, exact: true }).waitFor();
          }
          await publicPage.getByText("Isolated First Visit description", { exact: true }).waitFor();
          assert.equal(await publicPage.getByText("Isolated directions card description", { exact: true }).count(), 0);
          assert.equal(await publicPage.locator(".hero-slide-1").evaluate((img) => img.currentSrc), mobileImage.url);
          assert.equal(await publicPage.locator(".hero-slide-1").evaluate((img) => getComputedStyle(img).objectPosition), "100% 50%");
          assert.equal(await publicPage.locator(".mobile-cta a").count(), 3);
          assert.equal(await publicPage.locator(".hero-slide-2").evaluate((img) => img.currentSrc), image.url);
          assert.equal(await publicPage.locator(".feature-photo img").first().evaluate((img) => getComputedStyle(img).objectPosition), "50% 0%");
          const publicOrder = await publicPage.locator("main > .managed-section h2").allTextContents();
          assert.ok(publicOrder.indexOf("Isolated custom block") < publicOrder.indexOf("Isolated First Visit heading"));
          await publicPage.setViewportSize({ width: 1440, height: 900 });
          await publicPage.getByRole("heading", { name: "Isolated main heading", exact: true }).waitFor();
          await publicPage.waitForFunction((src) => document.querySelector(".hero-slide-1").currentSrc === src, image.url);
          await publicPage.setViewportSize({ width: 390, height: 844 });
          await publicPage.getByRole("heading", { name: /Isolated social heading/ }).waitFor();
          await publicPage.getByRole("link", { name: "Isolated call" }).waitFor();
          await publicPage.getByRole("link", { name: "Isolated route button" }).waitFor();
          await publicPage.getByText("Isolated footer", { exact: true }).waitFor();
          await publicPage.waitForFunction(() => document.querySelector('img[alt="Isolated header logo"]')?.naturalWidth > 0);
          const homePoster = publicPage.getByRole("img", { name: "Isolated First Visit poster" });
          await homePoster.scrollIntoViewIfNeeded();
          await publicPage.waitForFunction(() => document.querySelector('img[alt="Isolated First Visit poster"]')?.naturalWidth > 0);
          assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow on public TOP");
          console.log("Mobile TOP preview passed: saved section headings, card text and replacement photo render.");
          await publicPage.goto(publicBase+'/menu/');
          const foodButton=publicPage.locator('button[data-gallery="food"]').first();
          await foodButton.click();
          const photoDialog=publicPage.getByRole('dialog',{name:'拡大写真'});
          await photoDialog.waitFor();
          const firstAlt=await photoDialog.locator('img').getAttribute('alt');
          await photoDialog.getByRole('button',{name:'次へ',exact:true}).click();
          assert.notEqual(await photoDialog.locator('img').getAttribute('alt'),firstAlt);
          await publicPage.keyboard.press('ArrowLeft');
          assert.equal(await photoDialog.locator('img').getAttribute('alt'),firstAlt);
          await publicPage.keyboard.press('Escape');
          assert.equal(await photoDialog.count(),0);
          assert.ok(await foodButton.evaluate(el=>el===document.activeElement),'Gallery close returns keyboard focus');
          const dots=publicPage.locator('[data-drink-index]');
          if(await dots.count()>1){
            await publicPage.locator('.drink-menu-sheet-grid').evaluate(track=>{track.scrollTo({left:track.scrollWidth,behavior:'instant'});});
            await publicPage.waitForFunction(()=>document.querySelector('[data-drink-index]:last-child')?.getAttribute('aria-current')==='true');
          }
          for(const width of [320,390,768,1440]){await publicPage.setViewportSize({width,height:900});assert.ok(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Menu overflow at '+width);}
          console.log('Public photo gallery passed: next/previous, keyboard close, focus return, swipe position indicators and responsive layout.');
          await publicPage.close();
        } catch (error) {
          console.error("Public preview failed:", error);
          throw error;
        } finally {
          await browser.close();
          if (publicServer.listening) {
            publicServer.closeAllConnections();
            await new Promise((resolve) => publicServer.close(resolve));
          }
          await publicApp.close();
        }
      }
    } finally {
      await browser.close();
    }
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
