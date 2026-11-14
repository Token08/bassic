"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, Minus, MousePointer2, Plus, RefreshCw } from "lucide-react";
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
  const reviewScroll = useRef(0), reviewTrigger = useRef<HTMLButtonElement>(null);
  const errorRef = useErrorFocus<HTMLDivElement>(Boolean(error), error + tick);
  const reviewRef = useErrorFocus<HTMLElement>(review, review);
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
      if (!response.ok || !result.ok || !Array.isArray(result.data?.results)) throw Object.assign(Error(result.message || "反映結果を確認できませんでした。"), { status: response.status });
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
      const rejected = [400, 401, 403, 413].includes((e as { status?: number }).status || 0);
      setResults(rejected ? changes.map(c => ({ date: c.date, state: "failed", message: "変更は受け付けられませんでした。" })) : waiting);
      setError(e instanceof Error ? e.message : "反映結果を確認できませんでした。"); setTick(v => v + 1); setNotice("");
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
  function openReview() { reviewScroll.current = window.scrollY; setReview(true); }
  function closeReview() {
    setReview(false);
    requestAnimationFrame(() => {
      if (!alive.current) return;
      reviewTrigger.current?.focus({ preventScroll: true });
      window.scrollTo({ top: reviewScroll.current, behavior: "auto" });
    });
  }
  const range = monthRange(month), days: string[] = [];
  for (let date = range.start; date < range.end; date = shiftDay(date, 1)) days.push(date);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const leading = new Date(range.start + "T00:00:00Z").getUTCDay();
  const trailing = (7 - ((leading + days.length) % 7)) % 7;
  const additions = changes.filter(c => c.action === "add"), removals = changes.filter(c => c.action === "remove");
  const label = (date: string, full = false) => `${full ? date.slice(0, 4) + "年" : ""}${Number(date.slice(5, 7))}${full ? "月" : "/"}${Number(date.slice(8, 10))}${full ? "日" : ""}（${weekdays[new Date(date + "T00:00:00Z").getUTCDay()]}）`;
  return <section className="closed-day-form" aria-label="店休日カレンダー" aria-busy={busy}>
    <button className="text-button closed-calendar-back" aria-label="イベントスケジュールへ戻る" type="button" disabled={busy} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> 戻る</button>
    <header className="closed-calendar-heading"><div><p className="eyebrow">店休日の設定</p><h1>店休日を追加・取り消し</h1></div><span className="closed-calendar-connection"><CalendarDays size={15} aria-hidden="true" /> Bassicのカレンダー</span></header>
    {error ? <div ref={errorRef} tabIndex={-1} role="alert" className="notice error closed-calendar-feedback"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div> : null}
    {notice ? <div role="status" className={`notice ${notice === "反映済みです。" ? "success" : "info"} closed-calendar-feedback`}>{notice === "反映済みです。" ? <CheckCircle2 size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}<span>{notice}</span></div> : null}
    <div className="closed-calendar-board">
      <div className="closed-calendar-toolbar">
        <div className="closed-calendar-month-nav"><button type="button" className="secondary-button" disabled={busy} onClick={() => move(-1)}><ChevronLeft size={17} aria-hidden="true" /> 前月</button><button type="button" className="secondary-button" disabled={busy} onClick={() => move(1)}>翌月 <ChevronRight size={17} aria-hidden="true" /></button></div>
        <h2 className="closed-calendar-month"><span>{month.slice(0, 4)}年</span><strong>{Number(month.slice(5))}月</strong></h2>
        <div className="closed-calendar-tools"><button type="button" className="secondary-button" disabled={busy} onClick={() => setMonth(today().slice(0, 7))}>今月</button><button type="button" className="secondary-button" disabled={busy || loading} onClick={() => void load(month)}><RefreshCw size={15} className={loading ? "spin" : undefined} aria-hidden="true" /> 再読み込み</button></div>
      </div>
      <div className="closed-calendar-guide"><p>日付を選んで、まとめて変更。</p><div className="closed-calendar-legend" aria-label="表示の意味"><span className="legend-closed"><span aria-hidden="true">●</span> 店休日</span><span className="legend-add"><Plus size={13} aria-hidden="true" /> 追加予定</span><span className="legend-remove"><Minus size={13} aria-hidden="true" /> 取り消し予定</span></div></div>
      {loading ? <div className="closed-calendar-placeholder" role="status"><Loader2 size={24} className="spin" aria-hidden="true" /><p>予定を読み込んでいます…</p></div> : !data ? <div className="closed-calendar-placeholder"><CalendarDays size={30} aria-hidden="true" /><p>カレンダーを表示できませんでした。</p><button type="button" className="secondary-button" onClick={() => void load(month)}>もう一度読み込む</button></div> : <>
        {!data.canWrite ? <p className="notice info">カレンダーは確認できます。店休日の変更は接続確認後に利用できます。</p> : null}
        <div className="closed-calendar-grid" aria-label={month + "の予定"}>
          {weekdays.map((day, index) => <div className={`closed-calendar-weekday${index === 0 ? " is-sunday" : index === 6 ? " is-saturday" : ""}`} key={day}>{day}</div>)}
          {Array.from({ length: leading }, (_, i) => <div className="closed-calendar-outside" aria-hidden="true" key={"before" + i}>{Number(shiftDay(range.start, i - leading).slice(-2))}</div>)}
          {days.map(date => {
            const events = data.events.filter(e => overlaps(e, date)), closed = events.filter(e => e.editable), selection = pending[date];
            const otherEvents = events.filter(e => !e.editable);
            const state = selection ? selection.action === "add" ? "追加予定" : "取り消し予定" : closed.length ? "店休日" : "";
            const dayOfWeek = new Date(date + "T00:00:00Z").getUTCDay();
            return <button type="button" key={date} className={`closed-calendar-day${closed.length ? " is-closed" : ""}${selection ? " is-" + selection.action : ""}${date === today() ? " is-today" : ""}${dayOfWeek === 0 ? " is-sunday" : ""}`} aria-label={date + (state ? " " + state : " 店休日を追加")} aria-current={date === today() ? "date" : undefined} aria-pressed={Boolean(selection)} aria-describedby={otherEvents.length ? "closed-calendar-events-" + date : undefined} disabled={!data.canWrite || busy || unresolved} onClick={() => toggle(date)} title={events.map(e => e.title).join("\n")}>
              <span className="closed-calendar-date-heading"><strong>{Number(date.slice(-2))}</strong>{date === today() ? <small>今日</small> : null}</span>
              {state ? <span className={`closed-calendar-state${selection ? " state-" + selection.action : ""}`}>{selection?.action === "add" ? <Plus size={13} aria-hidden="true" /> : selection?.action === "remove" ? <Minus size={13} aria-hidden="true" /> : <span className="closed-calendar-dot" aria-hidden="true">●</span>}<span className="closed-state-full">{state}{!selection && closed.length > 1 ? ` ${closed.length}件` : ""}</span><span className="closed-state-short" aria-hidden="true">{selection ? selection.action === "add" ? "追加" : "取消" : closed.length > 1 ? `休 ${closed.length}件` : "店休日"}</span></span> : null}
              {closed.some(e => e.recurring) ? <span className="closed-calendar-recurring"><RefreshCw size={11} aria-hidden="true" /> 繰り返し</span> : null}
              {otherEvents.length ? <span id={"closed-calendar-events-" + date} className="closed-calendar-events" aria-label="当日の予定">{otherEvents.map(e => <span className="closed-calendar-event" key={e.id}>{e.title}</span>)}</span> : null}
            </button>;
          })}
          {Array.from({ length: trailing }, (_, i) => <div className="closed-calendar-outside" aria-hidden="true" key={"after" + i}>{i + 1}</div>)}
        </div>
        <p className="closed-calendar-footnote"><Info size={14} aria-hidden="true" /> ライブなどの予定は確認のみ。変更するのは店休日だけです。</p>
      </>}
    </div>
    {changes.length ? <section className={`closed-calendar-selection${review ? " is-reviewing" : ""}`} aria-label="選択した変更">
      <div className="closed-calendar-selection-main"><div className="closed-calendar-selection-summary"><h2>{changes.length}日選択中</h2><div className="closed-calendar-counts">{additions.length ? <span className="count-add"><Plus size={13} aria-hidden="true" />追加 {additions.length}日</span> : null}{removals.length ? <span className="count-remove"><Minus size={13} aria-hidden="true" />取り消し {removals.length}日</span> : null}</div></div><div className="closed-calendar-actions"><button type="button" className="text-button" disabled={busy || unknown} onClick={clear}>選択をクリア</button><button type="button" ref={reviewTrigger} className="primary-button" disabled={busy || loading || !data?.canWrite || changes.length > 31} onClick={openReview}>{busy ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}{unresolved ? "未完了分を再確認" : "変更を反映"}</button></div></div>
      <details className="closed-calendar-selected-dates"><summary>選択した日付を見る</summary><ul>{changes.map(c => <li className={"selected-" + c.action} key={c.date}><span>{c.action === "add" ? "＋" : "－"}</span>{label(c.date)}{c.events.length > 1 ? `（${c.events.length}件）` : ""}</li>)}</ul></details>
      {results.filter(r => r.state !== "applied").map(r => <p className="form-error" key={r.date}>{label(r.date)}：{r.message || "未完了です。"}</p>)}
      {unresolved ? <p className="closed-calendar-recovery">未完了分だけ同じ変更の結果を再確認します。{unknown ? "結果を確認するまで選択を残しています。" : "選び直す場合は選択をクリアしてください。"}</p> : null}
      {changes.length > 31 ? <p className="form-error">一度に31日まで選べます。</p> : null}
    </section> : <p className="closed-calendar-empty-selection"><MousePointer2 size={15} aria-hidden="true" /> 店休日にする日、取り消す日を選んでください。</p>}
    {review ? <section ref={reviewRef} tabIndex={-1} className="closed-calendar-review" aria-label="店休日の変更確認"><header><span className="eyebrow">変更内容の確認</span><h2>この内容で反映しますか？</h2></header><div className="closed-calendar-review-groups">{([{ action: "add", title: "店休日を追加", list: additions }, { action: "remove", title: "店休日を取り消し", list: removals }] as const).filter(group => group.list.length).map(group => <div className={"closed-calendar-review-group review-" + group.action} key={group.action}><h3>{group.action === "add" ? <Plus size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}{group.title}<span>{group.list.length}日</span></h3><ul>{group.list.map(c => <li key={c.date}><strong>{label(c.date, true)}</strong>{c.action === "remove" ? <small>{c.events.map(e => e.title).join("・")}</small> : null}{data?.events.some(e => !e.editable && overlaps(e, c.date)) ? <span className="closed-calendar-overlap"><Info size={13} aria-hidden="true" />ほかの予定あり</span> : null}</li>)}</ul></div>)}</div><p className="closed-calendar-footnote"><Info size={14} aria-hidden="true" /> 取り消すのは選んだ日だけです。ライブなどの予定は変更しません。</p><div className="closed-calendar-actions"><button className="secondary-button" type="button" onClick={closeReview}>戻る</button><button className="primary-button" type="button" disabled={busy} onClick={() => void apply()}><Check size={17} aria-hidden="true" /> この内容で反映</button></div></section> : null}
    {busy ? <p role="status" className="closed-calendar-feedback"><Loader2 size={17} className="spin" aria-hidden="true" />反映結果を確認中です。画面を閉じずにお待ちください。</p> : null}
  </section>;
}
