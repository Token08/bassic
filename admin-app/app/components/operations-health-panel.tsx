"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Minus, RefreshCw } from "lucide-react";
import type { OperationHealth, OperationsHealth } from "@public/lib/operations-health.mjs";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

const stateLabels = {
  ok: "確認済み", pending: "処理中", disabled: "停止設定", error: "要対応", unknown: "確認できません",
};
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
});

function ServiceStatus({ service }: { service: OperationHealth }) {
  const Icon = service.state === "ok" ? CheckCircle2
    : service.state === "pending" ? RefreshCw
    : service.state === "disabled" ? Minus : AlertCircle;
  return (
    <article className={`ops-health-service state-${service.state}`}>
      <header>
        <Icon size={18} aria-hidden="true" />
        <h3>{service.label}</h3>
        <span className="ops-health-badge">{stateLabels[service.state]}</span>
      </header>
      <p>{service.message}</p>
      {service.lastRunAt ? <small>最終処理：{dateFormat.format(new Date(service.lastRunAt))}</small> : null}
      {service.actionsUrl ? (
        <details><summary>保守担当：実行結果</summary><a href={service.actionsUrl} target="_blank" rel="noreferrer">実行結果を開く</a></details>
      ) : null}
    </article>
  );
}

export function OperationsHealthPanel() {
  const [data, setData] = useState<OperationsHealth>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void fetchWithTimeout("/api/operations-health", { cache: "no-store", signal: controller.signal }, 10000)
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.data?.services)) throw Error();
        if (!controller.signal.aborted) setData(result.data);
      })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setData(undefined); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  return (
    <section className="ops-status-panel operations-health-panel" aria-label="公開・連携の状況">
      <div className="ops-status-heading">
        <div>
          <h2>公開・連携の状況</h2>
          {!loading && data && !error ? <small>確認時刻：{dateFormat.format(new Date(data.checkedAt))}（日本時間）</small> : null}
        </div>
        <button type="button" className="secondary-button" disabled={loading} onClick={() => setRetry(v => v + 1)}>
          <RefreshCw size={15} className={loading ? "spin" : undefined} aria-hidden="true" />状況を再確認
        </button>
      </div>
      {loading ? <p role="status">確認しています…</p>
        : error ? <p role="alert">運用状況を確認できませんでした。「状況を再確認」を押してください。</p>
        : data ? <div className="ops-health-services">{data.services.map(service => <ServiceStatus key={service.id} service={service} />)}</div>
        : null}
    </section>
  );
}
