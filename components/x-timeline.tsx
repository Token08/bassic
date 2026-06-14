"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const X_WIDGET_SCRIPT = "https://platform.twitter.com/widgets.js";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

type XTimelineProps = {
  href: string;
  account: string;
  buttonLabel: string;
};

export function XTimeline({ href, account, buttonLabel }: XTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    setShowFallback(false);

    const loadTimeline = () => {
      window.twttr?.widgets?.load(container);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${X_WIDGET_SCRIPT}"]`);

    if (window.twttr?.widgets) {
      loadTimeline();
    } else if (existingScript) {
      existingScript.addEventListener("load", loadTimeline, { once: true });
      existingScript.addEventListener("error", () => setShowFallback(true), { once: true });
    } else {
      const script = document.createElement("script");
      script.src = X_WIDGET_SCRIPT;
      script.async = true;
      script.charset = "utf-8";
      script.onload = loadTimeline;
      script.onerror = () => setShowFallback(true);
      document.body.appendChild(script);
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!container.querySelector("iframe")) {
        setShowFallback(true);
      }
    }, 8000);

    return () => {
      window.clearTimeout(fallbackTimer);
      existingScript?.removeEventListener("load", loadTimeline);
    };
  }, [href]);

  return (
    <div className="social-embed-frame x-timeline-frame" ref={containerRef}>
      <a
        className="twitter-timeline"
        data-height="620"
        data-theme="light"
        data-chrome="noheader nofooter transparent"
        href={href}
      >
        Posts by {account}
      </a>

      {showFallback ? (
        <div className="x-timeline-fallback">
          <div>
            <p className="social-profile-kicker">{account}</p>
            <h3>X</h3>
            <p>X側の表示制限が出る場合は、公式ページで最新情報を確認できます。</p>
          </div>
          <a className="social-profile-button" href={href} target="_blank" rel="noreferrer">
            {buttonLabel} <ExternalLink size={15} />
          </a>
        </div>
      ) : null}
    </div>
  );
}
