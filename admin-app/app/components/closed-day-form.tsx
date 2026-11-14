"use client";

import { useEffect, useState } from "react";
import { closedDayDraftUrl } from "@/lib/closed-day";
import { useErrorFocus } from "@/lib/use-error-focus";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function ClosedDayForm({ onBack, onEditorState }: { onBack: () => void; onEditorState: (value: { dirty: boolean; busy: boolean }) => void }) {
  const [date, setDate] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [retry, setRetry] = useState(0);
  const [opened, setOpened] = useState(false);
  const errorRef = useErrorFocus<HTMLDivElement>(Boolean(error), error + attempt);
  useEffect(() => {
    const controller = new AbortController();
    setCalendarId(""); setError("");
    void fetchWithTimeout("/api/calendar-status", { signal: controller.signal, cache: "no-store" }, 10000).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.ok || !result.data?.calendarId) throw Error();
      if (!controller.signal.aborted) setCalendarId(result.data.calendarId);
    }).catch(() => { if (!controller.signal.aborted) setError("保存先を読み込めませんでした。もう一度読み込んでください。"); });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    onEditorState({ dirty: Boolean(date || end || note), busy: false });
    return () => onEditorState({ dirty: false, busy: false });
  }, [date, end, note, onEditorState]);
  function openCalendar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = closedDayDraftUrl(date, end, note, calendarId);
    setAttempt(value => value + 1);
    if (!url) { setError(!calendarId ? "保存先の読み込みをお待ちください。" : "店休日の日付を確認してください。連休の最終日は開始日以降にしてください。"); return; }
    setError("");
    const openedWindow = window.open(url, "_blank");
    if (!openedWindow) { setError("Googleカレンダーを開けませんでした。ブラウザのポップアップを許可して、もう一度押してください。"); return; }
    openedWindow.opener = null;
    setOpened(true);
  }
  return <section className="editor-panel closed-day-form">
    <button className="text-button" type="button" onClick={onBack}>← 戻る</button>
    <h1>店休日を追加</h1>
    {error ? <div ref={errorRef} tabIndex={-1} role="alert" className="notice error">{error}{!calendarId ? <button type="button" onClick={() => setRetry(value => value + 1)}>もう一度読み込む</button> : null}</div> : null}
    <form onSubmit={openCalendar} noValidate>
      <div className="field"><label htmlFor="closed-day-date">店休日 <b>必須</b></label><input id="closed-day-date" type="date" min="1900-01-01" max="9998-12-31" value={date} onChange={e => { setDate(e.target.value); setOpened(false); }} /></div>
      <details><summary>連休・メモ</summary>
        <div className="field"><label htmlFor="closed-day-end">連休の最終日</label><input id="closed-day-end" type="date" min={date || "1900-01-01"} max="9998-12-31" value={end} onChange={e => { setEnd(e.target.value); setOpened(false); }} /><small>1日だけなら空欄</small></div>
        <div className="field"><label htmlFor="closed-day-note">メモ</label><textarea id="closed-day-note" rows={3} value={note} onChange={e => { setNote(e.target.value); setOpened(false); }} /></div>
      </details>
      <p>「店休日」の終日予定を作ります。</p>
      <button className="primary-button" type="submit" disabled={!calendarId}>Googleカレンダーで保存</button>
      <p className="field-hint">店舗用アカウントで、保存先がBassicになっていることを確認して保存してください。</p>
      {opened ? <div role="status" className="notice info">Googleカレンダーを開きました。まだ保存完了は確認できていません。変更・取り消しはGoogleカレンダーの予定を編集してください。繰り返し保存すると重複します。</div> : null}
    </form>
  </section>;
}
