"use client";

import { useEffect, useRef, useState } from "react";
import { resolvePublicUrl } from "@/lib/public-site-url";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function PdfField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => () => { request.current?.abort(); }, []);
  const safeUrl = value.startsWith("/assets/pdf/") || /^https:\/\//i.test(value);
  async function upload(file: File) {
    if (request.current) return;
    setError(""); setMessage("");
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) { setError("PDFファイルを選んでください。"); return; }
    if (!file.size || file.size > 3 * 1024 * 1024) { setError("PDFは3MB以内にしてください。"); return; }
    const controller = new AbortController();
    request.current = controller;
    const original = value;
    setBusy(true);
    try {
      const body = new FormData(); body.set("file", file);
      const response = await fetchWithTimeout("/api/pdf", { method: "POST", body, signal: controller.signal }, 45000);
      const result = await response.json();
      if (!response.ok || !result.ok || !result.data?.url) throw new Error(result.message || "PDFをアップロードできませんでした。");
      if (controller.signal.aborted) return;
      if (latest.current !== original) { setMessage("入力したURLを残しました。PDFを使う場合はもう一度選んでください。"); return; }
      change.current(result.data.url);
      setMessage("PDFを用意しました。開いて確認し、掲載へ進んでください。");
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "PDFをアップロードできませんでした。");
    } finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  return <div className="pdf-field">
    {value && safeUrl ? <a className="field-link-check" href={resolvePublicUrl(value, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp")} target="_blank" rel="noreferrer">PDFを開いて確認</a> : null}
    <label className="upload-button">{busy ? "PDFを準備中…" : "PDFを選ぶ"}<input id={id} type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.currentTarget.value = ""; if (file) void upload(file); }} /></label>
    <small>PDF・3MB以内。選んだだけでは掲載先は変わりません。</small>
    <details><summary>URLで指定</summary><input aria-label="PDFリンク" type="url" value={value} onChange={e => onChange(e.target.value)} /></details>
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert" className="form-error">{error}</p> : null}
  </div>;
}
