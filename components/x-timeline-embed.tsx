"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { ExternalLink } from "lucide-react";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

type XTimelineEmbedProps = {
  href: string;
  fallbackLabel: string;
};

export function XTimelineEmbed({ href, fallbackLabel }: XTimelineEmbedProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const loadTimeline = () => {
    window.twttr?.widgets?.load(frameRef.current || undefined);
  };

  useEffect(() => {
    loadTimeline();
    const retry = window.setTimeout(loadTimeline, 1200);
    return () => window.clearTimeout(retry);
  }, []);

  return (
    <div className="social-embed-frame x-timeline-frame" ref={frameRef}>
      <a
        className="twitter-timeline"
        data-height="620"
        data-theme="dark"
        data-chrome="noheader nofooter noborders transparent"
        data-dnt="true"
        href={href}
      >
        Posts by bar_Bassic
      </a>
      <a className="x-timeline-direct-link" href={href} target="_blank" rel="noreferrer">
        {fallbackLabel} <ExternalLink size={14} />
      </a>
      <Script src="https://platform.twitter.com/widgets.js" strategy="afterInteractive" onLoad={loadTimeline} />
    </div>
  );
}
