import assert from "node:assert/strict";

// Runs inside the existing isolated CMS/Google fixture, never against production.
export async function rehearseOperations(context, base) {
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  let statusFailed = true, healthFailed = true;
  await page.route("**/api/ops-status", route => route.fulfill({ status: statusFailed ? 503 : 200, json: statusFailed ? { ok: false } : { ok: true, data: { generatedAt: new Date().toISOString(), alerts: [] } } }));
  await page.route("**/api/operations-health", route => route.fulfill({ status: healthFailed ? 503 : 200, json: healthFailed ? { ok: false } : { ok: true, data: { checkedAt: new Date().toISOString(), ok: false, services: [{ id: "site", label: "公開サイト", state: "ok", message: "表示を確認しました。" }, { id: "calendar", label: "イベントのカレンダー同期", state: "unknown", message: "実行結果を取得できません。" }] } } }));
  await page.goto(base);
  await page.getByRole("heading", { name: "TOPページ", exact: true }).waitFor();
  assert.equal(await page.getByRole("region", { name: "公開・連携の状況" }).count(), 0, "Maintenance checks stay outside normal editing");
  await page.getByRole("button", { name: "詳細設定", exact: true }).click();
  const health = page.getByRole("region", { name: "公開・連携の状況" });
  await health.getByRole("alert").waitFor();
  await page.getByText("確認項目を読み込めませんでした。", { exact: true }).waitFor();
  healthFailed = false;
  await health.getByRole("button", { name: "状況を再確認" }).click();
  await health.getByText("確認済み", { exact: true }).waitFor();
  await health.getByText("確認できません", { exact: true }).waitFor();
  statusFailed = false;
  await page.getByRole("button", { name: "もう一度確認", exact: true }).click();
  await page.getByText("確認項目を読み込めませんでした。", { exact: true }).waitFor({ state: "hidden" });
  await page.screenshot({ path: process.env.TEMP + "/bassic-operations-health.png", fullPage: true });

  const settings = await page.evaluate(async () => (await (await fetch("/api/visual-editor")).json()).data);
  await page.evaluate(value => {
    localStorage.setItem("bassic-visual-deploy-v1", JSON.stringify({ id: crypto.randomUUID(), requestedAt: new Date(Date.now() - 16 * 60000).toISOString(), revision: value.revision }));
  }, settings);
  let polls = 0;
  await page.route("**/api/deploy?*", route => { polls++; return route.fulfill({ json: { ok: true, data: { state: "pending" } } }); });
  await page.goto(base);
  await page.getByText("保存内容は残っています。反映結果を確認できませんでした。公開サイトを確認し、未反映の場合は反映だけをやり直してください。", { exact: true }).waitFor();
  assert.equal(polls, 1, "An expired publication is checked once and must not start another waiting window");
  assert.equal(await page.evaluate(() => localStorage.getItem("bassic-visual-deploy-v1")), null);
  await page.close();
  console.log("Operations: visible read errors, retry, independent statuses and expired publication restoration passed.");
}
