"use client";

import { useEffect, useRef, useState } from "react";

const sectionSelectors: Record<string, string> = {
  header: ".site-header",
  hero: ".page-hero",
  firstVisit: ".intro",
  visitInfo: ".visit-info-strip",
  localSearch: ".local-search-section",
  social: ".social-section",
  access: ".access-section",
  footer: ".footer",
  mobile: ".mobile-cta",
  "event-list": "[aria-labelledby='upcoming-events-heading'], .upcoming-events",
  calendar: ".event-calendar-section, .calendar-section, section:has(iframe[src*='calendar.google.com'])",
  drinkSheets: ".drink-menu-block, .drink-menu-section",
  foodMenu: ".menu-block:has(.menu-card-grid), .food-menu-section",
  plans: ".plan-grid",
  equipmentRental: ".equipment-rental-card",
  accessInfo: ".access-section",
  "オンラインストアURL": ".desktop-nav a[href*='store'], .desktop-nav a[href*='base.shop'], .desktop-nav a[href*='thebase.in']"
};

type Target = { key: string; label: string };

function makeFrameHtml(html: string, url: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, base, meta[http-equiv], link[rel='preload'][as='script'], link[rel='modulepreload']").forEach((node) => node.remove());
  const base = doc.createElement("base");
  base.href = url;
  doc.head.prepend(base);
  const style = doc.createElement("style");
  style.textContent = `
    [data-bassic-edit] { cursor: pointer; outline-offset: -3px; }
    [data-bassic-edit]:hover, [data-bassic-edit]:focus-visible { outline: 3px dashed #e9aa42; }
    [data-bassic-edit][aria-pressed="true"] { outline: 3px solid #e9aa42; }
    iframe { pointer-events: none; }
    html { scroll-behavior: auto !important; overscroll-behavior: contain; }
    body { overscroll-behavior: contain; }
  `;
  doc.head.append(style);
  return "<!doctype html>" + doc.documentElement.outerHTML;
}

export function PublicPageCanvas({
  path, title, targets, selected, onSelect, revision
}: {
  path: string;
  title: string;
  targets: Target[];
  selected?: string;
  onSelect: (key: string) => void;
  revision?: string;
}) {
  const [device, setDevice] = useState<"desktop" | "phone">();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ request: string; html?: string }>({ request: "" });
  const [loadedFrame, setLoadedFrame] = useState("");
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const frame = useRef<HTMLIFrameElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const request = JSON.stringify([path, retry, revision]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/site-preview?" + new URLSearchParams({ path }), { signal: controller.signal });
        if (!response.ok) throw new Error("Preview unavailable");
        const { html, url } = await response.json() as { html: string; url: string };
        if (!controller.signal.aborted) setResult({ request, html: makeFrameHtml(html, url) });
      } catch {
        if (!controller.signal.aborted) setResult({ request });
      }
    })();
    return () => controller.abort();
  }, [path, request]);

  useEffect(() => {
    if (!wrapper.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setFrameSize({ width, height });
    });
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, [result.html]);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc || !result.html || result.request !== request || loadedFrame !== result.html) return;
    const restore: Array<() => void> = [];
    for (const target of targets) {
      let element = [...doc.querySelectorAll("[data-public-section]")].find((node) => node.getAttribute("data-public-section") === target.key);
      if (!element && sectionSelectors[target.key]) element = doc.querySelector(sectionSelectors[target.key]) || undefined;
      if (!element && target.key.startsWith("custom-")) {
        const matches = [...doc.querySelectorAll(".custom-section")].filter((section) => section.querySelector("h2")?.textContent?.trim() === target.label);
        if (matches.length === 1) element = matches[0];
      }
      if (!element || element.hasAttribute("data-bassic-edit")) continue;
      const attributes = ["data-bassic-edit", "tabindex", "role", "aria-label", "aria-labelledby", "aria-pressed"];
      const node = element;
      const original = attributes.map((attribute) => node.getAttribute(attribute));
      restore.push(() => attributes.forEach((attribute, index) => {
        const value = original[index];
        if (value === null) node.removeAttribute(attribute);
        else node.setAttribute(attribute, value);
      }));
      element.setAttribute("data-bassic-edit", target.key);
      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "button");
      element.removeAttribute("aria-labelledby");
      element.setAttribute("aria-label", target.label + "を編集");
      element.setAttribute("aria-pressed", String(target.key === selected));
    }
    function handleClick(event: Event) {
      event.preventDefault();
      event.stopPropagation();
      const target = event.target as Element | null;
      const key = target?.closest?.("[data-bassic-edit]")?.getAttribute("data-bassic-edit");
      if (key) selectRef.current(key);
    }
    function handleKey(event: KeyboardEvent) {
      const target = event.target as Element | null;
      if ((event.key === "Enter" || event.key === " ") && target?.closest?.("[data-bassic-edit]")) handleClick(event);
    }
    doc.addEventListener("click", handleClick, true);
    doc.addEventListener("submit", handleClick, true);
    doc.addEventListener("keydown", handleKey);
    return () => {
      doc.removeEventListener("click", handleClick, true);
      doc.removeEventListener("submit", handleClick, true);
      doc.removeEventListener("keydown", handleKey);
      restore.forEach((restoreAttributes) => restoreAttributes());
    };
  }, [loadedFrame, request, result, selected, targets]);

  const mobile = device ? device === "phone" : frameSize.width > 0 && frameSize.width < 500;
  const scale = mobile || !frameSize.width ? 1 : Math.min(1, frameSize.width / 1100);
  return (
    <section className="public-page-canvas" aria-label="公開ページを見ながら編集">
      <div className="public-canvas-toolbar">
        <strong>{title}</strong>
        <div role="group" aria-label="公開ページの表示幅">
          <button type="button" className="secondary-button compact" aria-pressed={!mobile} onClick={() => setDevice("desktop")}>PC表示</button>
          <button type="button" className="secondary-button compact" aria-pressed={mobile} onClick={() => setDevice("phone")}>スマホ表示</button>
          <button type="button" className="secondary-button compact" onClick={() => setRetry((value) => value + 1)}>再読み込み</button>
        </div>
      </div>
      {result.request !== request ? <p role="status">公開ページを読み込んでいます。</p> : result.html ? (
        <div ref={wrapper} className="public-canvas-frame-wrap">
          <iframe
            ref={frame}
            title={title + "の公開ページ"}
            className={mobile ? "public-canvas-frame phone" : "public-canvas-frame"}
            style={scale < 1 ? { width: 1100, height: frameSize.height / scale, transform: `scale(${scale})` } : undefined}
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            srcDoc={result.html}
            onLoad={() => setLoadedFrame(result.html || "")}
          />
        </div>
      ) : (
        <div className="public-canvas-error" role="status">
          <p>公開ページを表示できませんでした。右の編集箇所一覧からも編集できます。</p>
          <button type="button" className="secondary-button compact" onClick={() => setRetry((value) => value + 1)}>再読み込み</button>
        </div>
      )}
    </section>
  );
}
