"use client";

import { useEffect, useState } from "react";
import { SnsPostingPanel } from "./sns-posting-panel";
import { resolvePublicUrl } from "@/lib/public-site-url";

type Draft = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
function imageLink(value: string) {
  try {
    const url = new URL(resolvePublicUrl(value, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/"));
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

/** Read saved drafts, including staff edits; never generate or publish here. */
export function EventSocialActions({ sourceId, revision, onEdit }: { sourceId: string; revision: string; onEdit?: () => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let sequence = 0;
    async function load() {
      const current = ++sequence;
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/content/social-notices", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        const body = await response.json();
        if (!response.ok || !body.ok || !Array.isArray(body.data?.contents)) throw Error();
        const related = body.data.contents.filter((item: Draft) => text(item.sourceEventId) === sourceId);
        if (!controller.signal.aborted && current === sequence) setDrafts(related);
      } catch {
        if (!controller.signal.aborted && current === sequence) { setDrafts([]); setError("下書きを読み込めませんでした。"); }
      } finally { if (!controller.signal.aborted && current === sequence) setLoading(false); }
    }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("bassic-social-draft-saved", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("bassic-social-draft-saved", refresh);
    };
  }, [sourceId, revision, attempt]);
  return <section aria-label="SNSで使う" className="event-social-completion">
    <h3>SNSで使う</h3>
    {error ? <p role="alert">{error} <button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>もう一度読み込む</button></p> : null}
    {loading ? <p role="status">保存済みの文面を読み込み中…</p> : !error ? <div className="event-social-actions">
      {["x", "instagram"].map(platform => {
        const matches = drafts.filter(item => item.platform === platform);
        if (matches.length !== 1 || !text(matches[0].postText)) return <div key={platform} className="sns-draft-panel"><strong>{platform === "x" ? "X" : "Instagram"}</strong><p>{matches.length > 1 ? "下書きが重複しています。担当者に確認してください。" : "下書きを確認できませんでした。"}</p></div>;
        const draft = matches[0];
        const image = draft.image;
        const rawImage = typeof image === "object" && image ? text((image as Draft).url) : text(image);
        const imageUrl = rawImage ? imageLink(rawImage) : "";
        return <SnsPostingPanel key={platform} platform={platform} text={text(draft.postText)} imageUrl={imageUrl} compact />;
      })}
    </div> : null}
    {onEdit ? <button type="button" className="text-button" onClick={onEdit}>下書きを編集する</button> : null}
  </section>;
}
