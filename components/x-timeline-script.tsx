"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

export function XTimelineScript() {
  const loadTimeline = () => {
    const container = document.querySelector<HTMLElement>(".x-frame");
    window.twttr?.widgets?.load(container || undefined);
  };

  useEffect(() => {
    loadTimeline();
    const timeout = window.setTimeout(loadTimeline, 1200);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <Script
      src="https://platform.twitter.com/widgets.js"
      strategy="afterInteractive"
      onLoad={loadTimeline}
    />
  );
}
