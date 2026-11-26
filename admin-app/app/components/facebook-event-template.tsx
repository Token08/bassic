"use client";

import { ClipboardCopy, NotebookPen } from "lucide-react";
import { useRef, useState } from "react";

const template = `日程：
タイトル：
出演：
OPEN： / START：
料金：
予約：
お問い合わせ：
注意事項：`;

export function FacebookEventTemplate() {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [announcement, setAnnouncement] = useState(template);
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(announcement);
      setStatus("告知文をコピーしました。");
    } catch {
      field.current?.focus();
      field.current?.select();
      setStatus("テキストを選択しました。⌘＋C または Ctrl＋C でコピーしてください。");
    }
  }

  return (
    <>
      <button type="button" className="secondary-button facebook-announcement-button" aria-haspopup="dialog" onClick={() => {
        setStatus("");
        dialog.current?.showModal();
      }}><NotebookPen size={16} aria-hidden="true" />Facebookイベント告知</button>
      <dialog className="facebook-announcement-dialog" ref={dialog} aria-labelledby="facebook-event-template-title"
        style={{ width: "min(38rem, calc(100% - 2rem))", maxHeight: "calc(100dvh - 2rem)", padding: "1.25rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "inherit" }}>
        <h2 id="facebook-event-template-title">Facebookイベント告知テンプレート</h2>
        <p>ここで告知文を書き、コピーしてFacebookイベントの説明欄に貼り付けます。予約・お問い合わせ・注意事項は必要な行だけ残してください。</p>
        <textarea ref={field} aria-label="Facebookイベントの告知文" value={announcement} onChange={(event) => {
          setAnnouncement(event.target.value);
          setStatus("");
        }}
          rows={12} style={{ width: "100%", font: "inherit" }} />
        <p role="status">{status}</p>
        <div className="facebook-announcement-actions">
          <button type="button" className="secondary-button" onClick={() => dialog.current?.close()}>閉じる</button>
          <button type="button" className="primary-button" disabled={!announcement.trim()} onClick={() => void copy()}>
            <ClipboardCopy size={16} aria-hidden="true" />告知文をコピー
          </button>
        </div>
      </dialog>
    </>
  );
}
