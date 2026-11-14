"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { monthRange, overlaps, shiftDay, validDay } from "@public/lib/closed-days-view.mjs";
import type { DayChange, DayEvent, DayResult } from "@/lib/closed-days";
import { useErrorFocus } from "@/lib/use-error-focus";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
type MonthData = { month: string; events: DayEvent[]; canWrite: boolean };
const draftKey = "bassic-closed-days-pending-v1";
const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
export function ClosedDayForm({ onBack, onEditorState }: { onBack: () => void; onEditorState: (value: { dirty: boolean; busy: boolean }) => void }) {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [data, setData] = useState<MonthData>();
  const [pending, setPending] = useState<Record<string, DayChange>>({});
  const [operation, setOperation] = useState("");
  const [results, setResults] = useState<DayResult[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);
  const request = useRef<AbortController | null>(null);
  const alive = useRef(true), inFlight = useRef(false);
  const errorRef = useErrorFocus<HTMLDivElement>(Boolean(error), error + tick);
  const changes = Object.values(pending).sort((a, b) => a.date.localeCompare(b.date));
  const unresolved = results.some(r => r.state !== "applied");
  const unknown = results.some(r => r.state === "unknown");
  const load = useCallback(async (value: string, keepError = false) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); if (!keepError) setError(""); setData(undefined);
    try {
      const response = await fetchWithTimeout("/api/closed-days?month=" + encodeURIComponent(value), { signal: controller.signal, cache: "no-store" }, 20000);
      const result = await response.json();
      if (!response.ok || !result.ok || result.data?.month !== value || !Array.isArray(result.data.events)) throw Error(result.message || "予定を読み込めませんでした。");
      if (!controller.signal.aborted) setData(result.data);
    } catch (e) { if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : "予定を読み込めませんでした。"); setTick(v => v + 1); } }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    alive.current = true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(draftKey) || "null");
      if (saved && typeof saved.operation === "string" && /^[a-f0-9-]{36}$/.test(saved.operation) && saved.pending && typeof saved.pending === "object" &&
        Object.values(saved.pending).length <= 31 && Object.entries(saved.pending).every(([key, item]: [string, any]) => item && item.date === key && validDay(item.date) && ["add", "remove"].includes(item.action) && Array.isArray(item.events) && item.events.every((e: DayEvent) => e && typeof e.id === "string" && typeof e.etag === "string" && typeof e.title === "string" && validDay(e.start) && validDay(e.end)))) {
        setPending(saved.pending); setOperation(saved.operation);
        if (Array.isArray(saved.results)) setResults(saved.results.filter((r: DayResult) => r && validDay(r.date) && ["applied", "failed", "conflict", "unknown"].includes(r.state) && (r.message === undefined || typeof r.message === "string")));
        setNotice("前回の選択を復元しました。内容を確認してください。");
      }
    } catch { /* Local storage is optional. */ }
    setReady(true);
    return () => { alive.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => { void load(month); }, [month, load]);
  useEffect(() => {
    onEditorState({ dirty: changes.length > 0, busy });
    const leave = (event: BeforeUnloadEvent) => { if (changes.length || busy) event.preventDefault(); };
    window.addEventListener("beforeunload", leave);
    return () => { onEditorState({ dirty: false, busy: false }); window.removeEventListener("beforeunload", leave); };
  }, [changes.length, busy, onEditorState]);
  useEffect(() => {
    if (!ready) return;
    try {
      if (changes.length) window.localStorage.setItem(draftKey, JSON.stringify({ pending, operation, results }));
      else window.localStorage.removeItem(draftKey);
    } catch { /* The mounted form still retains selections. */ }
  }, [pending, operation, results, ready, changes.length]);
  function toggle(date: string) {
    if (!data?.canWrite || loading || busy || unresolved) return;
    if (!pending[date] && changes.length >= 31) { setError("一度に31日まで選べます。"); setTick(v => v + 1); return; }
    setReview(false); setNotice(""); setResults([]);
    setPending(current => {
      const next = { ...current };
      if (next[date]) delete next[date];
      else next[date] = { date, action: data.events.some(e => e.editable && overlaps(e, date)) ? "remove" : "add", events: data.events.filter(e => e.editable && overlaps(e, date)) };
      return next;
    });
    setOperation(crypto.randomUUID());
  }
  async function apply() {
    if (inFlight.current || !changes.length || !data?.canWrite) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("反映中です…"); setReview(false);
    // Persist an uncertain state before sending so refresh cannot lose an in-flight operation.
    const waiting: DayResult[] = changes.map(change => ({ date: change.date, state: "unknown", message: "反映結果を確認中です。" }));
    setResults(waiting);
    try { window.localStorage.setItem(draftKey, JSON.stringify({ pending, operation, results: waiting })); } catch {}
    try {
      const response = await fetchWithTimeout("/api/closed-days", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, changes }) }, 58000);
      const result = await response.json();
      if (!response.ok || !result.ok || !Array.isArray(result.data?.results)) throw Error(result.message || "反映結果を確認できませんでした。");
      if (!alive.current) return;
      const returned: DayResult[] = result.data.results;
      if (returned.length !== changes.length || new Set(returned.map(r => r.date)).size !== returned.length || returned.some(r => !pending[r.date] || !["applied", "failed", "unknown", "conflict"].includes(r.state))) throw Error("反映結果を確認できませんでした。");
      const done = new Set(returned.filter(r => r.state === "applied").map(r => r.date));
      setPending(current => Object.fromEntries(Object.entries(current).filter(([date]) => !done.has(date))));
      setResults(returned);
      if (done.size === returned.length) setNotice("反映済みです。");
      else { setNotice(`${done.size}日反映済み。未完了の選択は残しています。`); setError("未完了の日付を確認してください。変更済みの予定は選び直してください。"); setTick(v => v + 1); }
      await load(month, true);
    } catch (e) {
      if (!alive.current) return;
      setResults(waiting); setError(e instanceof Error ? e.message : "反映結果を確認できませんでした。"); setTick(v => v + 1); setNotice("");
    } finally { inFlight.current = false; if (alive.current) setBusy(false); }
  }
  function clear() {
    if (busy || unknown) return;
    if (unresolved && !window.confirm("選択をクリアしても、Googleに反映された予定は戻りません。再読み込みして内容を確認しますか？")) return;
    setPending({}); setResults([]); setReview(false); setNotice(""); setOperation(""); void load(month);
  }
  function move(offset: number) {
    if (busy) return;
    const range = monthRange(month);
    const next = offset > 0 ? range.end.slice(0, 7) : shiftDay(range.start, -1).slice(0, 7);
    if (next >= "1900-01" && next <= "9998-12") setMonth(next);
    setReview(false);
  }
  const range = monthRange(month), days: string[] = [];
  for (let date = range.start; date < range.end; date = shiftDay(date, 1)) days.push(date);
  return <section className="closed-day-form" aria-label="店休日カレンダー">
    <button className="text-button" type="button" disabled={busy} onClick={onBack}>← 戻る</button><h1>店休日を追加・取り消し</h1>
    {error ? <div ref={errorRef} tabIndex={-1} role="alert" className="notice error">{error}</div> : null}
    {notice ? <p role="status" className="notice info">{notice}</p> : null}
    <div className="closed-calendar-toolbar"><button type="button" className="secondary-button" disabled={busy} onClick={() => move(-1)}>前月</button><h2>{month.replace("-", "年")}月</h2><button type="button" className="secondary-button" disabled={busy} onClick={() => move(1)}>翌月</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setMonth(today().slice(0, 7))}>今月</button><button type="button" className="secondary-button" disabled={busy || loading} onClick={() => void load(month)}>再読み込み</button></div>
    <p>日付を選ぶ → 変更を反映。店休日を選ぶと取り消せます。</p>
    {loading ? <p role="status">予定を読み込んでいます…</p> : !data ? <button type="button" className="secondary-button" onClick={() => void load(month)}>もう一度読み込む</button> : <>
      {!data.canWrite ? <p className="notice info">カレンダーは確認できます。店休日の変更は接続確認後に利用できます。</p> : null}
      <div className="closed-calendar-grid" aria-label={month + "の予定"}>
        {["日", "月", "火", "水", "木", "金", "土"].map(day => <div className="closed-calendar-weekday" key={day}>{day}</div>)}
        {Array.from({ length: new Date(range.start + "T00:00:00Z").getUTCDay() }, (_, i) => <div className="closed-calendar-blank" key={"blank" + i} />)}
        {days.map(date => {
          const events = data.events.filter(e => overlaps(e, date)), closed = events.filter(e => e.editable), selection = pending[date];
          const state = selection ? selection.action === "add" ? "追加予定" : "取り消し予定" : closed.length ? "店休日" : "";
          return <div className={`closed-calendar-day${closed.length ? " is-closed" : ""}${selection ? " is-pending" : ""}`} key={date}>
            <button type="button" className="closed-calendar-date" aria-label={date + (state ? " " + state : " 店休日を追加")} aria-pressed={Boolean(selection)} disabled={!data.canWrite || busy || unresolved} onClick={() => toggle(date)}><strong>{Number(date.slice(-2))}</strong>{date === today() ? <small>今日</small> : null}{state ? <span>{state}</span> : null}</button>
            <ul>{events.map(e => <li key={e.id}>{e.title}{e.recurring ? "（繰り返し）" : ""}</li>)}</ul>
          </div>;
        })}
      </div>
    </>}
    {changes.length ? <section className="closed-calendar-selection" aria-label="選択した変更"><h2>{changes.length}日選択中</h2><ul>{changes.map(c => <li key={c.date}>{c.date}：{c.action === "add" ? "追加" : "取り消し"}{c.events.length > 1 ? `（${c.events.length}件）` : ""}</li>)}</ul>
      {results.filter(r => r.state !== "applied").map(r => <p className="form-error" key={r.date}>{r.date}：{r.message || "未完了です。"}</p>)}
      {unresolved ? <p>未完了分だけ同じ変更の結果を再確認します。{unknown ? "結果を確認するまで選択を残しています。" : "選び直す場合は選択をクリアしてください。"}</p> : null}
      <div className="closed-calendar-actions"><button type="button" className="secondary-button" disabled={busy || unknown} onClick={clear}>選択をクリア</button><button type="button" className="primary-button" disabled={busy || loading || !data?.canWrite || changes.length > 31} onClick={() => setReview(true)}>{unresolved ? "未完了分を再確認" : "変更を反映"}</button></div>
      {changes.length > 31 ? <p className="form-error">一度に31日まで選べます。</p> : null}
    </section> : null}
    {review ? <section className="notice info" aria-label="店休日の変更確認"><h2>この内容で反映しますか？</h2><ul>{changes.map(c => <li key={c.date}>{c.date} {c.action === "add" ? "店休日を追加" : `店休日を取り消し：${c.events.map(e => e.title).join("・")}`}{data?.events.some(e => !e.editable && overlaps(e, c.date)) ? "（ほかの予定あり）" : ""}</li>)}</ul><p>取り消すのは選んだ日だけです。ライブなどの予定は変更しません。</p><div className="closed-calendar-actions"><button className="secondary-button" type="button" onClick={() => setReview(false)}>戻る</button><button className="primary-button" type="button" disabled={busy} onClick={() => void apply()}>この内容で反映</button></div></section> : null}
    {busy ? <p role="status">反映結果を確認中です。画面を閉じずにお待ちください。</p> : null}
  </section>;
}
