import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.BASSIC_QA_PLAYWRIGHT || "playwright");
const baseURL = process.env.BASSIC_QA_ADMIN_URL || "http://127.0.0.1:3108";
const browser = await chromium.launch({ executablePath: process.env.BASSIC_QA_CHROMIUM });
const page = await browser.newPage({ baseURL, viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(10000);
let writes = 0;

try {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") {
      writes++;
      return route.fulfill({ status: 403 });
    }
    if (path === "/api/session") return route.fulfill({ json: { authenticated: true } });
    if (path === "/api/health") return route.fulfill({ json: { ok: true } });
    if (path === "/api/ops-status") return route.fulfill({ status: 503 });
    if (path === "/api/site-preview") return route.fulfill({ json: {
      url: "https://www.bassic.jp/",
      html: '<section class="page-hero" style="height:1800px">Hero</section><section class="intro"><h2>初めての方へ</h2></section>'
    } });
    const objectData = {
      home: { firstVisitTitle: "現在の見出し", firstVisitDescription: "現在の説明文", firstVisitCard1Title: "現在のカード1", firstVisitCard3Image: { url: "https://www.bassic.jp/assets/missing-fixture.jpg" } },
      "site-settings": {}
    };
    return route.fulfill({ json: { ok: true, data: objectData[path.split("/").at(-1)] || { contents: [] } } });
  });
  await page.route("https://www.bassic.jp/assets/**", (route) => {
    if (route.request().url().includes("missing-fixture")) return route.fulfill({ status: 404 });
    return route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="54"><rect width="60" height="54" fill="brown"/></svg>' });
  });

  await page.goto("/");
  const target = page.frameLocator("iframe.public-canvas-frame").getByRole("button", { name: "初めての方へを編集" });
  await target.click();
  const scroll = await target.evaluate((element) => element.ownerDocument.defaultView.scrollY);
  assert.ok(scroll > 0);
  const sidebar = page.getByRole("complementary", { name: "選択箇所の編集" });
  await sidebar.getByText("現在の見出し", { exact: true }).waitFor();
  await sidebar.getByText("現在の説明文", { exact: true }).waitFor();
  const card = (number) => sidebar.getByRole("button", { name: new RegExp("紹介カード" + number + "を変える") });
  await card(1).getByText("現在のカード1", { exact: true }).waitFor();
  await card(2).getByText("ノンアルコールでも、お食事だけでも。", { exact: true }).waitFor();
  await card(3).getByText("画像を表示できません").waitFor();
  await card(1).locator("img").evaluate((image) => image.decode());
  await card(2).locator("img").evaluate((image) => image.decode());
  await card(2).click();
  const form = page.locator(".visual-editor-form");
  assert.equal(await page.getByLabel("現在の編集場所").textContent(), "TOPページ → 初めての方へ → 紹介カード2を変える");
  await form.getByRole("heading", { name: "紹介カード2を変える", exact: true }).waitFor();
  assert.equal(await card(2).getAttribute("aria-pressed"), "true");
  const title = form.locator(".editable-field-card").filter({ hasText: "カード2の見出し" });
  await title.getByRole("button", { name: "編集" }).click();
  assert.equal(await title.getByRole("textbox").inputValue(), "ノンアルコールでも、お食事だけでも。");
  await title.getByRole("textbox").fill("保存していない編集");
  const cancelled = page.waitForEvent("dialog").then((dialog) => dialog.dismiss());
  await Promise.all([cancelled, card(1).click()]);
  assert.equal(await card(2).getAttribute("aria-pressed"), "true");
  const discarded = page.waitForEvent("dialog").then((dialog) => dialog.accept());
  await Promise.all([discarded, form.getByRole("button", { name: "TOPへ戻る" }).click()]);
  await target.waitFor();
  assert.equal(await target.evaluate((element) => element.ownerDocument.defaultView.scrollY), scroll);
  assert.equal(writes, 0);
  console.log("Admin editor preview passed: current text, thumbnails, missing image, selected form, unsaved guard, preserved scroll.");
} finally {
  await browser.close();
}
