"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import type { OperationsHealth } from "@public/lib/operations-health.mjs";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
export function OperationsHealthPanel() {
  const [data, setData] = useState<OperationsHealth>();
  const [error, setError] = useState(false), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(false);
    void fetchWithTimeout("/api/operations-health", { cache: "no-store", signal: controller.signal }, 10000).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.ok || !Array.isArray(result.data?.services)) throw Error();
      if (!controller.signal.aborted) setData(result.data);
    }).catch(() => { if (!controller.signal.aborted) { setError(true); setData(undefined); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const labels = { ok: "確認済み", pending: "処理中", disabled: "停止設定", error: "要対応", unknown: "確認できません" };
  return <section className="ops-status-panel" aria-label="公開・連携の状況"><div className="ops-status-heading"><h2>公開・連携の状況</h2><button type="button" className="secondary-button" disabled={loading} onClick={() => setRetry(v => v + 1)}><RefreshCw size={15} className={loading ? "spin" : undefined} />状況を再確認</button></div>
    {loading ? <p role="status">確認しています…</p> : error ? <p role="alert">運用状況を確認できませんでした。「状況を再確認」を押してください。</p> : data ? <><small>確認時刻：{new Date(data.checkedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</small><div className="ops-health-services">{data.services.map(service => <article className={`ops-health-service state-${service.state}`} key={service.id}><header>{service.state === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<strong>{service.label}</strong><span>{labels[service.state]}</span></header><p>{service.message}</p>{service.lastRunAt ? <small>最終処理：{new Date(service.lastRunAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</small> : null}{service.actionsUrl ? <details><summary>保守担当：実行結果</summary><a href={service.actionsUrl} target="_blank" rel="noreferrer">実行結果を開く</a></details> : null}</article>)}</div></> : null}
  </section>;
}
