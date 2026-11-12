"use client";

import { useState } from "react";
import { xPostUrl } from "@/lib/event-handoff";

export function SnsPostingPanel({ platform, text, imageUrl }: { platform: string; text: string; imageUrl: string }) {
  const [message, setMessage] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  async function copy(openInstagram = false) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(openInstagram ? "文面をコピーしました。Instagramの「作成」から画像を選び、文面を貼り付けてください。" : "投稿文をコピーしました。");
    } catch {
      setMessage("コピーできませんでした。投稿文の入力欄からコピーしてください。");
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
      setMessage("「画像を開く」から、右クリック→「名前を付けて画像を保存」を使ってください。");
    } finally { setSavingImage(false); }
  }
  return <section className="sns-draft-panel" aria-label="SNSへの投稿準備">
    <strong>{platform === "x" ? "Xへ投稿" : "Instagramへ投稿"}</strong>
    <p>{platform === "x" ? "文面を入れた投稿画面を開きます。画像は投稿画面で添付します。" : "文面をコピーしてInstagramを開きます。「作成」から画像を選び、文面を貼り付けます。"}</p>
    <div className="deploy-status-actions">
      {platform === "x" ? <a className="primary-button" href={xPostUrl(text)} target="_blank" rel="noreferrer">Xで投稿する</a> : <a className="primary-button" href="https://www.instagram.com/" target="_blank" rel="noreferrer" onClick={() => void copy(true)}>文面をコピーしてInstagramを開く</a>}
      <button className="secondary-button" type="button" disabled={!text} onClick={() => void copy()}>投稿文をコピー</button>
      {imageUrl ? <>
        <button className="secondary-button" type="button" disabled={savingImage} onClick={() => void saveImage()}>{savingImage ? "画像を保存中…" : "画像をPCに保存"}</button>
        <a href={imageUrl} target="_blank" rel="noreferrer">画像を開く</a>
      </> : null}
    </div>
    <small>店舗のアカウントであることを確認し、最後に各SNSの投稿ボタンを押してください。この画面では投稿済みとは判定しません。</small>
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
