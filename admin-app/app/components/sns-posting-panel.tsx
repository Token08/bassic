"use client";

import { useRef, useState } from "react";
import { xPostUrl } from "@/lib/event-handoff";

export function SnsPostingPanel({ platform, text, imageUrl, eventTitle, compact = false }: { platform: string; text: string; imageUrl: string; eventTitle?: string; compact?: boolean }) {
  const instagram = platform === "instagram";
  const [message, setMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const draftText = useRef<HTMLDetailsElement>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(instagram ? "文面をコピーしました。Instagramのキャプション欄で貼り付けてください。" : "投稿文をコピーしました。");
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
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setImageMessage(instagram
        ? `ファイル名は「${link.download}」です。`
        : `ブラウザのダウンロード一覧で「${link.download}」の保存先を確認できます。`);
    } catch {
      setImageMessage(instagram
        ? "自動で保存できませんでした。「画像を開く」から、画像をControlキーを押しながらクリックして保存してください。"
        : "自動で保存できませんでした。「画像を開く」から、右クリックまたは長押しして画像を保存してください。");
    } finally { setSavingImage(false); }
  }
  const imageActions = imageUrl ? <>
    <button className="secondary-button" type="button" disabled={savingImage} onClick={() => void saveImage()}>{savingImage ? "画像を保存中…" : instagram ? "告知画像を保存" : "画像を保存"}</button>
    <a href={imageUrl} target="_blank" rel="noreferrer">画像を開く</a>
  </> : null;
  const copyButton = <button className="secondary-button" type="button" disabled={!text} onClick={() => void copy()}>投稿文をコピー</button>;

  if (instagram) return <section className="sns-draft-panel" aria-label="Instagramの投稿準備">
    <strong>Instagram</strong>
    <ol className="instagram-post-steps">
      <li>
        {imageUrl ? <>
          <div className="deploy-status-actions">{imageActions}</div>
          <small>Safariでは右上のダウンロード一覧を開き、ファイル名の横の虫眼鏡でFinderに表示できます。</small>
          {imageMessage ? <p role="status">{imageMessage}</p> : null}
        </> : <strong>添付する告知画像を端末に用意</strong>}
      </li>
      <li>
        {copyButton}
        {text ? <details ref={draftText}><summary>投稿文を確認</summary><p className="social-draft-text">{text}</p></details> : null}
        {message ? <p role="status">{message}</p> : null}
      </li>
      <li>
        <a className="primary-button" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagramを開く</a>
        <small>「作成」→「投稿」→「コンピューターから選択」で画像を添付。「次へ」で進み、キャプションに ⌘V で貼り付けてから「シェア」で投稿します。</small>
      </li>
    </ol>
  </section>;

  return <section className="sns-draft-panel" aria-label="Xの投稿準備">
    <strong>X</strong>
    {compact ? <details ref={draftText}><summary>投稿文を確認</summary><p className="social-draft-text">{text}</p></details> : null}
    <div className="deploy-status-actions">
      <a className="primary-button" href={xPostUrl(text)} target="_blank" rel="noreferrer">Xの投稿画面を開く</a>
      {copyButton}
      {imageActions}
    </div>
    <small>店舗アカウントで内容を確認し、投稿を確定します。</small>
    {imageMessage ? <p role="status">{imageMessage}</p> : null}
    {message ? <p role="status">{message}</p> : null}
  </section>;
}
