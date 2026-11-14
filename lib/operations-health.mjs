import { checkAdminSite } from "../scripts/check-public-readonly.mjs";

export async function operationsHealth({ fetcher = fetch, token = "", owner = "Token08", repo = "bassic", calendarExpected = true, now = Date.now() } = {}) {
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) throw Error("点検先が不正です。");
  const signal = AbortSignal.timeout(7000);
  const read = (url, init = {}) => fetcher(url, { ...init, method: "GET", cache: "no-store", redirect: "error", signal });
  const github = async path => {
    const response = await read(`https://api.github.com/repos/${owner}/${repo}${path}`, { headers: { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    if (!response.ok) throw Error("実行結果を取得できませんでした。");
    return response.json();
  };
  const checkedAt = new Date(now).toISOString();
  const row = (id, label, state, message, extra = {}) => ({ id, label, state, message, checkedAt, ...extra });
  const markerPromise = (async () => {
    const response = await read("https://www.bassic.jp/_bassic-build.json");
    if (!response.ok) throw Error();
    const value = await response.json();
    if (!Number.isInteger(value.run) || value.run < 1 || !/^[a-f0-9]{40}$/.test(value.commit)) throw Error();
    return value;
  })().catch(() => null);
  // Each check reports independently: a provider outage cannot hide the others.
  const site = (async () => {
    try {
      await Promise.all(["/", "/events/"].map(async path => {
        const response = await read("https://www.bassic.jp" + path);
        if (!response.ok || !/bassic/i.test(await response.text())) throw Error();
      }));
      if (!await markerPromise) throw Error();
      return row("site", "公開サイト", "ok", "主要ページと公開版の表示を確認しました。");
    } catch { return row("site", "公開サイト", "error", "公開ページを確認できません。公開サイトを開いて確認し、担当者へ連絡してください。"); }
  })();
  const admin = (async () => {
    try {
      await checkAdminSite({ baseUrl: "https://bassic-admin.vercel.app/", fetcher: (url, init) => fetcher(url, { ...init, signal }) });
      return row("admin", "管理画面", "ok", "画面の表示とログイン保護を確認しました。");
    } catch { return row("admin", "管理画面", "error", "画面の表示またはログイン保護を確認できません。担当者へ連絡してください。"); }
  })();
  async function workflow(id, label, file, wantedJob, wantedStep) {
    const actionsUrl = `https://github.com/${owner}/${repo}/actions/workflows/${file}`;
    try {
      const data = await github(`/actions/workflows/${file}/runs?branch=main&per_page=10`);
      if (!Array.isArray(data.workflow_runs)) throw Error();
      for (const run of data.workflow_runs) {
        if (!Number.isInteger(run.id) || !Number.isFinite(Date.parse(run.created_at))) throw Error();
        if (run.status !== "completed") {
          const stalled = now - Date.parse(run.run_started_at || run.created_at) > 30 * 60000;
          return row(id, label, stalled ? "error" : "pending", stalled ? "処理に時間がかかっています。担当者が実行結果を確認してください。" : "処理中です。完了後にもう一度確認してください。", { actionsUrl });
        }
        const details = await github(`/actions/runs/${run.id}/jobs?per_page=100`);
        if (!Array.isArray(details.jobs)) throw Error();
        const job = details.jobs.find(j => j.name === wantedJob);
        const step = job?.steps?.find(s => s.name === wantedStep);
        // Diagnostics and output-only runs must not mask a real failed update.
        if (id === "calendar" && (!step || step.conclusion === "skipped")) {
          if (job && ["failure", "cancelled", "timed_out"].includes(job.conclusion)) return row(id, label, "error", "同期の準備処理に失敗しています。担当者が実行結果を確認してください。", { actionsUrl });
          continue;
        }
        if (id === "publish" && (!job || job.conclusion === "skipped") && !details.jobs.some(j => j.name === "build" && j.conclusion === "failure")) continue;
        const lastRunAt = run.updated_at || run.created_at;
        if (!Number.isFinite(Date.parse(lastRunAt)) || Date.parse(lastRunAt) > now + 60_000) throw Error();
        if ((id === "calendar" ? step.conclusion : run.conclusion) !== "success") return row(id, label, "error", id === "calendar" ? "同期処理に失敗しています。担当者が実行結果を確認してください。" : "公開更新に失敗しています。保存内容を新しく作り直さず、反映だけを再試行してください。", { actionsUrl, lastRunAt });
        if (id === "publish") {
          if (step?.conclusion !== "success") return row(id, label, "unknown", "更新処理は完了していますが、公開サイトへの反映を確認できません。", { actionsUrl, lastRunAt });
          const marker = await markerPromise;
          if (!marker || marker.run !== run.run_number) return row(id, label, "error", "完了した公開版とサイトの表示が一致していません。担当者へ連絡してください。", { actionsUrl, lastRunAt });
        }
        if (now - Date.parse(lastRunAt) > 3 * 3600000) return row(id, label, "error", "定期処理の実行が3時間以上確認できません。担当者が停止や接続切れを確認してください。", { actionsUrl, lastRunAt });
        return row(id, label, "ok", id === "calendar" ? "直近の同期処理は正常終了しています。各イベントの結果はイベント画面で確認できます。" : "直近の公開処理とサイトの公開版を確認しました。", { actionsUrl, lastRunAt });
      }
      return row(id, label, "unknown", "対象の実行結果が見つかりません。担当者が設定を確認してください。", { actionsUrl });
    } catch { return row(id, label, "unknown", "実行結果を取得できません。時間をおいてもう一度確認してください。", { actionsUrl }); }
  }
  const publish = workflow("publish", "サイトの公開更新", "deploy-pages.yml", "publish-lolipop-release", "Confirm release served by the production site");
  const calendar = calendarExpected ? workflow("calendar", "イベントのカレンダー同期", "external-operations.yml", "operations", "Sync Google Calendar") : Promise.resolve(row("calendar", "イベントのカレンダー同期", "disabled", "自動同期は停止設定です。店休日の直接更新とは別の設定です。"));
  const services = await Promise.all([site, admin, publish, calendar]);
  return { checkedAt, services, ok: services.every(service => !["error", "unknown"].includes(service.state)) };
}
