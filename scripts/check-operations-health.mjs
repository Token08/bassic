import { operationsHealth } from "../lib/operations-health.mjs";
try {
  const result = await operationsHealth({ token: process.env.GH_TOKEN, owner: process.env.GITHUB_REPOSITORY?.split("/")[0] || "Token08", repo: process.env.GITHUB_REPOSITORY?.split("/")[1] || "bassic", calendarExpected: process.env.CALENDAR_SYNC_EXPECTED === "true" });
  for (const service of result.services) console.log(`${service.label}: ${service.state} — ${service.message}`);
  if (!result.ok) process.exitCode = 1;
} catch { console.error("運用点検を完了できませんでした。接続設定と実行結果を確認してください。"); process.exitCode = 1; }
