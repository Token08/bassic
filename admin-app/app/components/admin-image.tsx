"use client";

import { useState } from "react";
import { resolvePublicUrl } from "@/lib/public-site-url";

const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/";

/** Shared preview for current images, replacements, and section thumbnails. */
export function AdminImage({ src, alt = "", className, compact = false }: { src: string; alt?: string; className?: string; compact?: boolean }) {
  const [failedSource, setFailedSource] = useState<string>();
  const url = resolvePublicUrl(src, publicSiteUrl);
  return failedSource === url ? (
    <span className="image-unavailable" role="status">
      <strong>画像を表示できません</strong>
      {!compact ? <small>別の画像を選ぶか、画像URLを確認してください。</small> : null}
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={url} alt={alt} onError={() => setFailedSource(url)} />
  );
}
