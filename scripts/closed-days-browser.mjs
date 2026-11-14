import assert from "node:assert/strict";
import { monthRange, shiftDay } from "../lib/closed-days-view.mjs";

export async function rehearseClosedDays(context, base) {
  const page = await context.newPage();
  const unusedPreviewRequests = [];
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/site-preview") unusedPreviewRequests.push(request.url()); });
  const current = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
  const next = monthRange(current).end.slice(0, 7);
  const items = new Map();
  const calls = [];
  let failedRead = false, partial = false, loseReply = false, writable = true;
  function seed(month) {
    if (items.has(month)) return;
    items.set(month, [
      { id: "holiday-" + month, etag: '"old"', title: "定休日", start: month + "-05", end: month + "-06", editable: true, recurring: false },
      { id: "live-" + month, etag: '"live"', title: "Live show", start: month + "-06", end: month + "-07", editable: false, recurring: false }
    ]);
  }
  await page.route("**/api/closed-days**", async route => {
    const request = route.request(), month = new URL(request.url()).searchParams.get("month");
    if (request.method() === "GET") {
      if (failedRead) return route.fulfill({ status: 502, json: { ok: false, message: "予定を読み込めませんでした。" } });
      seed(month); return route.fulfill({ json: { ok: true, data: { month, canWrite: writable, events: items.get(month) } } });
    }
    const body = request.postDataJSON(); calls.push(body);
    const results = body.changes.map((change, i) => {
      if (partial && i === body.changes.length - 1) return { date: change.date, state: "failed", message: "この日の取り消しは未完了です。" };
      const month = change.date.slice(0, 7); seed(month);
      let events = items.get(month);
      if (change.action === "add" && !events.some(e => e.editable && e.start === change.date)) events.push({ id: "added-" + change.date, etag: '"new"', title: "店休日", start: change.date, end: shiftDay(change.date, 1), editable: true, recurring: false });
      if (change.action === "remove") events = events.filter(e => !change.events.some(old => old.id === e.id));
      items.set(month, events);
      return { date: change.date, state: "applied" };
    });
    if (loseReply) { loseReply = false; return route.abort(); }
    return route.fulfill({ json: { ok: true, data: { results } } });
  });
  try {
    await page.goto(base);
    await page.getByRole("button", { name: "店休日を追加", exact: true }).click();
    const panel = page.getByRole("region", { name: "店休日カレンダー", exact: true });
    const date = value => panel.getByRole("button", { name: new RegExp("^" + value + " ") });
    await date(current + "-05").waitFor();
    await panel.getByText("Live show", { exact: true }).waitFor();
    assert.equal(await panel.getByRole("button", { name: "Googleカレンダーで保存" }).count(), 0);
    await date(current + "-10").click(); await date(current + "-10").click();
    assert.equal(await panel.getByRole("region", { name: "選択した変更" }).count(), 0, "Clicking twice clears an unsubmitted selection");
    // Select a whole cell, including its lower empty area, and return from review.
    const liveDay = date(current + "-06");
    const box = await liveDay.boundingBox();
    await liveDay.click({ position: { x: box.width - 8, y: box.height - 8 } });
    assert.equal(await liveDay.getAttribute("aria-pressed"), "true");
    const beforeReview = await page.evaluate(() => window.scrollY);
    await panel.getByRole("button", { name: "変更を反映", exact: true }).click();
    const review = panel.getByRole("region", { name: "店休日の変更確認", exact: true });
    await review.getByText("ほかの予定あり", { exact: true }).waitFor();
    await review.screenshot({ path: process.env.TEMP + "/bassic-closed-calendar-review.png" });
    await review.getByRole("button", { name: "戻る", exact: true }).click();
    await page.waitForFunction(y => Math.abs(window.scrollY - y) < 70, beforeReview);
    await liveDay.press("Space");
    assert.equal(await liveDay.getAttribute("aria-pressed"), "false");
    assert.equal(calls.length, 0, "Reviewing and cancelling must not send changes");
    await date(current + "-10").click();
    await panel.getByRole("button", { name: "翌月", exact: true }).click();
    await date(next + "-03").click();
    await panel.getByRole("button", { name: "前月", exact: true }).click();
    assert.match(await date(current + "-10").innerText(), /追加予定/);
    await date(current + "-05").click();
    assert.match(await date(current + "-05").innerText(), /取り消し予定/);
    const apply = async () => {
      await panel.getByRole("button", { name: /^(変更を反映|未完了分を再確認)$/ }).click();
      await panel.getByRole("region", { name: "店休日の変更確認", exact: true }).waitFor();
      await panel.getByRole("button", { name: "この内容で反映", exact: true }).click();
    };
    await apply();
    await panel.getByText("反映済みです。", { exact: true }).waitFor();
    await date(current + "-10").waitFor();
    assert.equal(calls[0].changes.length, 3);
    assert.equal(calls[0].changes.find(c => c.date === current + "-05").action, "remove");
    assert.ok(items.get(current).some(e => e.title === "Live show"));
    assert.equal(await panel.getByRole("region", { name: "選択した変更" }).count(), 0);
    // Partial success: the successful date disappears from retries.
    await date(current + "-12").click(); await date(current + "-13").click(); partial = true;
    await apply(); await panel.getByRole("alert").waitFor();
    await panel.getByText("1日選択中", { exact: true }).waitFor();
    assert.equal(await date(current + "-12").isDisabled(), true, "Do not mix new edits into an unresolved operation");
    partial = false; await apply(); await panel.getByText("反映済みです。", { exact: true }).waitFor();
    assert.deepEqual(calls.at(-1).changes.map(c => c.date), [current + "-13"]);
    assert.equal(calls.at(-1).operation, calls.at(-2).operation);
    // A lost response retains the operation and selection across refresh.
    await date(current + "-16").click(); loseReply = true;
    await apply(); await panel.getByRole("alert").waitFor();
    const operation = calls.at(-1).operation;
    assert.equal(await panel.getByRole("button", { name: "選択をクリア", exact: true }).isDisabled(), true);
    page.once("dialog", dialog => dialog.accept()); await page.reload();
    await page.getByRole("button", { name: "店休日を追加", exact: true }).click();
    await panel.getByText("1日選択中", { exact: true }).waitFor();
    await apply(); await panel.getByText("反映済みです。", { exact: true }).waitFor();
    assert.equal(calls.at(-1).operation, operation);
    assert.equal(items.get(current).filter(e => e.start === current + "-16").length, 1);
    // Unreadable data must never render as an empty editable calendar.
    failedRead = true;
    await panel.getByRole("button", { name: "再読み込み", exact: true }).click();
    await panel.getByRole("alert").waitFor();
    assert.equal(await page.locator(".closed-calendar-grid").count(), 0);
    failedRead = false;
    await panel.getByRole("button", { name: "もう一度読み込む", exact: true }).click();
    await date(current + "-20").click();
    page.once("dialog", dialog => dialog.dismiss());
    await page.getByRole("button", { name: "MENU", exact: true }).click();
    assert.match(await date(current + "-20").innerText(), /追加予定/);
    await page.screenshot({ path: process.env.TEMP + "/bassic-closed-calendar.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".closed-calendar-board").scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Phone layout must not overflow horizontally");
    await page.screenshot({ path: process.env.TEMP + "/bassic-closed-calendar-phone.png" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await panel.getByRole("button", { name: "選択をクリア", exact: true }).click();
    writable = false;
    await panel.getByRole("button", { name: "再読み込み", exact: true }).click();
    await panel.getByText("カレンダーは確認できます。店休日の変更は接続確認後に利用できます。", { exact: true }).waitFor();
    assert.equal(await date(current + "-21").isDisabled(), true);
    assert.equal(unusedPreviewRequests.length, 0, "Calendar editing must not load an unrelated hidden public-page preview");
    console.log("Closed-day month UI passed: selection, cross-month retention, confirmation, partial retry, lost-response restore, read failure, navigation guard and read-only gate.");
  } finally { await page.close(); }
}
