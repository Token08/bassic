import {
  createElement,
  cloneElement,
  isValidElement,
  Fragment,
  type ReactNode,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
export type VisualStyle = Partial<
  Record<
    | "color"
    | "backgroundColor"
    | "fontSize"
    | "lineHeight"
    | "padding"
    | "margin"
    | "letterSpacing"
    | "gap"
    | "borderRadius"
    | "borderColor"
    | "borderWidth"
    | "fontFamily"
    | "fontWeight"
    | "textAlign"
    | "objectPosition"
    | "height"
    | "width"
    | "maxWidth"
    | "gridTemplateColumns"
    | "flexDirection"
    | "animationDuration"
    | "opacity"
    | "boxShadow"
    | "display",
    string
  >
>;
export type VisualPatch = {
  mobileImage?: string;
  mailSubject?: string;
  mailBody?: string;
  backgroundMode?: "image" | "color";
  texts?: Record<string, string>;
  attrs?: Record<string, string>;
  style?: VisualStyle;
  mobile?: VisualStyle;
  before?: VisualStyle;
  after?: VisualStyle;
  mobileBefore?: VisualStyle;
  mobileAfter?: VisualStyle;
  beforeText?: string;
  afterText?: string;
  hidden?: boolean;
  order?: string[];
  copies?: { id: string; source: string }[];
  blocks?: {
    id: string;
    kind: "text" | "photo" | "card" | "button";
    title: string;
    body: string;
    image?: string;
    href?: string;
  }[];
};
export type VisualPage = {
  nodes: Record<string, VisualPatch>;
  baseStyle?: VisualStyle;
  mobileBaseStyle?: VisualStyle;
  dialogStyle?: VisualStyle;
  dialogButtonStyle?: VisualStyle;
  dialogCaptionStyle?: VisualStyle;
  interactions?: {
    close?: string;
    previous?: string;
    next?: string;
    title?: string;
  };
  theme?: Record<string, string>;
  meta?: { title?: string; description?: string; image?: string };
};
export type VisualSettings = {
  version: 1;
  revision?: string;
  previous?: VisualSettings;
  shared: VisualPage;
  pages: Record<string, VisualPage>;
};
export const emptyVisualSettings = (): VisualSettings => ({
  version: 1,
  shared: { nodes: {} },
  pages: {},
});
export function mergeVisualPatch(
  shared?: VisualPatch,
  local?: VisualPatch,
): VisualPatch {
  return {
    ...shared,
    ...local,
    texts: { ...shared?.texts, ...local?.texts },
    attrs: { ...shared?.attrs, ...local?.attrs },
    style: { ...shared?.style, ...local?.style },
    mobile: { ...shared?.mobile, ...local?.mobile },
  };
}
export type VisualNode = {
  id: string;
  parent: string;
  section: string;
  tag: string;
  label: string;
  texts: Record<string, string>;
  attrs: Record<string, string>;
  children: string[];
  record?: string;
  hidden?: boolean;
  sourceTexts?: Record<string, string>;
  sourceAttrs?: Record<string, string>;
};
export const visualPaths = [
  "/",
  "/events/",
  "/menu/",
  "/party/",
  "/access/",
  "/first-visit/",
];
export function allowedVisualPath(path: string) {
  return (
    /^\/(?:(?:en|ko|zh-hant|zh-hans)\/)?(?:(?:events|menu|party|access|first-visit)\/)?$/.test(
      path,
    ) && !/^\/(en|ko|zh-hant|zh-hans)\/first-visit\/$/.test(path)
  );
}
const styleKeys = new Set([
  "color",
  "backgroundColor",
  "fontSize",
  "lineHeight",
  "padding",
  "margin",
  "letterSpacing",
  "gap",
  "borderRadius",
  "borderColor",
  "borderWidth",
  "fontFamily",
  "fontWeight",
  "textAlign",
  "objectPosition",
  "height",
  "width",
  "maxWidth",
  "gridTemplateColumns",
  "flexDirection",
  "animationDuration",
  "opacity",
  "boxShadow",
  "display",
]);
export function validVisualUrl(value: string, image = false) {
  return (
    value === "" ||
    (/^\/(?!\/)/.test(value) && !/[\s<>"']/.test(value)) ||
    (/^https:\/\//.test(value) && !/[<>"']/.test(value)) ||
    (!image && /^(?:tel:[+\d()-]+|mailto:[^\s<>"']+)$/.test(value))
  );
}
export function parseVisualSettings(value: unknown): VisualSettings {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("設定の形式を確認してください。");
  const data = JSON.parse(JSON.stringify(value)) as VisualSettings;
  if (
    data.version !== 1 ||
    !data.shared ||
    !data.pages ||
    Array.isArray(data.pages) ||
    Array.isArray(data.shared)
  )
    throw Error("設定のバージョンを確認してください。");
  if (JSON.stringify(data).length > 500000) throw Error("設定が大きすぎます。");
  const check = (page: VisualPage) => {
    if (
      !page.nodes ||
      typeof page.nodes !== "object" ||
      Array.isArray(page.nodes)
    )
      throw Error("編集項目を確認してください。");
    for (const [id, p] of Object.entries(page.nodes)) {
      if (!p || typeof p !== "object" || Array.isArray(p) || id.length > 1000)
        throw Error("編集対象を確認してください。");
      for (const value of [
        p.texts,
        p.attrs,
        p.style,
        p.mobile,
        p.before,
        p.after,
        p.mobileBefore,
        p.mobileAfter,
      ])
        if (
          value !== undefined &&
          (!value || typeof value !== "object" || Array.isArray(value))
        )
          throw Error("編集内容の形式を確認してください。");
      if (
        (p.mailSubject !== undefined && typeof p.mailSubject !== "string") ||
        (p.mailBody !== undefined && typeof p.mailBody !== "string")
      )
        throw Error("メールの案内を確認してください。");
      if (
        p.mobileImage !== undefined &&
        (typeof p.mobileImage !== "string" ||
          !validVisualUrl(p.mobileImage, true))
      )
        throw Error("スマホ画像を確認してください。");
      if (
        p.backgroundMode !== undefined &&
        !["image", "color"].includes(p.backgroundMode)
      )
        throw Error("背景を確認してください。");
      if (!/^[a-zA-Z0-9_.~-]+$/.test(id) || !p || typeof p !== "object")
        throw Error("編集対象を確認してください。");
      for (const style of [
        p.style,
        p.mobile,
        p.before,
        p.after,
        p.mobileBefore,
        p.mobileAfter,
      ])
        for (const [key, val] of Object.entries(style || {})) {
          if (
            !styleKeys.has(key) ||
            typeof val !== "string" ||
            val.length > 160 ||
            /[{};<>\\]|url\s*\(|expression|@import/i.test(val)
          )
            throw Error("見た目の設定を確認してください。");
        }
      for (const [key, val] of Object.entries(p.attrs || {})) {
        if (
          !["src", "href", "alt", "title", "aria-label"].includes(key) ||
          typeof val !== "string" ||
          val.length > 4000 ||
          (["src", "href"].includes(key) && !validVisualUrl(val, key === "src"))
        )
          throw Error("リンク・画像の設定を確認してください。");
      }
      if (Object.keys(p.texts || {}).some((key) => !/^\d+$/.test(key)))
        throw Error("文章の編集箇所を確認してください。");
      for (const v of Object.values(p.texts || {}))
        if (typeof v !== "string" || v.length > 20000)
          throw Error("文章が長すぎます。");
      if (
        (p.beforeText !== undefined && typeof p.beforeText !== "string") ||
        (p.afterText !== undefined && typeof p.afterText !== "string")
      )
        throw Error("装飾の文字を確認してください。");
      if (
        p.order &&
        (!Array.isArray(p.order) ||
          !p.order.every(
            (x) => typeof x === "string" && /^[\w.~-]+$/.test(x),
          ) ||
          new Set(p.order).size !== p.order.length)
      )
        throw Error("表示順を確認してください。");
      if ((p.copies?.length || 0) > 100 || (p.blocks?.length || 0) > 100)
        throw Error("項目は100件まで追加できます。");
      if (
        (p.copies && !Array.isArray(p.copies)) ||
        (p.blocks && !Array.isArray(p.blocks)) ||
        (p.hidden !== undefined && typeof p.hidden !== "boolean")
      )
        throw Error("追加・表示の設定を確認してください。");
      for (const c of p.copies || [])
        if (
          c.id === id ||
          !c.id.startsWith(id + ".") ||
          !c.source.startsWith(id + ".") ||
          c.source === c.id ||
          !/^[\w.~-]+$/.test(c.id) ||
          !/^[\w.~-]+$/.test(c.source)
        )
          throw Error("複製の設定を確認してください。");
      const newIds = [
        ...(p.copies || []).map((x) => x.id),
        ...(p.blocks || []).map((x) => x.id),
      ];
      if (new Set(newIds).size !== newIds.length)
        throw Error("追加した項目が重複しています。");
      for (const b of p.blocks || [])
        if (
          b.id === id ||
          !b.id.startsWith(id + ".") ||
          !["text", "photo", "card", "button"].includes(b.kind) ||
          !/^[\w.~-]+$/.test(b.id) ||
          typeof b.title !== "string" ||
          typeof b.body !== "string" ||
          (b.image && !validVisualUrl(b.image, true)) ||
          (b.href && !validVisualUrl(b.href))
        )
          throw Error("追加した案内を確認してください。");
    }
    for (const part of [
      page.baseStyle,
      page.mobileBaseStyle,
      page.dialogStyle,
      page.dialogButtonStyle,
      page.dialogCaptionStyle,
    ])
      for (const [key, val] of Object.entries(part || {}))
        if (
          !styleKeys.has(key) ||
          typeof val !== "string" ||
          val.length > 160 ||
          /[{};<>\\]|url\s*\(|expression|@import/i.test(val)
        )
          throw Error("共通デザインを確認してください。");
    for (const val of Object.values(page.interactions || {}))
      if (typeof val !== "string" || val.length > 100)
        throw Error("画像操作の表示名を確認してください。");
    for (const [key, v] of Object.entries(page.theme || {}))
      if (
        ![
          "ink",
          "paper",
          "paper-strong",
          "muted",
          "gold",
          "red",
          "red-bright",
          "ivory",
          "night",
          "night-soft",
        ].includes(key) ||
        !/^#[0-9a-f]{6}$/i.test(v)
      )
        throw Error("共通の色を確認してください。");
    if (page.meta) {
      for (const v of Object.values(page.meta))
        if (typeof v !== "string" || v.length > 4000)
          throw Error("検索・共有表示を確認してください。");
      if (page.meta.image && !validVisualUrl(page.meta.image, true))
        throw Error("共有画像を確認してください。");
    }
  };
  check(data.shared);
  for (const [path, page] of Object.entries(data.pages)) {
    if (!allowedVisualPath(path)) throw Error("対象ページを確認してください。");
    check(page);
  }
  return data;
}
function token(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
  }
  return (
    value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50) +
    "-" +
    (hash >>> 0).toString(36)
  );
}
function flatChildren(value: ReactNode, prefix = ""): ReactNode[] {
  if (Array.isArray(value))
    return value.flatMap((x) => flatChildren(x, prefix));
  if (isValidElement(value) && value.type === Fragment) {
    const el = value as React.ReactElement<{ children?: ReactNode }>;
    return flatChildren(el.props.children, prefix + (el.key || "")).map(
      (x, i) =>
        isValidElement(x) && el.key != null
          ? cloneElement(x, { key: prefix + el.key + "-" + (x.key || i) })
          : x,
    );
  }
  return [value];
}
export function renderVisualTree(
  input: ReactNode,
  path: string,
  settings: VisualSettings,
  preview = false,
  sourceValues: Record<string, unknown> = {},
) {
  function materialize(value: ReactNode): ReactNode {
    if (Array.isArray(value)) return value.map(materialize);
    if (!isValidElement(value)) return value;
    const el = value as React.ReactElement<Record<string, unknown>>;
    if (
      el.type !== Image &&
      el.type !== Link &&
      typeof el.type === "function" &&
      !(el.type as { $$typeof?: symbol }).$$typeof
    ) {
      const output = (el.type as (p: Record<string, unknown>) => ReactNode)({
        ...el.props,
        pathname: path,
      });
      if (output && typeof output === "object" && "then" in output)
        throw Error("編集対象を同期表示部品にしてください。");
      const rendered = materialize(output);
      return isValidElement(rendered) && el.key != null
        ? cloneElement(rendered, { key: el.key })
        : rendered;
    }
    if (el.type === Fragment) return materialize(flatChildren(el));
    return el;
  }
  const catalog: VisualNode[] = [],
    css: string[] = [],
    page = settings.pages[path] || { nodes: {} };
  const styleText = (s: VisualStyle) =>
    Object.entries(s)
      .map(
        ([k, v]) =>
          `${k === "backgroundColor" ? "background" : k.replace(/[A-Z]/g, (x) => "-" + x.toLowerCase())}:${v}`,
      )
      .join(";");
  const commonStyle = { ...settings.shared.baseStyle, ...page.baseStyle },
    commonMobile = {
      ...settings.shared.mobileBaseStyle,
      ...page.mobileBaseStyle,
    };
  if (Object.keys(commonStyle).length) {
    css.push(`body{${styleText(commonStyle)}}`);
    if (commonStyle.fontSize)
      css.push(`html{font-size:${commonStyle.fontSize}}`);
    if (commonStyle.fontFamily)
      css.push(
        `h1,h2,h3,h4,h5,h6,button,a{font-family:${commonStyle.fontFamily}}`,
      );
  }
  if (Object.keys(commonMobile).length)
    css.push(`@media(max-width:767px){body{${styleText(commonMobile)}}}`);
  for (const [key, selector] of [
    ["dialogStyle", ".native-image-modal"],
    ["dialogButtonStyle", ".native-image-modal button"],
    ["dialogCaptionStyle", ".native-image-modal figcaption"],
  ] as const) {
    const styles = { ...settings.shared[key], ...page[key] };
    if (Object.keys(styles).length)
      css.push(`${selector}{${styleText(styles)}}`);
  }
  const theme = { ...settings.shared.theme, ...page.theme };
  if (Object.keys(theme).length)
    css.push(
      `:root{${Object.entries(theme)
        .map(([k, v]) => `--${k}:${v}`)
        .join(";")}}`,
    );
  if (theme.night)
    css.push(
      `:root{--section-dark-bg:${theme.night}}body{background:${theme.night}}`,
    );
  if (theme.paper) css.push(`:root{--section-light-bg:${theme.paper}}`);
  function visit(
    value: ReactNode,
    id: string,
    parent = "",
    section = "",
    record?: string,
  ): ReactNode {
    if (Array.isArray(value))
      return value.map((x, i) =>
        visit(
          x,
          `${id}.${isValidElement(x) && x.key ? token(String(x.key)) : i}`,
          parent,
          section,
          record,
        ),
      );
    if (!isValidElement(value)) return value;
    const el = value as React.ReactElement<Record<string, unknown>>;
    const p = { ...el.props };
    let type = el.type as unknown;
    if (type === Fragment)
      return visit(p.children as ReactNode, id, parent, section, record);
    if (type === Link) {
      type = "a";
      delete p.prefetch;
    }
    if (type === Image) {
      type = "img";
      p.loading = p.priority ? "eager" : p.loading || "lazy";
      if (p.priority) p.fetchPriority = "high";
      const src = p.src as string | { src: string };
      p.src = typeof src === "object" ? src.src : src;
      if (p.fill) {
        p.style = {
          position: "absolute",
          height: "100%",
          width: "100%",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          color: "transparent",
          ...((p.style as object) || {}),
        };
        delete p.fill;
      }
      delete p.priority;
      delete p.quality;
      delete p.unoptimized;
      delete p.placeholder;
      delete p.blurDataURL;
    }
    if (typeof type === "function") {
      if ((type as { $$typeof?: symbol }).$$typeof) {
        if (preview) return null;
        return el;
      }
      const output = (type as (props: Record<string, unknown>) => ReactNode)({
        ...p,
        pathname: path,
      });
      if (output && typeof output === "object" && "then" in output)
        throw Error("編集用の表示は同期部品で構成してください。");
      return visit(output, id, parent, section, record);
    }
    if (typeof type !== "string") {
      // Icons remain their original React component, with the same editable wrapper in both renderers.
      const iconId = id + ".icon";
      return visit(
        createElement("span", { "data-visual-icon": "true", children: el }),
        iconId,
        parent,
        section,
        record,
      );
    }
    const cls = String(p.className || "");
    const tag = type;
    const hiddenKind = ["script", "style"].includes(tag);
    if (hiddenKind) return el;
    const shared =
      tag === "header" ||
      tag === "footer" ||
      cls === "mobile-cta" ||
      id.startsWith("shared-");
    if (shared && !id.startsWith("shared-"))
      id =
        "shared-" +
        token(
          tag === "header" ? "header" : tag === "footer" ? "footer" : "mobile",
        );
    const localSection = [
      "header",
      "footer",
      "main",
      "section",
      "article",
      "nav",
    ].includes(tag)
      ? id
      : section;
    record = typeof p["data-record"] === "string" ? p["data-record"] : record;
    const override = mergeVisualPatch(
      settings.shared.nodes[id],
      page.nodes[id],
    );
    const raw = flatChildren(materialize(p.children as ReactNode));
    const texts: Record<string, string> = {};
    raw.forEach((x, i) => {
      if (typeof x === "string" || typeof x === "number") {
        if (String(x).trim()) texts[String(i)] = String(x);
      }
    });
    const attrs: Record<string, string> = {};
    for (const key of ["src", "href", "alt", "title", "aria-label"])
      if (typeof p[key] === "string") attrs[key] = p[key] as string;
    if (p["data-visual-icon"]) attrs.src = "";
    if (tag === "source" && typeof p.srcSet === "string") attrs.src = p.srcSet;
    const label = p["data-visual-icon"]
      ? "アイコン"
      : Object.values(texts).join(" ").trim() ||
        attrs.alt ||
        attrs["aria-label"] ||
        cls.split(" ")[0] ||
        tag;
    const children = raw.map(
      (x, i) =>
        `${id}.${isValidElement(x) && x.key ? token(String(x.key)) : i}`,
    );
    const sourceTexts: Record<string, string> = {},
      sourceAttrs: Record<string, string> = {};
    for (const [field, value] of Object.entries(sourceValues)) {
      if (typeof value !== "string" || value.length < 3) continue;
      for (const [key, text] of Object.entries(texts))
        if (text === value) sourceTexts[key] = field;
      for (const [key, attr] of Object.entries(attrs))
        if (
          key === "href" &&
          (attr === value ||
            (field === "phone" &&
              attr === "tel:" + value.replace(/[^+\d]/g, "")) ||
            (field === "email" && attr.startsWith("mailto:")))
        )
          sourceAttrs[key] = field;
    }
    // Telephone/mail actions consistently use the same store record on every page.
    if (
      typeof p.href === "string" &&
      p.href.startsWith("tel:") &&
      typeof sourceValues.phone === "string"
    ) {
      p.href = "tel:" + sourceValues.phone.replace(/[^+\d]/g, "");
      sourceAttrs.href = "phone";
    }
    if (
      typeof p.href === "string" &&
      p.href.startsWith("mailto:") &&
      typeof sourceValues.email === "string"
    ) {
      p.href =
        "mailto:" +
        sourceValues.email +
        (p.href.includes("?") ? p.href.slice(p.href.indexOf("?")) : "");
      sourceAttrs.href = "email";
    }
    if (
      typeof p.href === "string" &&
      p.href.startsWith("mailto:") &&
      (override.mailSubject !== undefined || override.mailBody !== undefined)
    ) {
      const url = new URL(p.href);
      if (override.mailSubject !== undefined)
        url.searchParams.set("subject", override.mailSubject);
      if (override.mailBody !== undefined)
        url.searchParams.set("body", override.mailBody);
      p.href = url.toString();
    }
    if (sourceAttrs.href) attrs.href = String(p.href);
    catalog.push({
      id,
      parent,
      section: localSection,
      tag,
      label:
        (
          Object.values({ ...texts, ...override.texts })
            .join(" ")
            .trim() || label
        ).slice(0, 90) +
        (cls.includes("hero-title-mobile")
          ? "（スマホ用）"
          : cls.includes("hero-title-desktop")
            ? "（PC）"
            : ""),
      texts,
      attrs,
      children,
      record,
      hidden: !!override.hidden,
      sourceTexts,
      sourceAttrs,
    });
    const mobile = {
      ...(override.style?.display === "grid"
        ? { gridTemplateColumns: "minmax(0, 1fr)" }
        : override.style?.display === "flex"
          ? { flexDirection: "column" }
          : {}),
      ...override.mobile,
    };
    if (Object.keys(mobile).length)
      css.push(
        `@media(max-width:767px){[data-visual-id="${id}"]{${styleText(mobile)
          .split(";")
          .map((x) => x + "!important")
          .join(";")}}}`,
      );
    for (const pseudo of ["before", "after"] as const) {
      const text = override[pseudo === "before" ? "beforeText" : "afterText"];
      const quoted =
        text === undefined
          ? ""
          : `content:${JSON.stringify(text).replaceAll("<", "\\3c ")};`;
      const regular = override[pseudo];
      if (regular || text !== undefined)
        css.push(
          `[data-visual-id="${id}"]::${pseudo}{${quoted}${styleText(regular || {})}}`,
        );
      const phone =
        override[pseudo === "before" ? "mobileBefore" : "mobileAfter"];
      if (phone)
        css.push(
          `@media(max-width:767px){[data-visual-id="${id}"]::${pseudo}{${styleText(phone)}}}`,
        );
    }
    if (override.backgroundMode === "color")
      css.push(
        `[data-visual-id="${id}"] .hero-slideshow,[data-visual-id="${id}"] .hero-image,[data-visual-id="${id}"] .site-header-bg,[data-visual-id="${id}"] .footer-bg,[data-visual-id="${id}"] .hero-overlay{display:none}[data-visual-id="${id}"]::before,[data-visual-id="${id}"]::after{display:none}`,
      );
    const editableAttrs = { ...override.attrs };
    if (tag === "source" && editableAttrs.src !== undefined) {
      p.srcSet = editableAttrs.src;
      delete editableAttrs.src;
    }
    for (const key of Object.keys(sourceAttrs)) delete editableAttrs[key];
    const nextProps: Record<string, unknown> = {
      ...p,
      ...editableAttrs,
      "data-visual-id": id,
      ...(Object.keys(override.texts || {}).length
        ? { "data-visual-text-override": "true" }
        : {}),
      style: {
        ...((p.style as CSSProperties) || {}),
        ...override.style,
        ...(override.style?.width && !override.style?.maxWidth
          ? { maxWidth: "100%" }
          : {}),
        ...(override.style?.borderWidth ? { borderStyle: "solid" } : {}),
        ...(override.style?.backgroundColor
          ? { background: override.style.backgroundColor }
          : {}),
        ...(override.hidden ? { display: "none" } : {}),
      },
    };
    if (override.attrs?.src) {
      delete nextProps.srcSet;
      delete nextProps.sizes;
    }
    if (p["data-visual-icon"]) {
      const iconSrc = override.attrs?.src;
      if (iconSrc === "") return null;
      if (iconSrc)
        return createElement("img", {
          ...nextProps,
          src: iconSrc,
          alt: override.attrs?.alt || "",
          children: undefined,
        });
      const box = Object.keys(override.style || {}).some(
        (key) => key !== "color",
      );
      if (
        override.style?.width ||
        override.style?.height ||
        override.mobile?.width ||
        override.mobile?.height
      )
        css.push(`[data-visual-id="${id}"]>svg{width:100%;height:100%}`);
      return createElement(tag, {
        ...nextProps,
        style: {
          ...(nextProps.style as CSSProperties),
          display: box ? "inline-flex" : "contents",
        },
        children: el.props.children,
      });
    }
    const desktopIndex = raw.findIndex(
      (x) =>
        isValidElement(x) &&
        String((x.props as Record<string, unknown>).className || "").includes(
          "hero-title-desktop",
        ),
    );
    if (desktopIndex >= 0) {
      const desktop = raw[desktopIndex] as React.ReactElement<{
        children?: ReactNode;
      }>;
      const patch = mergeVisualPatch(
        settings.shared.nodes[children[desktopIndex]],
        page.nodes[children[desktopIndex]],
      );
      for (let i = 0; i < raw.length; i++) {
        const mobile = raw[i];
        if (
          isValidElement(mobile) &&
          String(
            (mobile.props as Record<string, unknown>).className || "",
          ).includes("hero-title-mobile") &&
          (mobile.props as { children?: ReactNode }).children ===
            desktop.props.children &&
          patch.texts?.["0"] !== undefined &&
          !page.nodes[children[i]]?.texts &&
          !settings.shared.nodes[children[i]]?.texts
        )
          raw[i] = cloneElement(
            mobile as React.ReactElement<{ children?: ReactNode }>,
            { children: patch.texts["0"] },
          );
      }
    }
    let rendered = raw.map((x, i) =>
      visit(
        !sourceTexts[String(i)] &&
          Object.prototype.hasOwnProperty.call(override.texts || {}, String(i))
          ? override.texts![String(i)]
          : x,
        children[i],
        id,
        localSection,
        record,
      ),
    );
    for (const c of override.copies || []) {
      const sourceIndex = children.indexOf(c.source);
      if (sourceIndex >= 0) {
        rendered.push(
          visit(raw[sourceIndex] as ReactNode, c.id, id, localSection, record),
        );
        children.push(c.id);
      }
    }
    for (const b of override.blocks || []) {
      const block = createElement(
        b.kind === "button" ? "a" : b.kind === "card" ? "article" : "section",
        {
          className:
            b.kind === "button"
              ? "button primary"
              : "section visual-added-block",
          ...(b.href ? { href: b.href } : {}),
        },
        b.image
          ? createElement("img", {
              src: b.image,
              alt: "",
              style: { maxWidth: "100%", height: "auto" },
            })
          : null,
        createElement(b.kind === "button" ? "span" : "h2", {}, b.title),
        b.kind === "button" ? null : createElement("p", {}, b.body),
      );
      rendered.push(visit(block, b.id, id, localSection));
      children.push(b.id);
    }
    if (override.order) {
      const ordered = override.order.filter((x) => children.includes(x));
      rendered = [
        ...ordered,
        ...children.filter((x) => !ordered.includes(x)),
      ].map((x) => rendered[children.indexOf(x)]);
    }
    if (p["data-visual-icon"]) {
      const iconSrc = override.attrs?.src;
      if (iconSrc)
        return createElement("img", {
          ...nextProps,
          src: iconSrc,
          alt: override.attrs?.alt || "",
          children: undefined,
        });
      return createElement(tag, { ...nextProps, children: el.props.children });
    }
    if (cls.split(" ").includes("hero-slideshow")) {
      const pictures = rendered
        .flat(Infinity)
        .filter(
          (x) => isValidElement(x) && x.type === "picture",
        ) as React.ReactElement<Record<string, unknown>>[];
      const visible = pictures.filter(
        (x) => (x.props.style as CSSProperties)?.display !== "none",
      );
      if (
        visible.length &&
        (override.copies?.length ||
          override.order ||
          override.style?.animationDuration ||
          visible.length !== pictures.length)
      ) {
        const seconds = Math.max(
          1,
          Number.parseFloat(override.style?.animationDuration || "6"),
        );
        const total = seconds * visible.length;
        const name = "visual-slide-" + token(id);
        const end = 100 / visible.length;
        css.push(
          `@keyframes ${name}{0%,${Math.max(0, end - 2)}%{opacity:1}${end}%,100%{opacity:0}}`,
        );
        const animate = (n: ReactNode, index: number): ReactNode =>
          Array.isArray(n)
            ? n.map((x) => animate(x, index))
            : isValidElement(n) && typeof n.type === "string"
              ? cloneElement(n as React.ReactElement<Record<string, unknown>>, {
                  ...(n.type === "img"
                    ? {
                        style: {
                          ...((n.props as Record<string, unknown>)
                            .style as CSSProperties),
                          animation: `${name} ${total}s linear ${index * seconds}s infinite`,
                        },
                      }
                    : {}),
                  children: animate(
                    (n.props as { children?: ReactNode }).children,
                    index,
                  ),
                })
              : n;
        rendered = rendered.flat(Infinity).map((n) => {
          const index = visible.indexOf(
            n as React.ReactElement<Record<string, unknown>>,
          );
          return index >= 0 ? animate(n, index) : n;
        });
      }
    }
    // A replacement mobile photo takes precedence over the legacy source in its picture.
    if (tag === "picture") {
      const index = raw.findIndex(
        (x) => isValidElement(x) && (x.type === Image || x.type === "img"),
      );
      if (index >= 0) {
        const imgPatch = mergeVisualPatch(
          settings.shared.nodes[children[index]],
          page.nodes[children[index]],
        );
        if (imgPatch.mobileImage !== undefined)
          rendered = rendered.map((x, i) =>
            isValidElement(raw[i]) &&
            (raw[i] as React.ReactElement).type === "source"
              ? null
              : x,
          );
      }
    }
    if (tag === "img" && override.mobileImage) {
      const image = createElement(tag, { ...nextProps, key: id });
      const source = createElement("source", {
        media: "(max-width:767px)",
        srcSet: override.mobileImage,
        key: id + "-mobile",
      });
      const parentNode = catalog.find((x) => x.id === parent);
      return parentNode?.tag === "picture"
        ? createElement(Fragment, null, source, image)
        : createElement(
            "picture",
            { style: { display: "contents" } },
            source,
            image,
          );
    }
    if (tag === "img" && override.attrs?.src === "") return null;
    nextProps.key = id;
    return createElement(tag, nextProps, ...rendered);
  }
  const tree = visit(input, "page");
  return {
    tree: createElement(
      Fragment,
      null,
      css.length
        ? createElement("style", {
            "data-visual-styles": true,
            dangerouslySetInnerHTML: { __html: css.join("\n") },
          })
        : null,
      tree,
    ),
    catalog,
  };
}
