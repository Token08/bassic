"use client";

import { useRef, useState } from "react";

const template = `日程：［年］年［月］月［日］日（［曜日］）
タイトル：［イベント名］
出演：［出演者］
OPEN：［18:30］ / START：［19:00］
料金：前売 ［金額］ / 当日 ［金額］
予約：［予約フォームURL］
お問い合わせ：［連絡先］
注意事項：［必要な場合に記入］

--- SNS転載ここまで ---`;

export function FacebookEventTemplate() {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(template);
      setStatus("テンプレートをコピーしました。");
    } catch {
      field.current?.focus();
      field.current?.select();
      setStatus("テキストを選択しました。⌘＋C または Ctrl＋C でコピーしてください。");
    }
  }

  return (
    <>
      <button type="button" className="secondary-button" aria-haspopup="dialog" onClick={() => {
        setStatus("");
        dialog.current?.showModal();
      }}>Facebookイベント告知</button>
      <dialog ref={dialog} aria-labelledby="facebook-event-template-title"
        style={{ width: "min(38rem, calc(100% - 2rem))", maxHeight: "calc(100dvh - 2rem)", padding: "1.25rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "inherit" }}>
        <h2 id="facebook-event-template-title">Facebookイベント告知テンプレート</h2>
        <p>Facebookイベントの説明欄の先頭に貼り付けてください。予約・お問い合わせ・注意事項は、必要な行だけ残します。詳しい紹介文は区切り行の下に書けます。</p>
        <textarea ref={field} aria-label="Facebookイベント告知テンプレート" value={template} readOnly
          rows={12} style={{ width: "100%", font: "inherit" }} />
        <p role="status">{status}</p>
        <button type="button" className="primary-button" onClick={() => void copy()}>テンプレートをコピー</button>
        {" "}
        <button type="button" className="secondary-button" onClick={() => dialog.current?.close()}>閉じる</button>
      </dialog>
    </>
  );
}
