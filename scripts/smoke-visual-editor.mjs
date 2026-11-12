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
globalThis.fetch = async (input, init) => {
  const u = new URL(input instanceof Request ? input.url : input);
  if (u.hostname === "127.0.0.1") return originalFetch(input, init);
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
  const initial = (await call("visual-editor")).data;
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
      await page
        .getByRole("button", { name: "この端末に保存", exact: true })
        .click();
      await page
        .getByRole("button", { name: "掲載前に確認", exact: true })
        .click();
      await page
        .getByRole("button", { name: "サイトに掲載", exact: true })
        .waitFor();
      await frame.getByText("未掲載の文章", { exact: true }).waitFor();
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
        1,
        "UI preview and local saves must not touch the CMS",
      );
      await page.screenshot({
        path: process.env.TEMP + "/bassic-full-editor-desktop.png",
      });
      console.log(
        "Direct editing, local draft save, exact unsaved preview and no publication writes passed.",
      );
      const restored = await page.context().newPage();
      await restored.goto(base);
      await restored
        .getByRole("button", { name: "端末の下書きを開く", exact: true })
        .waitFor();
      restored.once("dialog", (dialog) => dialog.accept());
      await restored
        .getByRole("button", { name: "端末の下書きを開く", exact: true })
        .click();
      const restoredFrame = restored.frameLocator("iframe.public-canvas-frame");
      await restoredFrame.getByText("未掲載の文章", { exact: true }).waitFor();
      await restored.route("**/api/visual-editor", (route) =>
        route.request().method() === "POST"
          ? route.fulfill({
              status: 502,
              json: {
                ok: false,
                message: "隔離テスト：プレビューを取得できません",
              },
            })
          : route.continue(),
      );
      await restored
        .getByRole("button", { name: "掲載前に確認", exact: true })
        .click();
      await restored
        .getByRole("alert")
        .filter({ hasText: "隔離テスト" })
        .waitFor();
      await restored.waitForFunction(() =>
        document.activeElement?.classList.contains("editor-feedback"),
      );
      assert.equal(
        await restored
          .getByRole("button", { name: "サイトに掲載", exact: true })
          .count(),
        0,
        "Failed preview must not enable publishing",
      );
      assert.equal(writes, 1, "Restore and failed previews must not write");
      console.log(
        "Unsaved navigation, device switching, local draft restoration and preview failure focus passed.",
      );
      await restored.close();
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
      await page.route("**/api/deploy*", (route) => {
        if (route.request().method() === "POST" && deployMode === "fail")
          return route.fulfill({
            status: 502,
            json: { ok: false, message: "隔離テスト：掲載に失敗しました" },
          });
        return route.fulfill({
          json: {
            ok: true,
            data:
              route.request().method() === "POST"
                ? {
                    requestId: crypto.randomUUID(),
                    requestedAt: new Date().toISOString(),
                  }
                : { state: "success" },
          },
        });
      });
      await page
        .getByRole("button", { name: "サイトに掲載", exact: true })
        .evaluate((button) => {
          button.click();
          button.click();
        });
      await page
        .getByRole("alert")
        .filter({ hasText: "隔離テスト：掲載に失敗しました" })
        .waitFor();
      assert.equal(writes, 2, "A double click must save one revision only");
      deployMode = "success";
      await page
        .getByRole("button", { name: "保存済みの内容を再反映", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "保存した版の表示を確認できませんでした" })
        .waitFor();
      assert.equal(writes, 2, "A deployment retry must not save again");
      servedRevision = JSON.parse(
        [...menu.values()].find((item) => item.kind === "visual-editor").body,
      ).revision;
      await page
        .getByRole("button", { name: "保存済みの内容を再反映", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "サイトに反映済み" })
        .waitFor();
      assert.equal(writes, 2);
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
      const eventCard = eventDoc.catalog.find(
        (n) => n.tag === "article" && n.record === "events:event-one",
      );
      assert.ok(eventCard);
      await clonePage
        .frameLocator("iframe.public-canvas-frame")
        .locator('[data-bassic-edit="' + eventCard.parent + '"]')
        .press("Enter");
      await clonePage
        .getByRole("complementary")
        .getByText("カード", { exact: true })
        .click();
      await clonePage
        .getByRole("complementary")
        .getByRole("button", { name: "Fixture live", exact: true })
        .click();
      await clonePage
        .locator(".visual-child-row")
        .getByRole("button", { name: "複製", exact: true })
        .click();
      await clonePage.getByRole('heading',{name:"複製したカード",exact:true}).waitFor();
      await clonePage.locator("input#title").waitFor();
      assert.equal(
        await clonePage.locator("input#title").inputValue(),
        "Fixture live",
      );
      assert.equal(
        writes,
        2,
        "Duplicating a registered card must open an unpublished draft without saving",
      );
      await clonePage.close();
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
