import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const require = createRequire(
  new URL("../admin-app/package.json", import.meta.url),
);
const password = "isolated-visual-editor-fixture";
Object.assign(process.env, {
  ADMIN_PASSWORD: password,
  ADMIN_SESSION_SECRET: password,
  MICROCMS_SERVICE_DOMAIN: "visual-fixture",
  MICROCMS_API_KEY: password,
  GITHUB_OWNER: "fixture",
  GITHUB_REPO: "fixture",
  GITHUB_DISPATCH_TOKEN: password,
});
const menu = new Map([
  [
    "food-one",
    {
      id: "food-one",
      kind: "menu",
      name: "Fixture Food",
      price: "800円",
      category: "food",
      isPublished: true,
    },
  ],
]);
const events = [
  {
    id: "event-one",
    title: "Fixture live",
    date: "2027-02-15",
    startTime: "19:00",
    isPublished: true,
  },
];
const originalFetch = globalThis.fetch;
let writes = 0;
let failReads = false;
let servedRevision = "";
let fixtureRequestId = "";
let fixtureDeployState = "published";
const pdfFiles = new Map();
let pdfWrites = 0;
globalThis.fetch = async (input, init) => {
  const u = new URL(input instanceof Request ? input.url : input);
  if (u.hostname === "127.0.0.1") return originalFetch(input, init);
  if (u.hostname === "api.github.com") {
    if (u.pathname.startsWith("/repos/fixture/fixture/contents/public/assets/pdf/uploads/")) {
      const key = u.pathname;
      if (init?.method === "PUT") {
        const body = JSON.parse(init.body);
        pdfFiles.set(key, Buffer.from(body.content, "base64"));
        pdfWrites++;
        return Response.json({}, { status: 201 });
      }
      return pdfFiles.has(key) ? new Response(pdfFiles.get(key)) : new Response(null, { status: 404 });
    }
    assert.equal(init?.method || "GET", "GET", "Deployment checks must not dispatch real builds");
    if (u.pathname.endsWith("/jobs"))
      return Response.json({ jobs: [{ name: "publish-lolipop-release", steps: fixtureDeployState === "published" ? [{ name: "Confirm release served by the production site", conclusion: "success" }] : [] }] });
    assert.ok(u.pathname.endsWith("/workflows/deploy-pages.yml/runs"));
    return Response.json({ workflow_runs: [{ id: parseInt(fixtureRequestId.slice(0, 8), 16), display_title: "Bassic publish " + fixtureRequestId, status: "completed", conclusion: "success" }] });
  }
  if (u.hostname === "www.bassic.jp")
    return new Response(
      "<html><head><style>" +
        (await readFile(
          new URL("../app/globals.css", import.meta.url),
          "utf8",
        )) +
        '</style></head><body><div data-visual-revision="' +
        servedRevision +
        '"></div></body></html>',
      { headers: { "Content-Type": "text/html" } },
    );
  assert.equal(
    u.hostname,
    "visual-fixture.microcms.io",
    "No real service may be contacted",
  );
  const [endpoint, id] = u.pathname.split("/").slice(3);
  const method = init?.method || "GET";
  if (method === "GET") {
    if (failReads)
      return Response.json(
        { message: "isolated read failure" },
        { status: 503 },
      );
    const items =
      endpoint === "menu"
        ? [...menu.values()]
        : endpoint === "events"
          ? events
          : [];
    if (id) return Response.json(menu.get(id) || {});
    return Response.json({
      contents: items,
      totalCount: items.length,
      offset: 0,
      limit: 100,
    });
  }
  writes++;
  assert.equal(endpoint, "menu");
  const body = JSON.parse(init.body);
  const key = id || "record-" + writes;
  menu.set(key, { ...menu.get(key), ...body, id: key });
  return Response.json({ id: key });
};
const next = require("next");
const app = next({
  dev: false,
  dir: fileURLToPath(new URL("../admin-app/", import.meta.url)),
});
const server = createServer(app.getRequestHandler());
try {
  await app.prepare();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  let cookie = "";
  async function call(path, method = "GET", body, status = 200) {
    const r = await originalFetch(base + "/api/" + path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await r.json();
    assert.equal(r.status, status, JSON.stringify(result));
    return { data: result.data, response: r };
  }
  await call("visual-editor", "GET", null, 401);
  const login = await call("login", "POST", { password });
  cookie = login.response.headers.get("set-cookie").split(";")[0];
  fixtureRequestId = crypto.randomUUID();
  const statusQuery = new URLSearchParams({ id: fixtureRequestId, requestedAt: new Date().toISOString() });
  assert.equal((await call("deploy?" + statusQuery)).data.state, "published");
  fixtureDeployState = "unconfirmed";
  fixtureRequestId = crypto.randomUUID();
  statusQuery.set("id", fixtureRequestId);
  statusQuery.set("requestedAt", new Date(Date.now() + 1).toISOString());
  assert.equal((await call("deploy?" + statusQuery)).data.state, "unconfirmed");
  fixtureDeployState = "published";
  const initial = (await call("visual-editor")).data;
  const realPdf = await readFile(new URL("../public/assets/pdf/equipment-rental-list.pdf", import.meta.url));
  async function sendPdf(file, authorized = true) {
    const body = new FormData();
    body.set("file", file);
    return originalFetch(base + "/api/pdf", { method: "POST", body, headers: authorized ? { Cookie: cookie } : {} });
  }
  assert.equal((await sendPdf(new File([realPdf], "list.pdf"), false)).status, 401);
  assert.equal((await sendPdf(new File(["not a pdf"], "list.pdf"))).status, 400);
  const goodPdf = new File([realPdf], "list.pdf", { type: "application/pdf" });
  const uploadedPdf = await (await sendPdf(goodPdf)).json();
  assert.equal(uploadedPdf.ok, true);
  assert.equal((await sendPdf(goodPdf)).status, 200);
  assert.equal(pdfWrites, 1);
  assert.equal(writes, 0, "PDF preparation must not publish CMS content");
  console.log("PDF API: authenticated upload, invalid-file rejection and duplicate prevention passed in isolation.");
  assert.equal(initial.version, 1);
  const pages = [
    "/",
    "/events/",
    "/menu/",
    "/party/",
    "/access/",
    "/first-visit/",
    ...["en", "ko", "zh-hant", "zh-hans"].flatMap((l) =>
      ["", "events/", "menu/", "party/", "access/"].map(
        (p) => "/" + l + "/" + p,
      ),
    ),
  ];
  const docs = new Map();
  for (const path of pages) {
    const { data } = await call("visual-editor", "POST", {
      path,
      settings: initial,
    });
    const match =
      /<script[^>]*id="bassic-editor-catalog"[^>]*>([\s\S]*?)<\/script>/.exec(
        data.html,
      );
    assert.ok(match, path);
    const catalog = JSON.parse(match[1]);
    assert.ok(catalog.length > 15, path);
    assert.equal(
      new Set(catalog.map((n) => n.id)).size,
      catalog.length,
      "Editing IDs must be unique: " + path,
    );
    docs.set(path, { ...data, catalog });
  }
  assert.equal(writes, 0, "Preview must never save");
  console.log("All 26 pages render editable catalogs without writes.");
  for (const [path, doc] of docs) {
    const text = doc.catalog.find(
      (n) =>
        /^h[1-6]$/.test(n.tag) &&
        Object.keys(n.texts).length &&
        !n.record &&
        !Object.keys(n.sourceTexts || {}).length,
    );
    const image = doc.catalog.find(
      (n) => n.tag === "img" && n.attrs.src && !n.record,
    );
    const link = doc.catalog.find(
      (n) => n.attrs.href && !n.record && !n.sourceAttrs?.href,
    );
    assert.ok(
      text && image && link,
      "Every page needs visible text, image and link controls: " + path,
    );
    const nodes = {
      [text.id]: {
        texts: { [Object.keys(text.texts)[0]]: "Isolated page text" },
        style: { letterSpacing: "2px" },
      },
      [image.id]: {
        attrs: { src: "/assets/fixture-" + encodeURIComponent(path) + ".png" },
      },
      [link.id]: { attrs: { href: "https://example.invalid/page-fixture" } },
    };
    const config = structuredClone(initial);
    config.pages[path] = {
      nodes,
      meta: {
        title: "Fixture title < &",
        description: "Fixture description",
        image: "",
      },
    };
    const changed = (
      await call("visual-editor", "POST", { path, settings: config })
    ).data;
    const markup = changed.html.replace(/<script\b[\s\S]*?<\/script>/g, "");
    assert.ok(
      markup.includes("Isolated page text") &&
        markup.includes("letter-spacing:2px") &&
        markup.includes('src="/assets/fixture-') &&
        markup.includes('href="https://example.invalid/page-fixture"'),
      path,
    );
    assert.ok(
      markup.includes("<title>Fixture title &lt; &amp;</title>"),
      path + " metadata preview",
    );
  }
  console.log(
    "Text, photo, link, appearance and search preview changes passed on every page.",
  );
  const home = docs.get("/");
  assert.ok(
    home.html.includes('href="/events/"'),
    "Public internal links must retain Next trailing-slash behavior",
  );
  assert.ok(
    home.html.includes("通常営業 20:00 OPEN"),
    "Preview must use the public business-hours default, not an old admin-only fallback",
  );
  const business = (await call("content/site-settings")).data;
  assert.equal(
    business.email,
    "mail@bassic.jp",
    "Shared contact defaults must include the existing public email",
  );
  const hours = home.catalog.find((n) =>
    Object.values(n.sourceTexts || {}).includes("hoursLabel"),
  );
  assert.ok(hours);
  assert.ok(
    Object.values(hours.texts).includes(business.hoursLabel),
    "Business information editor and public preview must share defaults",
  );
  const nav = home.catalog.find(
    (n) => n.tag === "nav" && n.attrs["aria-label"] === "主要ナビゲーション",
  );
  const phoneNav = home.catalog.find(
    (n) =>
      n.tag === "nav" &&
      n.attrs["aria-label"] === "スマートフォン用ナビゲーション",
  );
  const navItems = nav.children.filter(
    (id) => home.catalog.find((n) => n.id === id)?.tag === "a",
  );
  const navItem = home.catalog.find((n) => n.id === navItems[0]);
  const mobileItem = phoneNav.id + navItem.id.slice(nav.id.length);
  const navSettings = structuredClone(initial);
  navSettings.shared.nodes[nav.id] = { order: [...navItems].reverse() };
  navSettings.shared.nodes[navItem.id] = {
    texts: { [Object.keys(navItem.texts)[0]]: "Shared navigation fixture" },
  };
  navSettings.shared.nodes[navItems[1]] = { hidden: true };
  const navPreview = (
    await call("visual-editor", "POST", { path: "/", settings: navSettings })
  ).data;
  const navCatalog = JSON.parse(
    /id="bassic-editor-catalog"[^>]*>([\s\S]*?)<\/script>/.exec(
      navPreview.html,
    )[1],
  );
  assert.equal(
    navCatalog.find((n) => n.id === mobileItem).label,
    "Shared navigation fixture",
  );
  assert.equal(
    navCatalog.find(
      (n) => n.id === phoneNav.id + navItems[1].slice(nav.id.length),
    ).hidden,
    true,
  );
  assert.ok(
    navPreview.html.indexOf(
      'data-visual-id="' +
        phoneNav.id +
        navItems.at(-1).slice(nav.id.length) +
        '"',
    ) < navPreview.html.indexOf('data-visual-id="' + mobileItem + '"'),
    "Mobile menu order follows the desktop menu",
  );
  navSettings.shared.nodes[mobileItem] = {
    texts: { [Object.keys(navItem.texts)[0]]: "Mobile navigation fixture" },
  };
  const mobileNavPreview = (
    await call("visual-editor", "POST", { path: "/", settings: navSettings })
  ).data;
  const mobileNavCatalog = JSON.parse(
    /id="bassic-editor-catalog"[^>]*>([\s\S]*?)<\/script>/.exec(
      mobileNavPreview.html,
    )[1],
  );
  assert.equal(
    mobileNavCatalog.find((n) => n.id === navItem.id).label,
    "Shared navigation fixture",
  );
  assert.equal(
    mobileNavCatalog.find((n) => n.id === mobileItem).label,
    "Mobile navigation fixture",
  );
  console.log(
    "Navigation text, visibility and ordering inherit to mobile; explicit mobile changes remain separate.",
  );
  assert.equal(
    (await call("visual-editor", "POST", { path: "/", settings: initial })).data
      .html,
    home.html,
    "Restoring standard settings must restore the original output",
  );
  const heading = home.catalog.find(
    (n) => n.tag === "h2" && Object.keys(n.texts).length,
  );
  assert.ok(heading, JSON.stringify(home.catalog.slice(0, 30)));
  const key = Object.keys(heading.texts)[0];
  const patch = {
    ...initial,
    pages: {
      "/": {
        nodes: {
          [heading.id]: {
            texts: { [key]: "" },
            style: { color: "#123456" },
            mobile: { fontSize: "19px" },
          },
        },
      },
    },
  };
  const preview = (
    await call("visual-editor", "POST", { path: "/", settings: patch })
  ).data;
  assert.ok(
    !preview.html.includes('style="color:#123456" data'),
    "HTML still escapes attributes",
  );
  assert.ok(preview.html.includes("font-size:19px!important"));
  assert.equal(writes, 0);
  const nodeMap = new Map(home.catalog.map((n) => [n.id, n]));
  const group = home.catalog.find(
    (n) =>
      n.children.filter((id) => nodeMap.get(id)?.tag === "article").length >= 2,
  );
  assert.ok(
    group,
    "Cards must be individually editable, not opaque React components",
  );
  const cards = group.children.filter((id) => nodeMap.has(id));
  const cloneId = group.id + ".copy-fixture";
  const blockId = group.id + ".added-fixture";
  const structural = structuredClone(initial);
  structural.pages["/"] = {
    nodes: {
      [group.id]: {
        copies: [{ id: cloneId, source: cards[0] }],
        blocks: [
          { id: blockId, kind: "card", title: "Added fixture", body: "" },
        ],
        order: [blockId, cloneId, ...cards],
      },
      ...Object.fromEntries(cards.map((id) => [id, { hidden: true }])),
    },
  };
  const structure = (
    await call("visual-editor", "POST", { path: "/", settings: structural })
  ).data;
  const structureCatalog = JSON.parse(
    /id="bassic-editor-catalog"[^>]*>([\s\S]*?)<\/script>/.exec(
      structure.html,
    )[1],
  );
  assert.ok(structureCatalog.some((n) => n.id === cloneId));
  assert.ok(structureCatalog.some((n) => n.id === blockId));
  const articleIndex = (id) =>
    structure.html.search(
      new RegExp(
        '<article[^>]*data-visual-id="' + id.replaceAll(".", "\\.") + '"',
      ),
    );
  assert.ok(
    articleIndex(blockId) >= 0 && articleIndex(cloneId) > articleIndex(blockId),
    "New order must render",
  );
  assert.ok(
    cards.every((id) => structureCatalog.find((n) => n.id === id)?.hidden),
    "Zero visible original cards must remain zero",
  );
  const sharedNode = home.catalog.find(
    (n) =>
      n.id.startsWith("shared") &&
      Object.keys(n.texts).length &&
      !Object.keys(n.sourceTexts || {}).length,
  );
  assert.ok(sharedNode);
  const common = structuredClone(initial);
  common.shared.nodes[sharedNode.id] = {
    texts: { [Object.keys(sharedNode.texts)[0]]: "Shared fixture" },
  };
  const commonPage = (
    await call("visual-editor", "POST", { path: "/access/", settings: common })
  ).data;
  assert.ok(
    commonPage.html.includes("Shared fixture"),
    "Common settings must reach other pages",
  );
  const language = (
    await call("visual-editor", "POST", { path: "/en/", settings: patch })
  ).data;
  assert.ok(
    !language.html.includes("font-size:19px!important"),
    "Japanese page styles must not overwrite translations",
  );
  const imageNode = home.catalog.find((n) => n.tag === "img" && n.attrs.src);
  const photo = structuredClone(initial);
  photo.pages["/"] = { nodes: { [imageNode.id]: { attrs: { src: "" } } } };
  const noPhoto = (
    await call("visual-editor", "POST", { path: "/", settings: photo })
  ).data;
  assert.ok(
    !new RegExp(
      '<img[^>]*data-visual-id="' +
        imageNode.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        '"',
    ).test(noPhoto.html),
    "Explicit image removal must stay removed",
  );
  const mobilePhoto = structuredClone(initial);
  mobilePhoto.pages["/"] = {
    nodes: { [imageNode.id]: { mobileImage: "/assets/mobile-fixture.png" } },
  };
  const responsive = (
    await call("visual-editor", "POST", { path: "/", settings: mobilePhoto })
  ).data;
  assert.ok(
    responsive.html.includes('srcSet="/assets/mobile-fixture.png"') ||
      responsive.html.includes('srcset="/assets/mobile-fixture.png"'),
  );
  assert.ok(
    responsive.html.includes(imageNode.attrs.src),
    "Desktop image must remain",
  );
  const cyclic = structuredClone(initial);
  cyclic.pages["/"] = {
    nodes: {
      [group.id]: {
        blocks: [{ id: group.id, kind: "card", title: "Bad", body: "" }],
      },
    },
  };
  await call("visual-editor", "POST", { path: "/", settings: cyclic }, 502);
  assert.equal(writes, 0);
  console.log(
    "Card addition, duplication, order, zero visible cards, shared scope, locale isolation and responsive/removable photos passed.",
  );
  const bad = structuredClone(patch);
  bad.pages["/"].nodes[heading.id].attrs = { href: "javascript:alert(1)" };
  await call("visual-editor", "POST", { path: "/", settings: bad }, 502);
  assert.equal(writes, 0);
  const saved = (
    await call("visual-editor", "PUT", { settings: patch, baseRevision: "" })
  ).data;
  assert.ok(saved.revision);
  assert.equal(writes, 1);
  await call(
    "visual-editor",
    "PUT",
    { settings: patch, baseRevision: "" },
    409,
  );
  assert.equal(writes, 1);
  console.log(
    "Empty text, responsive styles, invalid URL rejection, read-only previews, and revision conflict protection passed.",
  );
  assert.ok(Number.isFinite(Date.parse(saved.savedAt)));
  let latest = saved;
  const versions = [saved.revision];
  for (let index = 0; index < 4; index++) {
    const next = structuredClone(latest);
    next.previous={version:99}; // Client-supplied history must never replace stored snapshots.
    next.pages["/"].nodes[heading.id].texts[key] = "History fixture " + index;
    latest = (
      await call("visual-editor", "PUT", {
        settings: next,
        baseRevision: latest.revision,
      })
    ).data;
    versions.push(latest.revision);
  }
  const previous = [];
  for (let prior = latest.previous; prior; prior = prior.previous) {
    previous.push(prior.revision);
    assert.ok(previous.length <= 3);
  }
  assert.deepEqual(previous, versions.slice(-4, -1).reverse());
  const writesBeforeBrowser = writes;
  console.log(
    "Three previous revisions round-trip through the isolated save API.",
  );
  if (process.env.BASSIC_QA_PLAYWRIGHT) {
    const { chromium } = require(process.env.BASSIC_QA_PLAYWRIGHT);
    const browser = await chromium.launch({
      executablePath: process.env.BASSIC_QA_CHROMIUM,
    });
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      await page.context().addCookies([
        {
          name: cookie.split("=")[0],
          value: cookie.slice(cookie.indexOf("=") + 1),
          url: base,
        },
      ]);
      await page.goto(base);
      await page
        .getByRole("heading", { name: "TOPページ", exact: true })
        .waitFor();
      page.setDefaultTimeout(8000);

      await page.screenshot({
        path: process.env.TEMP + "/bassic-full-editor-initial.png",
      });
      const frame = page.frameLocator("iframe.public-canvas-frame");
      const editableHeading = home.catalog.find(
        (n) =>
          n.tag === "h2" && n.id !== heading.id && Object.keys(n.texts).length,
      );
      await frame
        .locator('[data-bassic-edit="' + editableHeading.id + '"]')
        .click();
      const beforeScroll = await frame.locator("body").evaluate(() => scrollY);
      assert.ok(beforeScroll > 0, "Fixture must exercise scrolling");
      await page
        .getByRole("complementary")
        .getByRole("button", {
          name: editableHeading.label.replace(/\s+/g, " "),
          exact: true,
        })
        .click();
      const form = page.locator(".visual-direct-form");
      const advanced = page.locator(".visual-advanced-controls");
      assert.equal(
        await advanced.getAttribute("open"),
        null,
        "Daily editing hides advanced settings",
      );
      await advanced.getByText("詳細な調整", { exact: true }).click();
      await advanced.getByText("見た目", { exact: true }).click();
      assert.equal(
        await advanced
          .locator('[data-visual-target="' + editableHeading.id + '"]')
          .first()
          .isVisible(),
        true,
        "Advanced appearance settings remain reachable",
      );
      await advanced.getByText("詳細な調整", { exact: true }).click();
      assert.equal(
        await page
          .getByRole("complementary")
          .getByRole("button", {
            name: editableHeading.label.replace(/\s+/g, " "),
            exact: true,
          })
          .getAttribute("aria-pressed"),
        "true",
      );
      await form.locator("textarea").first().fill("未掲載の文章");
      let warned = false;
      page.once("dialog", async (dialog) => {
        warned = true;
        await dialog.dismiss();
      });
      await page
        .getByRole("navigation", { name: "編集するページ" })
        .getByRole("button", { name: "MENU", exact: true })
        .click();
      assert.ok(warned, "Leaving unsaved changes must ask");
      assert.equal(
        await form.locator("textarea").first().inputValue(),
        "未掲載の文章",
      );
      assert.equal(
        await form.getByRole("button", { name: "編集", exact: true }).count(),
        0,
      );
      assert.equal(await page.getByRole("button", { name: "この端末に保存", exact: true }).count(),0);
      await page
        .getByRole("button", { name: "掲載前に確認", exact: true })
        .click();
      await page
        .getByRole("button", { name: "サイトに掲載", exact: true })
        .waitFor();
      await frame.getByText("未掲載の文章", { exact: true }).waitFor();
      const changeSummary = page.getByRole("region", {
        name: "掲載する変更",
        exact: true,
      });
      await changeSummary
        .getByRole("heading", { name: "今回の変更", exact: true })
        .waitFor();
      await changeSummary.locator('li > strong').filter({hasText:'TOPページ'}).first().waitFor();
      await changeSummary.getByText("変更内容を見る", { exact: true }).click();
      await changeSummary
        .getByText("変更後：未掲載の文章", { exact: true })
        .waitFor();
      assert.equal(
        writes,
        writesBeforeBrowser,
        "Reviewing differences must not save",
      );
      await changeSummary.getByText("変更内容を見る", { exact: true }).click();
      await page.waitForFunction((expected) => {
        const frame = document.querySelector("iframe.public-canvas-frame");
        return (
          frame?.contentWindow &&
          Math.abs(frame.contentWindow.scrollY - expected) < 100
        );
      }, beforeScroll);
      await page
        .getByRole("button", { name: "スマホ表示", exact: true })
        .click();
      assert.equal(
        await page
          .locator("iframe.public-canvas-frame")
          .evaluate((el) => el.classList.contains("phone")),
        true,
      );
      await page.getByRole("button", { name: "PC表示", exact: true }).click();
      assert.equal(
        writes,
        writesBeforeBrowser,
        "UI preview must not touch the CMS",
      );
      await page.screenshot({
        path: process.env.TEMP + "/bassic-full-editor-desktop.png",
      });
      console.log(
        "Direct editing, no device save, exact unsaved preview and no publication writes passed.",
      );

      failReads = true;
      const failed = await page.context().newPage();
      await failed.goto(base);
      await failed
        .getByRole("alert")
        .filter({ hasText: "設定を読み込めませんでした" })
        .waitFor();
      assert.equal(
        await failed
          .getByRole("button", { name: "サイトに掲載", exact: true })
          .count(),
        0,
      );
      await failed.close();
      failReads = false;
      let deployMode = "fail";
      await page.route("**/api/deploy*", async (route) => {
        if (route.request().method() === "POST" && deployMode === "fail")
          return route.fulfill({
            status: 502,
            json: { ok: false, message: "隔離テスト：掲載に失敗しました" },
          });
        if (route.request().method() === "POST") {
          fixtureRequestId = crypto.randomUUID();
          return route.fulfill({ json: { ok: true, data: { requestId: fixtureRequestId, requestedAt: new Date().toISOString() } } });
        }
        // Exercise the real status API and GitHub response parser, rather than
        // inventing a terminal state in the browser mock.
        const response = await originalFetch(route.request().url(), { headers: { Cookie: cookie } });
        return route.fulfill({ status: response.status, json: await response.json() });
      });
      let releaseSave, saveEntered;
      const saveGate = new Promise((resolve) => {
        releaseSave = resolve;
      });
      const saveStarted = new Promise((resolve) => {
        saveEntered = resolve;
      });
      await page.route("**/api/visual-editor", async (route) => {
        if (route.request().method() === "PUT") {
          saveEntered();
          await saveGate;
        }
        await route.continue();
      });
      await page
        .getByRole("button", { name: "サイトに掲載", exact: true })
        .evaluate((button) => {
          button.click();
          button.click();
        });
      await saveStarted;
      try {
        assert.equal(
          await page
            .locator(".visual-page-options-fields")
            .evaluate((el) => el.disabled),
          true,
          "Global appearance and metadata cannot change during saving",
        );
        assert.equal(await page.getByRole("button",{name:"端末の下書きを開く",exact:true}).count(),0);
        await page
          .getByRole("complementary")
          .getByRole("button", { name: "未掲載の文章", exact: true })
          .click();
        assert.equal(
          await page
            .locator(".visual-direct-form textarea")
            .first()
            .isDisabled(),
          true,
          "Saving locks inputs so a late response cannot overwrite new typing",
        );
      } finally {
        releaseSave();
      }
      await page
        .getByRole("alert")
        .filter({ hasText: "隔離テスト：掲載に失敗しました" })
        .waitFor();
      assert.equal(
        writes,
        writesBeforeBrowser + 1,
        "A double click must save one revision only",
      );
      deployMode = "success";
      fixtureDeployState = "unconfirmed";
      await page.getByRole("button", { name: "保存済みの内容を再反映", exact: true }).click();
      await page.getByRole("alert").filter({ hasText: "公開処理は完了しましたが" }).waitFor();
      assert.equal(writes, writesBeforeBrowser + 1, "Unconfirmed completion must stop polling without saving again");
      fixtureDeployState = "published";
      await page
        .getByRole("button", { name: "保存済みの内容を再反映", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "保存した版の表示を確認できませんでした" })
        .waitFor();
      assert.equal(
        writes,
        writesBeforeBrowser + 1,
        "A deployment retry must not save again",
      );
      servedRevision = JSON.parse(
        [...menu.values()].find((item) => item.kind === "visual-editor").body,
      ).revision;
      await page
        .getByRole("button", { name: "保存済みの内容を再反映", exact: true })
        .click();
      await page
        .getByRole("status", { name: "編集と掲載の状態" })
        .filter({ hasText: "サイトに反映済み" })
        .waitFor();
      assert.equal(
        await page
          .getByRole("link", { name: "掲載したページを確認", exact: true })
          .getAttribute("href"),
        "https://www.bassic.jp/",
      );
      assert.equal(writes, writesBeforeBrowser + 1);
      console.log(
        "Publication double-click protection, failure recovery, deployment-only retries and served-revision verification passed.",
      );
      const clonePage = await context.newPage();
      clonePage.setDefaultTimeout(8000);
      await clonePage.goto(base);
      await clonePage
        .getByRole("navigation", { name: "編集するページ" })
        .getByRole("button", { name: "イベントスケジュール", exact: true })
        .click();
      const eventDoc = docs.get("/events/");
      assert.equal(eventDoc.catalog.some(n=>n.record === "events:event-one"),false,"Events use the calendar, not independent cards");
      await clonePage.frameLocator("iframe.public-canvas-frame").getByText(/ここでは配置だけ/).waitFor();
      assert.equal(await clonePage.frameLocator("iframe.public-canvas-frame").locator("iframe[src*='calendar.google.com']").count(),0,"Sandbox preview must not leave a spinning Google frame");
      await clonePage.close();
      const cardPage = await context.newPage();
      cardPage.setDefaultTimeout(8000);
      await cardPage.goto(base);
      const cardTitle = home.catalog.find(
        (n) => n.id.startsWith(cards[0] + ".") && n.tag === "h3",
      );
      assert.ok(cardTitle);
      const cardFrame = cardPage.frameLocator("iframe.public-canvas-frame");
      await cardFrame
        .locator('[data-bassic-edit="' + cardTitle.id + '"]')
        .press("Enter");
      await cardPage
        .getByRole("complementary")
        .getByRole("button", { name: cardTitle.label, exact: true })
        .click();
      await cardPage
        .locator(".visual-direct-form textarea")
        .first()
        .fill("Edited card snapshot");
      await cardPage
        .getByRole("button", { name: "ひとつ上へ", exact: true })
        .click();
      await cardPage
        .getByRole("button", { name: "ひとつ上へ", exact: true })
        .click();
      await cardPage
        .getByRole("complementary")
        .getByText("カード", { exact: true })
        .click();
      await cardPage
        .getByRole("complementary")
        .locator('[data-visual-target="' + group.id + '"]:visible')
        .click();
      await cardPage
        .locator(".visual-child-row")
        .first()
        .getByRole("button", { name: "複製", exact: true })
        .click();
      await cardPage
        .getByRole("button", { name: "掲載前に確認", exact: true })
        .click();
      await cardFrame
        .getByText("Edited card snapshot", { exact: true })
        .first()
        .waitFor();
      assert.equal(
        await cardFrame
          .getByText("Edited card snapshot", { exact: true })
          .count(),
        2,
        "Duplicate cards must retain the edited text",
      );
      assert.equal(
        await cardFrame.locator(".feature-photo img").count(),
        4,
        "Duplicate cards retain their photo",
      );
      assert.equal(
        writes,
        writesBeforeBrowser + 1,
        "Duplicating static cards and previewing must not save",
      );
      await cardPage.close();
      const historyPage = await context.newPage();
      historyPage.setDefaultTimeout(8000);
      await historyPage.goto(base);
      await historyPage
        .getByText("ページ全体・検索表示", { exact: true })
        .click();
      await historyPage
        .getByText("以前のページ設定を開く（最大3回）", { exact: true })
        .click();
      assert.equal(
        await historyPage.locator(".visual-history button").count(),
        3,
      );
      historyPage.once("dialog", (dialog) => dialog.accept());
      await historyPage.locator(".visual-history button").first().click();
      await historyPage
        .getByText("以前の設定を開きました。まだ掲載されていません。", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        writes,
        writesBeforeBrowser + 1,
        "Opening history must not save or publish",
      );
      await historyPage
        .getByRole("button", { name: "掲載前に確認", exact: true })
        .click();
      await historyPage
        .getByRole("region", { name: "掲載する変更", exact: true })
        .waitFor();
      assert.equal(
        await historyPage
          .frameLocator("iframe.public-canvas-frame")
          .getByText("未掲載の文章", { exact: true })
          .count(),
        0,
        "The previous saved text is restored in the unpublished preview",
      );
      assert.equal(writes, writesBeforeBrowser + 1);
      await historyPage.close();
      const pdfPage = await context.newPage();
      await pdfPage.goto(base);
      await pdfPage.getByRole("button", { name: "PARTY & RENTAL", exact: true }).click();
      const pdfFrame = pdfPage.frameLocator("iframe.public-canvas-frame");
      const pdfNode = docs.get("/party/").catalog.find(n => n.attrs.href?.includes("equipment-rental-list.pdf"));
      await pdfFrame.locator('[data-bassic-edit="' + pdfNode.id + '"]').click();
      const pdfSidebar = pdfPage.locator(".visual-editor-sidebar");
      await pdfSidebar.getByText("ボタン・リンク", { exact: true }).click();
      await pdfSidebar.getByText("ボタン・リンク", { exact: true }).locator("..").locator('[data-visual-target="' + pdfNode.id + '"]').click();
      const pdfField = pdfPage.locator(".pdf-field");
      await pdfField.locator('input[type="file"]').setInputFiles({ name: "updated.pdf", mimeType: "application/pdf", buffer: realPdf });
      await pdfField.getByRole("status").waitFor();
      assert.equal(await pdfField.getByRole("link", { name: "PDFを開いて確認" }).getAttribute("href"), uploadedPdf.data.url);
      await pdfPage.screenshot({ path: process.env.TEMP + "/bassic-pdf-editor.png", fullPage: true });
      await pdfField.locator('input[type="file"]').setInputFiles({ name: "invalid.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a PDF") });
      await pdfField.getByRole("alert").waitFor();
      assert.equal(await pdfField.getByRole("link", { name: "PDFを開いて確認" }).getAttribute("href"), uploadedPdf.data.url, "Failed uploads preserve the current PDF");
      assert.equal(writes, writesBeforeBrowser + 1, "Selecting PDF must not publish CMS content");
      await pdfPage.getByRole("button", { name: "掲載前に確認", exact: true }).click();
      await pdfPage.getByRole("region", { name: "掲載する変更", exact: true }).waitFor();
      assert.equal(await pdfPage.frameLocator("iframe.public-canvas-frame").locator("a.equipment-rental-link").getAttribute("href"), uploadedPdf.data.url);
      console.log("PDF browser: choose file, confirm link and unpublished page preview passed.");
      await pdfPage.close();
      const legacyPdfPage = await context.newPage();
      await legacyPdfPage.goto(base);
      await legacyPdfPage.getByRole("button", { name: "PARTY & RENTAL", exact: true }).click();
      await legacyPdfPage.locator(".visual-editor-sidebar").getByText("登録情報・非表示の項目", { exact: true }).click();
      await legacyPdfPage.getByRole("button", { name: "機材・PDF", exact: true }).click();
      const legacyPdfField = legacyPdfPage.locator(".pdf-field");
      await legacyPdfField.locator('input[type="file"]').setInputFiles({ name: "list.pdf", mimeType: "application/pdf", buffer: realPdf });
      await legacyPdfField.getByRole("status").waitFor();
      assert.equal(await legacyPdfField.getByRole("link", { name: "PDFを開いて確認" }).getAttribute("href"), uploadedPdf.data.url);
      assert.equal(writes, writesBeforeBrowser + 1);
      await legacyPdfPage.close();
      console.log("PDF registration form uses the same upload flow without publishing.");
      await context.route("https://calendar.google.com/**", route => route.fulfill({ status: 200, contentType: "text/html", body: "Isolated Google calendar draft" }));
      const closedPage = await context.newPage();
      await closedPage.goto(base);
      await closedPage.getByText("Googleカレンダーの更新", { exact: true }).waitFor();
      assert.equal(await closedPage.getByText("FacebookのURLから始める", { exact: true }).count(), 0);
      await closedPage.getByRole("button", { name: "店休日を追加", exact: true }).click();
      const closedForm = closedPage.locator(".closed-day-form");
      const closedSave = closedForm.getByRole("button", { name: "Googleカレンダーで保存", exact: true });
      await closedSave.click();
      await closedForm.getByRole("alert").waitFor();
      await closedForm.getByLabel("店休日").fill("2026-12-31");
      let [calendarDraft] = await Promise.all([closedPage.waitForEvent("popup"), closedSave.click()]);
      await calendarDraft.waitForLoadState();
      assert.equal(new URL(calendarDraft.url()).searchParams.get("dates"), "20261231/20270101");
      assert.equal(new URL(calendarDraft.url()).searchParams.get("text"), "店休日");
      assert.ok(new URL(calendarDraft.url()).searchParams.get("src"));
      await calendarDraft.close();
      await closedForm.getByRole("status").waitFor();
      assert.match(await closedForm.getByRole("status").innerText(), /まだ保存完了は確認できていません/);
      await closedForm.getByText("連休・メモ", { exact: true }).click();
      await closedForm.getByLabel("連休の最終日", { exact: true }).fill("2026-12-30");
      await closedSave.click();
      await closedForm.getByRole("alert").waitFor();
      assert.equal(await closedForm.getByLabel("店休日").inputValue(), "2026-12-31");
      await closedForm.getByLabel("連休の最終日", { exact: true }).fill("2027-01-02");
      await closedForm.getByLabel("メモ", { exact: true }).fill("年末年始のお休み");
      [calendarDraft] = await Promise.all([closedPage.waitForEvent("popup"), closedSave.click()]);
      await calendarDraft.waitForLoadState();
      assert.equal(new URL(calendarDraft.url()).searchParams.get("dates"), "20261231/20270103");
      assert.equal(new URL(calendarDraft.url()).searchParams.get("details"), "年末年始のお休み");
      await calendarDraft.close();
      closedPage.once("dialog", dialog => dialog.dismiss());
      await closedPage.getByRole("button", { name: "MENU", exact: true }).click();
      assert.equal(await closedForm.getByLabel("店休日").inputValue(), "2026-12-31");
      assert.equal(writes, writesBeforeBrowser + 1, "Closed-day drafts must not save or publish provider content");
      await closedPage.screenshot({ path: process.env.TEMP + "/bassic-closed-days.png", fullPage: true });
      await closedPage.close();
      console.log("Closed days: sidebar, all-day single/range drafts, error retention and unsaved-navigation guard passed without Google writes.");
      console.log(
        "Edited card duplication and history restoration preserve unpublished content without CMS writes.",
      );
    } finally {
      await browser.close();
    }
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch;
  await new Promise((r) => server.close(r));
  await app.close();
}
