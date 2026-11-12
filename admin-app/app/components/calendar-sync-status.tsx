"use client";

import { useEffect, useState } from "react";
import { calendarDraftUrl, type CalendarEventInput } from "@/lib/event-handoff";
import { useErrorFocus } from "@/lib/use-error-focus";

type CalendarEvent = CalendarEventInput & { id: string; syncKey?: string };
type State = "waiting" | "manual" | "pending" | "matched" | "review" | "unconfirmed";
async function request(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST", cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw Error(result.message || "カレンダーを確認できませんでした。");
  return result.data;
}

export function CalendarSyncStatus({ event, eventId, active, autoEligible }: {
  event: CalendarEvent; eventId?: string; active: boolean; autoEligible: boolean;
}) {
  const [state, setState] = useState<State>("waiting");
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [error, setError] = useState("");
  const feedback = useErrorFocus<HTMLDivElement>(Boolean(error), error);
  const signature = JSON.stringify(event);
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + 15 * 60000;
    async function poll() {
      try {
        const result = await request("/api/calendar-status", event);
        if (stopped) return;
        if (result.state === "matched") { setState("matched"); return; }
        if (result.state === "review" && result.reason === "duplicate") { setState("review"); return; }
        if (result.state === "unconfigured") { setState("manual"); return; }
      } catch { /* A transient read failure must not become a successful sync. */ }
      if (stopped) return;
      if (Date.now() >= deadline) { setState("unconfirmed"); return; }
      timer = setTimeout(poll, 15000);
    }
    async function start() {
      setState("waiting");
      setCanSync(false);
      try {
        const config = await request("/api/calendar-status");
        if (stopped) return;
        if (!config.configured || !autoEligible) { setState("manual"); return; }
        setCanSync(true);
        setState("pending");
        await poll();
      } catch { if (!stopped) setState("unconfirmed"); }
    }
    void start();
    return () => { stopped = true; clearTimeout(timer); };
    // Snapshot identity changes restart verification; reads never change saved data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, active, autoEligible, attempt]);

  async function retry() {
    if (retrying || !eventId) return;
    setRetrying(true); setError("");
    try {
      await request("/api/calendar-sync", { eventId });
      setAttempt(value => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "再反映を依頼できませんでした。"); }
    finally { setRetrying(false); }
  }
  const text: Record<State, string> = {
    waiting: "未確認です。サイト掲載後に確認します。",
    manual: autoEligible ? "自動同期は未接続です。Google側で保存してください。" : "このイベントはGoogle側で追加してください。",
    pending: "カレンダーへの反映を確認中です。サイトの掲載は続けられます。",
    matched: "反映済み。予定の内容が保存したイベントと一致しました。",
    review: "同期済みの予定が重複しています。担当者に確認してください。",
    unconfirmed: "カレンダーへの反映を確認できませんでした。サイトの掲載内容は残っています。",
  };
  const manualUrl = calendarDraftUrl(event);
  return <div className="calendar-sync-status" role="region" aria-label="Googleカレンダーの反映状況">
    <p role="status">{text[state]}</p>
    {state === "manual" && manualUrl ? <>
      <a className="secondary-button" href={manualUrl} target="_blank" rel="noreferrer">Googleカレンダーで確認・保存</a>
      <p className="calendar-handoff-note">初回追加用です。Google側で保存先を「Bassic」に選んで保存してください。変更・中止は既存の予定を編集します。ボタンを開いただけでは保存されません。</p>
    </> : null}
    {state === "unconfirmed" ? <div className="deploy-status-actions">
      <button className="secondary-button" type="button" onClick={() => setAttempt(value => value + 1)}>もう一度確認</button>
      {canSync && eventId ? <button className="secondary-button" type="button" disabled={retrying} onClick={() => void retry()}>{retrying ? "依頼中…" : "カレンダーだけ再反映"}</button> : null}
    </div> : null}
    {error ? <div ref={feedback} tabIndex={-1} role="alert">{error}</div> : null}
  </div>;
}
