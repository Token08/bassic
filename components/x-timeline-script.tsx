"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

export function XTimelineScript() {
  useEffect(() => {
    window.twttr?.widgets?.load();
  }, []);

  return (
    <Script
      src="https://platform.twitter.com/widgets.js"
      strategy="afterInteractive"
      onLoad={() => window.twttr?.widgets?.load()}
    />
  );
}
