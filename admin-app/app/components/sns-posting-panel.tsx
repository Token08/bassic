"use client";

import { useRef, useState } from "react";
import { xPostUrl } from "@/lib/event-handoff";

export function SnsPostingPanel({ platform, text, imageUrl, eventTitle, compact = false }: { platform: string; text: string; imageUrl: string; eventTitle?: string; compact?: boolean }) {
  const instagram = platform === "instagram";
  const [message, setMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const draftText = useRef<HTMLDetailsElement>(null);
  async function copy(openInstagram = false) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(openInstagram ? "文面をコピーしました。Instagramで貼り付けてください。" : "投稿文をコピーしました。");
    } catch {
      if (draftText.current) draftText.current.open = true;
      setMessage("コピーできませんでした。表示されている投稿文を選択してコピーしてください。");
    }
  }
  async function saveImage() {
    if (savingImage) return;
    setSavingImage(true);
    setImageMessage("");
    try {
      const response = await fetch(imageUrl, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(15000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw Error();
      const blob = await response.blob();
      if (blob.size > 15 * 1024 * 1024) throw Error();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
      const title = eventTitle?.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").trim().slice(0, 60).trim();
      link.download = `${title ? `Bassic-${title}` : "bassic-event"}.${extension[blob.type] || "img"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setImageMessage(`ブラウザのダウンロード一覧で「${link.download}」の保存先を確認できます。`);
    } catch {
      setImageMessage("自動で保存できませんでした。「画像を開く」から、右クリックまたは長押しして画像を保存してください。");
    } finally { setSavingImage(false); }
  }
  return <section className="sns-draft-panel" aria-label={instagram ? "Instagramの投稿準備" : "Xの投稿準備"}>
    <strong>{instagram ? "Instagram" : "X"}</strong>
    {compact ? <details ref={draftText}><summary>投稿文を確認</summary><p className="social-draft-text">{text}</p></details> : null}
    {instagram ? <small>{imageUrl
      ? "画像を保存してからInstagramを開き、「作成」で保存したファイルを選びます。キャプションに文面を貼り付けてください。"
      : "添付する告知画像を端末に用意し、Instagramの「作成」で選んでください。"}</small> : null}
    <div className="deploy-status-actions">
      {!instagram ? <a className="primary-button" href={xPostUrl(text)} target="_blank" rel="noreferrer">Xの投稿画面を開く</a> : null}
      {imageUrl ? <button className="secondary-button" type="button" disabled={savingImage} onClick={() => void saveImage()}>{savingImage ? "画像を保存中…" : instagram ? "告知画像を保存" : "画像を保存"}</button> : null}
      {instagram ? <a className="primary-button" href="https://www.instagram.com/" target="_blank" rel="noreferrer" onClick={text ? () => void copy(true) : undefined}>{text ? "文面をコピーしてInstagramを開く" : "Instagramを開く"}</a> : null}
      <button className="secondary-button" type="button" disabled={!text} onClick={() => void copy()}>投稿文をコピー</button>
      {imageUrl ? <a href={imageUrl} target="_blank" rel="noreferrer">画像を開く</a> : null}
    </div>
    {!instagram ? <small>店舗アカウントで内容を確認し、投稿を確定します。</small> : null}
    {imageMessage ? <p role="status">{imageMessage}</p> : null}
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
