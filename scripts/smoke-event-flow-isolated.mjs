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
const events = new Map([["legacy", { id: "legacy", title: "Earlier title", sourceUrl: legacyUrl, image, isPublished: true }]]);
const notices = new Map();
const slides = new Map();
let calendarItems = [];
let socialUnavailable = false;
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
    const collection = endpoint === "events" ? events : endpoint === "menu" ? notices : endpoint === "hero-slides" ? slides : null;
    assert.ok(collection, "Unexpected fixture CMS endpoint");
    if (method === "GET") {
      if (id) return Response.json(collection.get(id));
      return Response.json({ contents: [...collection.values()], totalCount: collection.size });
    }
    const body = init?.body ?? await input.text();
    if (method === "POST") {
      assert.equal(id, undefined);
      const generatedId = `fixture-${endpoint}-${collection.size + 1}`;
      collection.set(generatedId, { ...JSON.parse(body), id: generatedId });
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

      const eventCanvas = page.frameLocator("iframe.public-canvas-frame");
      const eventTarget = eventCanvas.getByRole("button", { name: "開催イベントを編集" });
      await eventTarget.click();
      await page.getByRole("complementary", { name: "選択箇所の編集" }).getByText("Facebookイベント取り込み", { exact: true }).waitFor();
      await eventCanvas.locator('[data-bassic-edit="event-list"][aria-pressed="true"]').waitFor();
      await page.locator("article").filter({ hasText: "Facebookイベント取り込み" }).getByRole("button", { name: "選ぶ" }).click();
      const panel = page.getByRole("region", { name: "Facebookイベント取り込み" });
      await panel.getByRole("button", { name: "Facebookから読み取る" }).click();
      await panel.getByText("Fixture live", { exact: true }).waitFor();
      await panel.getByRole("button", { name: "登録済みのイベントを編集" }).click();
      await page.getByRole("button", { name: "下書き保存", exact: true }).click();
      await page.getByText(/このブラウザに下書きを保存しました/).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow at mobile width");
      console.log("Mobile admin browser passed: login, Facebook import, existing event selection and draft save.");

      socialUnavailable = false;
      await page.getByRole("button", { name: "プレビューして公開", exact: true }).click();
      await page.getByRole("checkbox", { name: "入力内容、画像、リンク先、公開後の確認項目を見ました。" }).check();
      await page.getByRole("button", { name: "この内容で公開", exact: true }).click();
      await page.getByText("公開サイトに反映されました", { exact: true }).waitFor();
      assert.equal(publishRequests, 2);
      assert.equal(events.get("legacy").title, "Fixture live");
      assert.equal(events.get("legacy").startTime, "11:30");
      assert.deepEqual(events.get("legacy").image, image);
      assert.equal(notices.size, 4);
      console.log("Mobile publication passed: existing event updated, missing image preserved, two drafts created, site status verified.");

      await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
      await page.getByRole("button", { name: "EVENT SCHEDULEへ戻る" }).click();
      assert.equal(await eventTarget.getAttribute("aria-pressed"), "true", "Returning from the editor keeps its section selected");
      await page.getByText("編集箇所一覧", { exact: true }).click();
      await page.getByRole("button", { name: "SNS投稿の下書き", exact: true }).click();
      await eventCanvas.locator('[data-bassic-edit="event-list"][aria-pressed="false"]').waitFor();
      await page.locator("article").filter({ hasText: "SNS投稿の下書き" }).getByRole("button", { name: "選ぶ" }).click();
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
          firstVisitCard1Title: "Isolated music card",
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
        await page.getByRole("button", { name: "Bassic.", exact: true }).click();
        await page.getByRole("button", { name: "TOPページ", exact: true }).click();
        const overview = page.getByRole("region", { name: "TOPの編集セクション" });
        const sectionList = overview.locator("details.visual-editor-section-list");
        if (!(await sectionList.evaluate((element) => element.open))) await sectionList.locator("summary").click();
        await overview.getByText("Isolated custom block", { exact: true }).waitFor();
        const groups = await overview.locator(".page-overview-label strong").allTextContents();
        assert.ok(groups.indexOf("Isolated custom block") < groups.indexOf("初めての方へ"), "Custom block is in public order");
        await overview.getByRole("button", { name: /お店の紹介.*公開ページでは非表示/ }).waitFor();
        const topFrame = page.locator("iframe.public-canvas-frame");
        const heroTarget = topFrame.contentFrame().getByRole("button", { name: "メインビジュアルを編集" });
        await heroTarget.click();
        await page.locator("article").filter({ hasText: "見出し・説明文を変える" }).getByRole("button", { name: "選ぶ" }).click();
        const heroField = page.locator(".editable-field-card").filter({ hasText: "大きな見出し" });
        await heroField.getByText("Isolated main heading", { exact: true }).waitFor();
        await heroField.getByRole("button", { name: "編集" }).click();
        assert.equal(await heroField.getByRole("textbox").inputValue(), "Isolated main heading");
        await page.getByRole("button", { name: "TOPへ戻る" }).click();
        const topTarget = topFrame.contentFrame().getByRole("button", { name: "初めての方へを編集" });
        await topTarget.click();
        const previewScroll = await topTarget.evaluate((element) => element.ownerDocument.defaultView.scrollY);
        assert.ok(previewScroll > 0, "Selecting a lower section scrolls the preview");
        await page.locator("article").filter({ hasText: "紹介カード1を変える" }).getByRole("button", { name: "選ぶ" }).click();
        const center = page.locator(".visual-editor-center");
        await center.getByText("初めての方へ：カード1の画像", { exact: true }).waitFor();
        assert.equal(await topFrame.isVisible(), false, "The editor replaces the center preview");
        await center.getByRole("button", { name: "TOPへ戻る" }).click();
        await topTarget.waitFor();
        assert.equal(await topTarget.evaluate((element) => element.ownerDocument.defaultView.scrollY), previewScroll);
        await page.locator("article").filter({ hasText: "紹介カード1を変える" }).getByRole("button", { name: "選ぶ" }).click();
        const headingCard = page.locator(".editable-field-card").filter({ hasText: "初めての方へ：カード1の見出し" });
        await headingCard.getByRole("button", { name: "編集" }).click();
        await headingCard.getByRole("textbox").fill("Updated First Visit card");
        await page.getByRole("button", { name: "プレビューして公開", exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "スマホ表示", exact: true }).click();
        assert.equal(await page.locator(".device-preview-mobile img").evaluate((element) => element.style.objectPosition), "center top");
        await page.getByRole("checkbox", { name: "入力内容、画像、リンク先、公開後の確認項目を見ました。" }).check();
        const savedHome = page.waitForResponse((response) => response.url() === base + "/api/content/home" && response.request().method() === "POST");
        await page.getByRole("button", { name: "この内容で公開", exact: true }).click();
        assert.ok((await savedHome).ok(), "Saving TOP from its dedicated editor");
        const storedHome = [...notices.values()].find((item) => item.kind === "home");
        assert.equal(JSON.parse(storedHome.body).homeHeroTitle, "", "Opening an inherited field does not save an override");
        events.set("unpublished", { ...event, id: "unpublished", title: "Hidden fixture live", isPublished: false });
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
          assert.equal(await upcoming.getByText("19:00", { exact: true }).count(), 1);
          assert.equal(await upcoming.getByText("Hidden fixture live", { exact: true }).count(), 0);
          const poster = upcoming.getByRole("img", { name: event.title });
          await poster.scrollIntoViewIfNeeded();
          await publicPage.waitForFunction(() => [...document.querySelectorAll(".event-card-image img")].some((element) => element.naturalWidth > 0));
          assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow on public event page");
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
          await publicPage.close();
        } finally {
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
