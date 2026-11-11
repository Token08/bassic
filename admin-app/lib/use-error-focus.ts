"use client";

import { useEffect, useRef } from "react";

/** Reveal a new failure once; typing corrections must not move focus again. */
export function useErrorFocus<T extends HTMLElement>(active: boolean, revision: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    ref.current.focus({ preventScroll: true });
    ref.current.scrollIntoView({ block: "start", behavior: "auto" });
  }, [active, revision]);
  return ref;
}
