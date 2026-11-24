import { operationsHealth } from "../lib/operations-health.mjs";
try {
  const result = await operationsHealth({ token: process.env.GH_TOKEN, owner: process.env.GITHUB_REPOSITORY?.split("/")[0] || "Token08", repo: process.env.GITHUB_REPOSITORY?.split("/")[1] || "bassic", calendarExpected: process.env.CALENDAR_SYNC_EXPECTED === "true" });
  for (const service of result.services) console.log(`${service.label}: ${service.state} — ${service.message}`);
  const calendar = result.services.find(service => service.id === "calendar");
  if (process.env.RECOVER_CALENDAR_SCHEDULE === "true" && calendar?.reason === "stale-schedule") {
    if (process.env.GITHUB_REPOSITORY !== "Token08/bassic" || process.env.GITHUB_REF !== "refs/heads/main") throw Error("Invalid recovery target");
    const response = await fetch("https://api.github.com/repos/Token08/bassic/actions/workflows/external-operations.yml/dispatches", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main", inputs: { calendar_only: true } }),
      signal: AbortSignal.timeout(7000)
    });
    if (!response.ok) throw Error(`Calendar recovery request failed: ${response.status}`);
    console.log("カレンダー同期の再実行を依頼しました。完了結果は次回の点検で確認します。");
    if (result.services.some(service => service !== calendar && ["error", "unknown"].includes(service.state))) process.exitCode = 1;
  } else if (!result.ok) process.exitCode = 1;
} catch { console.error("運用点検を完了できませんでした。接続設定と実行結果を確認してください。"); process.exitCode = 1; }
