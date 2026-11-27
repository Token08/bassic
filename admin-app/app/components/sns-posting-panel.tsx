"use client";

import { useRef, useState } from "react";
import { xPostUrl } from "@/lib/event-handoff";

export function SnsPostingPanel({ platform, text, imageUrl, compact = false }: { platform: string; text: string; imageUrl: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const draftText = useRef<HTMLDetailsElement>(null);
  async function copy(openInstagram = false) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(openInstagram ? "文面をコピーしました。Instagramの「作成」から画像を選び、文面を貼り付けてください。" : "投稿文をコピーしました。");
    } catch {
      if (draftText.current) draftText.current.open = true;
      setMessage("コピーできませんでした。表示されている投稿文を選択してコピーしてください。");
    }
  }
  async function saveImage() {
    if (savingImage) return;
    setSavingImage(true);
    try {
      const response = await fetch(imageUrl, { credentials: "omit", signal: AbortSignal.timeout(15000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw Error();
      const blob = await response.blob();
      if (blob.size > 15 * 1024 * 1024) throw Error();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
      link.download = "bassic-event." + (extension[blob.type] || "img");
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("画像の保存を開始しました。投稿画面でこの画像を添付してください。");
    } catch {
      setMessage("「画像を開く」から長押し、またはPCで右クリックして画像を保存してください。");
    } finally { setSavingImage(false); }
  }
  return <section className="sns-draft-panel" aria-label="SNSへの投稿準備">
    <strong>{platform === "x" ? "X" : "Instagram"}</strong>
    {compact ? <details ref={draftText}><summary>投稿文を確認</summary><p className="social-draft-text">{text}</p></details> : null}
    <div className="deploy-status-actions">
      {platform === "x" ? <a className="primary-button" href={xPostUrl(text)} target="_blank" rel="noreferrer">Xの投稿画面を開く</a> : <a className="primary-button" href="https://www.instagram.com/" target="_blank" rel="noreferrer" onClick={() => void copy(true)}>文面をコピーしてInstagramを開く</a>}
      <button className="secondary-button" type="button" disabled={!text} onClick={() => void copy()}>投稿文をコピー</button>
      {imageUrl ? <>
        <button className="secondary-button" type="button" disabled={savingImage} onClick={() => void saveImage()}>{savingImage ? "画像を保存中…" : "画像を保存"}</button>
        <a href={imageUrl} target="_blank" rel="noreferrer">画像を開く</a>
      </> : null}
    </div>
    <small>店舗アカウントで画像を添付し、投稿を確定します。</small>
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
