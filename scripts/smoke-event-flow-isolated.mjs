// Run npm run build:admin-app first. All provider responses stay in memory.
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

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
const bassicArchiveUrl = "https://www.facebook.com/events/5208864859197487/";
const image = { url: "https://images.example.invalid/poster.png" };
const events = new Map([["legacy", { id: "legacy", title: "Earlier title", sourceUrl: legacyUrl }]]);
const notices = new Map();
let calendarItems = [];
let socialUnavailable = false;
let publishRequests = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  if (url.hostname === "127.0.0.1") return realFetch(input, init);

  if (url.hostname === "www.facebook.com") {
    if (url.href === bassicArchiveUrl && process.env.BASSIC_QA_FACEBOOK_READ === "1") return realFetch(input, init);
    if (url.href === newUrl) return new Response("Unavailable", { status: 503 });
    const event = {
      "@type": "Event",
      url: legacyUrl,
      name: "Fixture live",
      startDate: "2027-05-04T19:30:00-07:00",
      description: "18:00 OPEN / 19:00 START"
    };
    return new Response(`<script type="application/ld+json">${JSON.stringify(event)}</script>`);
  }

  if (url.hostname === "bassic-fixture.microcms.io") {
    const [endpoint, id] = url.pathname.split("/").slice(3);
    if (endpoint === "menu" && socialUnavailable) return new Response(null, { status: 503 });
    if (endpoint === "hero-slides" && method === "GET") return Response.json({ contents: [], totalCount: 0 });
    const collection = endpoint === "events" ? events : endpoint === "menu" ? notices : null;
    assert.ok(collection, "Unexpected fixture CMS endpoint");
    if (method === "GET") {
      if (id) return Response.json(collection.get(id));
      return Response.json({ contents: [...collection.values()], totalCount: collection.size });
    }
    assert.equal(method, "PUT");
    if (collection.has(id)) return Response.json({ message: "Content is already exists." }, { status: 400 });
    const body = init?.body ?? await input.text();
    collection.set(id, { ...JSON.parse(body), id });
    return Response.json({ id });
  }

  if (url.hostname === "api.github.com") {
    assert.equal(method, "POST");
    assert.equal(url.pathname, "/repos/fixture/fixture/dispatches");
    publishRequests += 1;
    return new Response(null, { status: 204 });
  }
  if (url.hostname === "oauth2.googleapis.com") return Response.json({ access_token: "fixture" });
  if (url.hostname === "www.googleapis.com") {
    assert.equal(method, "GET");
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
  const login = await post("login", { password });
  cookie = login.response.headers.get("set-cookie").split(";")[0];

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
    console.log("Read-only Facebook archive passed: Bassic event title, date and image candidate.");
  }

  const event = { title: "Isolated live", date: "2027-05-05", startTime: "19:00", image, sourceUrl: newUrl, isPublished: true };
  await post("content/events", { ...event, sourceUrl: legacyUrl }, 409);
  const saved = (await post("content/events", event)).result.data;
  assert.equal(saved.id, "fb-87654321");
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
  console.log("Isolated admin flow passed: Facebook fallback, event and SNS deduplication, staff edits, independent publishing, calendar status.");

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
      await page.getByRole("button", { name: /EVENT SCHEDULE/ }).click();
      await page.locator("article").filter({ hasText: "Facebookイベント取り込み" }).getByRole("button", { name: "編集" }).click();
      const panel = page.getByRole("region", { name: "Facebookイベント取り込み" });
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await panel.getByText("Fixture live", { exact: true }).waitFor();
      await panel.getByRole("button", { name: "登録済みのイベントを編集" }).click();
      await page.getByRole("button", { name: "下書き保存", exact: true }).click();
      await page.getByText(/このブラウザに下書きを保存しました/).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow at mobile width");
      console.log("Mobile admin browser passed: login, Facebook import, existing event selection and draft save.");

      socialUnavailable = false;
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
      await page.getByRole("button", { name: "EVENT SCHEDULEへ戻る" }).click();
      await page.locator("article").filter({ hasText: "SNS投稿の下書き" }).getByRole("button", { name: "編集" }).click();
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

      if (process.env.BASSIC_QA_PUBLIC_SITE === "1") {
        socialUnavailable = false;
        events.set("unpublished", { ...event, id: "unpublished", title: "Hidden fixture live", isPublished: false });
        const publicRequire = createRequire(new URL("../package.json", import.meta.url));
        const publicApp = publicRequire("next")({ dev: true, dir: fileURLToPath(new URL("../", import.meta.url)), hostname: "127.0.0.1" });
        const publicServer = createServer(publicApp.getRequestHandler());
        try {
          await publicApp.prepare();
          await new Promise((resolve) => publicServer.listen(0, "127.0.0.1", resolve));
          const publicBase = `http://127.0.0.1:${publicServer.address().port}`;
          const publicPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
          await publicPage.route("**/*", (route) => {
            const requestUrl = route.request().url();
            if (new URL(requestUrl).origin === publicBase) return route.continue();
            if (requestUrl === image.url) return route.fulfill({
              contentType: "image/svg+xml",
              body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="black"/></svg>'
            });
            return route.abort();
          });
          await publicPage.goto(publicBase + "/events/");
          const upcoming = publicPage.getByRole("region", { name: "開催予定のイベント" });
          await upcoming.getByRole("heading", { name: event.title }).waitFor();
          assert.equal(await upcoming.getByText("19:00", { exact: true }).count(), 1);
          assert.equal(await upcoming.getByText("Hidden fixture live", { exact: true }).count(), 0);
          const poster = upcoming.getByRole("img", { name: event.title });
          await poster.scrollIntoViewIfNeeded();
          await publicPage.waitForFunction(() => [...document.querySelectorAll(".event-card-image img")].some((element) => element.naturalWidth > 0));
          assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow on public event page");
          console.log("Mobile public preview passed: saved title, START and poster render; unpublished fixture is absent.");
          await publicPage.close();
        } finally {
          if (publicServer.listening) await new Promise((resolve) => publicServer.close(resolve));
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
