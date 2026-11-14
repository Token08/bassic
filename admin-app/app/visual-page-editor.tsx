"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicPageCanvas } from "./public-page-canvas";
import { AdminImage } from "./components/admin-image";
import { PdfField } from "./components/pdf-field";
import {
  emptyVisualSettings,
  parseVisualSettings,
  mergeVisualPatch,
  rebaseVisualPatch,
  type VisualSettings,
  type VisualNode,
  type VisualPatch,
  type VisualPage,
  type VisualStyle,
} from "@public/lib/editor-document";
import { useErrorFocus } from "@/lib/use-error-focus";
import { publicationDeadline, canLookUpPublication } from "@public/lib/publication-timing.mjs";
import { summarizeVisualChanges, visualHistory } from "@/lib/publish-review";
import type { PublishStatus } from "@/lib/deploy-status";
const pagePaths: Record<string, string> = {
  TOP: "/",
  "EVENT SCHEDULE": "/events/",
  MENU: "/menu/",
  "PARTY & RENTAL": "/party/",
  ACCESS: "/access/",
  "FIRST VISIT": "/first-visit/",
  "ONLINE STORE": "/",
};
async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await res.json();
  if (!res.ok || !result.ok)
    throw Error(result.message || "読み込みできませんでした。");
  return result.data;
}
const styleOptions: [keyof VisualStyle, string, string][] = [
  ["color", "文字色", "color"],
  ["backgroundColor", "背景色", "color"],
  ["fontSize", "文字サイズ", "number"],
  ["lineHeight", "行間", "number"],
  ["padding", "内側の余白", "number"],
  ["margin", "外側の余白", "number"],
  ["letterSpacing", "文字の間隔", "number"],
  ["gap", "項目の間隔", "number"],
  ["width", "幅", "number"],
  ["height", "高さ", "number"],
  ["maxWidth", "最大幅", "number"],
  ["borderRadius", "角丸", "number"],
  ["borderColor", "枠線の色", "color"],
  ["borderWidth", "枠線の太さ", "number"],
  ["opacity", "濃さ", "number"],
  ["animationDuration", "切替・アニメーション秒数", "number"],
];
const colorHex = (value: string) => {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value);
  return m
    ? "#" +
        m
          .slice(1)
          .map((n) => Number(n).toString(16).padStart(2, "0"))
          .join("")
    : "#fff7d9";
};
const themeNames: Record<string, string> = {
  ink: "基本の文字",
  paper: "明るい背景",
  "paper-strong": "カード背景",
  muted: "補足の文字",
  gold: "アクセント",
  red: "濃い赤",
  "red-bright": "ボタンの赤",
  ivory: "明るい文字",
  night: "暗い背景",
  "night-soft": "暗いカード",
};
export function VisualPageEditor({
  page,
  onLegacySelect,
  onState,
}: {
  page: string;
  onLegacySelect: (value: {
    id: string;
    itemId?: string;
    editLabel?: string;
    fieldKeys?: readonly string[];
    initialDraft?: Record<string, unknown>;
  }) => void;
  onState: (value: { dirty: boolean; busy: boolean }) => void;
}) {
  const [settings, setSettings] = useState<VisualSettings>(emptyVisualSettings),
    [baseline, setBaseline] = useState(""),
    [document, setDocument] = useState<{
      html: string;
      url: string;
      publishedRevision?: string;
      meta?: { title: string; description: string; image: string };
      hiddenRecords?: { endpoint: string; id: string; label: string }[];
    }>(),
    [catalog, setCatalog] = useState<VisualNode[]>([]),
    [selected, setSelected] = useState(""),
    [editing, setEditing] = useState(false),
    [category, setCategory] = useState("文章"),
    [locale, setLocale] = useState(""),
    [scope, setScope] = useState<"page" | "shared">("page"),
    [mobile, setMobile] = useState(false),
    [notice, setNotice] = useState(""),
    [failure, setFailure] = useState(false),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [review, setReview] = useState(false),
    [deploy, setDeploy] = useState<{ id: string; requestedAt: string }>(),
    [retry, setRetry] = useState(0),
    [canRetryDeployment, setCanRetryDeployment] = useState(false),
    [themeScope, setThemeScope] = useState<"page" | "shared">("page"),
    [stylePart, setStylePart] = useState<"self" | "before" | "after">("self"),
    [baseStyleGroup, setBaseStyleGroup] = useState<
      | "baseStyle"
      | "mobileBaseStyle"
      | "dialogStyle"
      | "dialogButtonStyle"
      | "dialogCaptionStyle"
    >("baseStyle");
  const uploadController = useRef<AbortController | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => () => uploadController.current?.abort(), [selected]);
  const [computedStyles, setComputedStyles] = useState<
    Record<string, Record<string, string>>
  >({});
  const publishInFlight = useRef(false);
  const [errorTick, setErrorTick] = useState(0);
  const [recordClone, setRecordClone] =
    useState<Parameters<typeof onLegacySelect>[0]>();
  const baseRevision = useRef(""),
    requestRef = useRef(0),
    savedSettings = useRef<VisualSettings | undefined>(undefined),
    formTop = useRef<HTMLFieldSetElement>(null);
  const errorRef = useErrorFocus<HTMLDivElement>(
    failure,
    notice + String(retry) + String(errorTick),
  );
  const path = (locale ? "/" + locale : "") + (pagePaths[page] || "/");
  const draftKey = "bassic-visual-draft-v1";
  const dirty = loaded && JSON.stringify(settings) !== baseline;
  const changes = useMemo(() => {
    if (!review || !baseline) return [];
    try {
      return summarizeVisualChanges(
        JSON.parse(baseline),
        settings,
        catalog,
        path,
      );
    } catch {
      return [];
    }
  }, [review, baseline, settings, catalog, path]);
  const history = visualHistory(settings);
  useEffect(() => {
    onState({ dirty, busy: busy || !!deploy });
  }, [dirty, busy, deploy, onState]);
  useEffect(() => {
    if (!recordClone || busy) return;
    const timer = setTimeout(() => {
      setRecordClone(undefined);
      onLegacySelect(recordClone);
    }, 0);
    return () => clearTimeout(timer);
  }, [recordClone, busy, onLegacySelect]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty || busy || deploy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [dirty, busy, deploy]);
  useEffect(() => {
    let cancel = false;
    setLoaded(false);
    api("/api/visual-editor")
      .then((value: VisualSettings) => {
        if (cancel) return;
        setSettings(value);
        setBaseline(JSON.stringify(value));
        baseRevision.current = value.revision || "";
        setLoaded(true);
        savedSettings.current = value;
        try {
          const pending = JSON.parse(
            localStorage.getItem("bassic-visual-deploy-v1") || "null",
          );
          if (
            pending?.revision === value.revision &&
            typeof pending.id === "string" &&
            /^[a-f0-9-]{36}$/.test(pending.id) &&
            Number.isFinite(Date.parse(pending.requestedAt))
          ) {
            setDeploy({ id: pending.id, requestedAt: pending.requestedAt });
            setCanRetryDeployment(true);
            setNotice("サイト反映中");
          }
        } catch {}
      })
      .catch((e) => {
        if (!cancel) {
          setFailure(true);
          setNotice(e.message);
        }
      });
    return () => {
      cancel = true;
    };
  }, [retry]);
  const refresh = useCallback(
    async (config: VisualSettings) => {
      const seq = ++requestRef.current;
      const data = await api("/api/visual-editor", {
        method: "POST",
        body: JSON.stringify({ path, settings: config }),
      });
      if (seq !== requestRef.current) return;
      const doc = new DOMParser().parseFromString(data.html, "text/html");
      const raw = doc.querySelector("#bassic-editor-catalog")?.textContent;
      if (!raw) throw Error("編集箇所を取得できませんでした。");
      setCatalog(JSON.parse(raw));
      data.meta = {
        title: doc.title,
        description:
          doc
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || "",
        image:
          doc
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content") || "",
      };
      setDocument(data);
      return data;
    },
    [path],
  );
  useEffect(() => {
    if (!loaded) return;
    setDocument(undefined);
    setCatalog([]);
    setSelected("");
    setEditing(false);
    void refresh(settings).catch((e) => {
      setFailure(true);
      setNotice(e.message);
    });
  }, [path, loaded, refresh]);
  const node = catalog.find((n) => n.id === selected),
    local = settings.pages[path] || { nodes: {} },
    target = scope === "shared" ? settings.shared : local,
    patch = target.nodes[selected] || {},
    effective = mergeVisualPatch(
      node?.inherited
        ? rebaseVisualPatch(
            mergeVisualPatch(
              settings.shared.nodes[node.inherited],
              scope === "shared" ? undefined : local.nodes[node.inherited],
            ),
            node.inherited,
            node.id,
          )
        : undefined,
      mergeVisualPatch(
        settings.shared.nodes[selected],
        scope === "shared" ? undefined : local.nodes[selected],
      ),
    );
  const displayLabel = (n: VisualNode) => {
    if (n.tag === "header") return "ヘッダー";
    if (n.tag === "footer") return "フッター";
    if (n.tag === "main") return "ページ全体";
    if (n.tag === "nav")
      return n.attrs["aria-label"] === "スマートフォン用ナビゲーション"
        ? "メニュー（スマホ）"
        : "メニュー";
    if (n.attrs["aria-label"] === "固定アクション") return "スマホ下部のボタン";
    const cards = n.children
      .map((id) => catalog.find((child) => child.id === id))
      .filter(
        (child) =>
          child && ["article", "figure", "picture"].includes(child.tag),
      );
    if (cards.length > 1) {
      const names: Record<string, string> = {
        "feature-grid": "紹介カード",
        "menu-card-grid": "フードメニュー",
        "plan-grid": "貸切プラン",
        "drink-menu-sheet-grid": "ドリンク表",
      };
      return `${names[n.label] || "カード一覧"}（${cards.length}件）`;
    }
    if (n.tag === "figure") {
      const photo = catalog.find(
        (child) => child.id.startsWith(n.id + ".") && child.tag === "img",
      );
      return photo?.attrs.alt ? `写真：${photo.attrs.alt}` : "写真";
    }
    if (["section", "article", "div"].includes(n.tag)) {
      const heading = catalog.find(
        (c) => c.id.startsWith(n.id + ".") && /^h[1-6]$/.test(c.tag),
      );
      if (heading) return heading.label.replace(/\s+/g, " ");
    }
    return (
      (
        {
          "social-account-grid": "SNSリンク",
          "menu-card-grid": "フードメニュー",
          "plan-grid": "貸切プラン",
          hero: "メイン画像・文章",
          img: "画像",
          span: "項目",
          div: "枠",
          section: "案内",
        } as Record<string, string>
      )[n.label] || n.label
    );
  };
  const map = useMemo(() => new Map(catalog.map((n) => [n.id, n])), [catalog]);
  const locationParts: string[] = [];
  for (
    let current = node, steps = 0;
    current && steps < 20;
    current = map.get(current.parent), steps++
  ) {
    if (
      current === node ||
      ["header", "footer", "section", "article"].includes(current.tag)
    )
      locationParts.unshift(displayLabel(current));
  }
  const editLocation = [
    page === "TOP" ? "TOPページ" : page,
    ...locationParts.filter((part, index) => part !== locationParts[index - 1]),
  ].join(" → ");
  const descendants = (id: string) =>
    catalog.filter((n) => n.id === id || n.id.startsWith(id + "."));
  const visibleNodes = catalog.filter(
    (n) => !["script", "style", "br"].includes(n.tag),
  );
  const childIds = node
    ? [
        ...(effective.order || []),
        ...node.children.filter((id) => !effective.order?.includes(id)),
      ].filter((id) => map.has(id))
    : [];
  const relevant = node
    ? descendants(node.id)
    : visibleNodes.filter(
        (n) =>
          ["header", "footer", "section"].includes(n.tag) ||
          n.attrs["aria-label"] === "固定アクション",
      );
  function change(next: VisualSettings) {
    setSettings(next);
    setReview(false);
    setFailure(false);
    setNotice("");
  }
  function update(
    part: Partial<VisualPatch>,
    extraNodes: Record<string, VisualPatch> = {},
  ) {
    if (part.attrs || part.mobileImage !== undefined)
      uploadController.current?.abort();
    if (!node) return;
    const next = {
      ...target,
      nodes: {
        ...target.nodes,
        ...extraNodes,
        [node.id]: { ...patch, ...part },
      },
    };
    const merged =
      scope === "shared"
        ? { ...settings, shared: next }
        : { ...settings, pages: { ...settings.pages, [path]: next } };
    change(merged);
    if (part.copies || part.blocks)
      void refresh(merged).catch((e) => {
        setFailure(true);
        setNotice(e.message);
      });
  }
  function select(id: string) {
    setSelected(id);
    setStylePart("self");
    setEditing(false);
    setScope(id.startsWith("shared-") && !locale ? "shared" : "page");
    setReview(false);
  }
  async function duplicate(id: string) {
    if (!node) return;
    const record = map.get(id)?.record;
    if (record && !node.record) {
      setBusy(true);
      setFailure(false);
      setErrorTick((value) => value + 1);
      try {
        const [endpoint, itemId] = record.split(":");
        const data = await api("/api/content/" + endpoint);
        const source = data.contents?.find(
          (item: Record<string, unknown>) => item.id === itemId,
        );
        if (!source) throw Error("複製元を読み込めませんでした。");
        const draft = { ...source, isPublished: false };
        for (const key of [
          "id",
          "createdAt",
          "updatedAt",
          "publishedAt",
          "revisedAt",
          "sourceUrl",
          "sourceId",
          "sourceType",
          "sourceEventId",
        ])
          delete draft[key];
        setRecordClone({
          id: endpoint,
          itemId: "new",
          initialDraft: draft,
          editLabel: "複製したカード",
        });
      } catch (e) {
        setFailure(true);
        setNotice((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    const copyId = node.id + ".copy-" + crypto.randomUUID();
    const snapshots: Record<string, VisualPatch> = {};
    for (const source of descendants(id)) {
      const inherited = source.inherited
        ? rebaseVisualPatch(
            mergeVisualPatch(
              settings.shared.nodes[source.inherited],
              local.nodes[source.inherited],
            ),
            source.inherited,
            source.id,
          )
        : undefined;
      const current = mergeVisualPatch(
        inherited,
        mergeVisualPatch(
          settings.shared.nodes[source.id],
          local.nodes[source.id],
        ),
      );
      const attrs = { ...source.attrs, ...current.attrs };
      if (
        source.attrs.src === "" &&
        !Object.prototype.hasOwnProperty.call(current.attrs || {}, "src")
      )
        delete attrs.src;
      snapshots[copyId + source.id.slice(id.length)] = rebaseVisualPatch(
        { ...current, texts: { ...source.texts, ...current.texts }, attrs },
        id,
        copyId,
      );
    }
    update(
      {
        copies: [...(effective.copies || []), { id: copyId, source: id }],
      },
      snapshots,
    );
  }
  function exportInventory() {
    const rows = [
      [
        "ページ",
        "編集場所",
        "影響範囲",
        "種類",
        "現在の文章",
        "画像・リンク",
        "表示",
        "プレビュー",
      ],
      ...catalog.map((n) => {
        const value = mergeVisualPatch(
          n.inherited
            ? rebaseVisualPatch(
                mergeVisualPatch(
                  settings.shared.nodes[n.inherited],
                  local.nodes[n.inherited],
                ),
                n.inherited,
                n.id,
              )
            : undefined,
          mergeVisualPatch(settings.shared.nodes[n.id], local.nodes[n.id]),
        );
        return [
          path,
          displayLabel(n),
          (n.sourceTexts && Object.keys(n.sourceTexts).length) ||
          (n.sourceAttrs && Object.keys(n.sourceAttrs).length)
            ? "共通の店舗情報"
            : n.id.startsWith("shared-")
              ? "全ページ（個別上書き可）"
              : "このページ",
          n.tag,
          JSON.stringify({ ...n.texts, ...value.texts }),
          JSON.stringify({ ...n.attrs, ...value.attrs }),
          value.hidden ? "非表示" : "表示",
          n.id,
        ];
      }),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((value) => '"' + String(value).replaceAll('"', '""') + '"')
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = globalThis.document.createElement("a");
    a.href = url;
    a.download = "bassic-editing-inventory.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function open(id: string, cat: string) {
    setSelected(id);
    setCategory(cat);
    setEditing(true);
    setReview(false);
    requestAnimationFrame(() => {
      formTop.current?.focus({ preventScroll: true });
      formTop.current?.scrollIntoView({ block: "start" });
    });
  }
  useEffect(() => {
    if (page !== "ONLINE STORE") return;
    const link = catalog.find((n) => n.sourceAttrs?.href === "onlineStoreUrl");
    if (link) {
      setSelected(link.id);
      setCategory("ボタン・リンク");
      setEditing(true);
      setScope("shared");
    }
  }, [page, catalog.length]);
  async function preview() {
    setBusy(true);
    setFailure(false);
    try {
      await refresh(settings);
      setReview(true);
      setNotice("変更後・未掲載");
      setEditing(false);
    } catch (e) {
      setFailure(true);
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (publishInFlight.current) return;
    publishInFlight.current = true;
    setBusy(true);
    setFailure(false);
    try {
      const next = await api("/api/visual-editor", {
        method: "PUT",
        body: JSON.stringify({ settings, baseRevision: baseRevision.current }),
      });
      savedSettings.current = next;
      setCanRetryDeployment(true);
      setSettings(next);
      setBaseline(JSON.stringify(next));
      baseRevision.current = next.revision || "";
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      const result = await api("/api/deploy", { method: "POST" });
      trackDeployment({
        id: result.requestId || result.id,
        requestedAt: result.requestedAt,
      });
      setNotice("サイト反映中");
      setReview(false);
    } catch (e) {
      setFailure(true);
      setNotice((e as Error).message + " 入力内容は残っています。");
    } finally {
      publishInFlight.current = false;
      setBusy(false);
    }
  }
  function trackDeployment(value: { id: string; requestedAt: string }) {
    setDeploy(value);
    try {
      localStorage.setItem(
        "bassic-visual-deploy-v1",
        JSON.stringify({ ...value, revision: baseRevision.current }),
      );
    } catch {}
  }
  function finishDeployment() {
    setDeploy(undefined);
    try {
      localStorage.removeItem("bassic-visual-deploy-v1");
    } catch {}
  }
  useEffect(() => {
    if (!deploy?.id) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const until = publicationDeadline(deploy.requestedAt);
    async function poll() {
      if (!canLookUpPublication(deploy!.requestedAt)) {
        setFailure(true); setNotice("保存内容は残っています。以前の公開依頼の結果を確認できません。公開サイトを確認してください。"); finishDeployment(); return;
      }
      try {
        const result = await api<PublishStatus>("/api/deploy?" + new URLSearchParams(deploy!));
        if (stopped) return;
        if (result.state === "published") {
          const verified = await refresh(savedSettings.current || settings);
          if (
            !verified ||
            verified.publishedRevision !==
              (savedSettings.current || settings).revision
          ) {
            setFailure(true);
            setNotice(
              "反映処理は完了しましたが、保存した版の表示を確認できませんでした。",
            );
            finishDeployment();
            return;
          }
          setNotice("サイトに反映済み");
          setCanRetryDeployment(false);
          finishDeployment();
          return;
        }
        if (result.state === "failed") {
          setFailure(true);
          setNotice("掲載に失敗しました。保存済みの内容を再反映できます。");
          finishDeployment();
          return;
        }
        if (result.state === "unconfirmed") {
          setFailure(true);
          setNotice("公開処理は完了しましたが、サイトへの反映を確認できませんでした。公開サイトを確認してください。");
          finishDeployment();
          return;
        }
      } catch {}
      if (!stopped && Date.now() < until) timer = setTimeout(poll, 5000);
      else if (!stopped) {
        setFailure(true);
        setNotice("保存内容は残っています。反映結果を確認できませんでした。公開サイトを確認し、未反映の場合は反映だけをやり直してください。");
        finishDeployment();
      }
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [deploy]);
  async function upload(file: File, id: string, mobileImage = false) {
    uploadController.current?.abort();
    const controller = new AbortController();
    uploadController.current = controller;
    setBusy(true);
    setFailure(false);
    const targetScope = scope;
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/media", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw Error(result.message || "画像を保存できませんでした。");
      if (controller.signal.aborted || selectedRef.current !== id) return;
      setSettings((current) => {
        const page =
          targetScope === "shared"
            ? current.shared
            : current.pages[path] || { nodes: {} };
        const p = page.nodes[id] || {};
        const next = {
          ...page,
          nodes: {
            ...page.nodes,
            [id]: mobileImage
              ? { ...p, mobileImage: result.data.url }
              : { ...p, attrs: { ...p.attrs, src: result.data.url } },
          },
        };
        return targetScope === "shared"
          ? { ...current, shared: next }
          : { ...current, pages: { ...current.pages, [path]: next } };
      });
      setReview(false);
      setFailure(false);
      setNotice("");
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure(true);
        setNotice((error as Error).message);
      }
    } finally {
      if (uploadController.current === controller) {
        uploadController.current = null;
        setBusy(false);
      }
    }
  }
  const styleSlot = (
    stylePart === "self"
      ? mobile
        ? "mobile"
        : "style"
      : mobile
        ? stylePart === "before"
          ? "mobileBefore"
          : "mobileAfter"
        : stylePart
  ) as "style" | "mobile" | "before" | "after" | "mobileBefore" | "mobileAfter";
  const activeStyle = effective[styleSlot];
  function styleField(key: keyof VisualStyle, value: string) {
    const current = activeStyle;
    const styles = { ...current };
    if (value === "") delete styles[key];
    else styles[key] = value;
    update({ [styleSlot]: styles });
  }
  function updateBaseStyle(key: keyof VisualStyle, value: string) {
    const current = themeScope === "shared" ? settings.shared : local;
    const baseStyle = { ...current[baseStyleGroup] };
    if (value) baseStyle[key] = value;
    else delete baseStyle[key];
    change(
      themeScope === "shared"
        ? { ...settings, shared: { ...current, [baseStyleGroup]: baseStyle } }
        : {
            ...settings,
            pages: {
              ...settings.pages,
              [path]: { ...current, [baseStyleGroup]: baseStyle },
            },
          },
    );
  }
  function setPage(next: VisualPage) {
    change(
      scope === "shared"
        ? { ...settings, shared: next }
        : { ...settings, pages: { ...settings.pages, [path]: next } },
    );
  }
  const categoryNodes = (cat: string) =>
    relevant.filter((n) =>
      cat === "文章"
        ? Object.keys(n.texts).length
        : cat === "写真・ロゴ"
          ? n.tag !== "iframe" &&
            ("src" in n.attrs || n.label.includes("アイコン"))
          : cat === "ボタン・リンク"
            ? "href" in n.attrs || n.tag === "iframe"
            : cat === "カード"
              ? ["article", "figure"].includes(n.tag) ||
                n.children.some((id) =>
                  ["article", "figure", "picture", "li", "a"].includes(
                    map.get(id)?.tag || "",
                  ),
                )
              : true,
    );
  const publicUrl = new URL(
    path,
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/",
  ).href;
  const reflected =
    !!settings.revision && document?.publishedRevision === settings.revision;
  const statusText = deploy
    ? "サイト反映中"
    : dirty
      ? "編集中"
      : settings.revision
        ? reflected
          ? "サイトに反映済み"
          : "保存済み・未反映"
        : document
          ? "公開中の内容"
          : "読み込み中";
  const editState = deploy || busy ? "pending" : dirty ? "dirty" : reflected ? "published" : "saved";
  const renderCategory = (cat: string) =>
    categoryNodes(cat).length ? (
      <details key={cat} open={category === cat}>
        <summary data-count={categoryNodes(cat).length}>{cat}</summary>
        {categoryNodes(cat).map((n) => (
          <button
            type="button"
            className="visual-target-choice"
            aria-pressed={editing && n.id === selected && category === cat}
            data-visual-target={n.id}
            key={n.id}
            onClick={() => open(n.id, cat)}
          >
            {cat === "写真・ロゴ" && n.attrs.src ? (
              <AdminImage src={n.attrs.src} compact />
            ) : null}
            {displayLabel(n)}
            {n.record ? "（登録情報）" : ""}
          </button>
        ))}
      </details>
    ) : null;
  if (!loaded)
    return (
      <section className="loading-panel">
        {failure ? (
          <>
            <p role="alert">{notice}</p>
            <button type="button" onClick={() => setRetry((x) => x + 1)}>
              再読み込み
            </button>
          </>
        ) : (
          "編集内容を読み込み中"
        )}
      </section>
    );
  return (
    <div className="visual-workspace-v2">
      {notice ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role={failure ? "alert" : "status"}
          className={
            "editor-feedback " + (failure ? "notice error" : "notice info")
          }
        >
          <strong>{notice}</strong>
          {!failure && reflected && !dirty && !deploy ? (
            <a
              className="secondary-button"
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
            >
              掲載したページを確認
            </a>
          ) : null}
          {failure && canRetryDeployment ? (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (publishInFlight.current) return;
                publishInFlight.current = true;
                setBusy(true);
                setErrorTick((value) => value + 1);
                try {
                  const r = await api("/api/deploy", { method: "POST" });
                  trackDeployment({
                    id: r.requestId || r.id,
                    requestedAt: r.requestedAt,
                  });
                  setFailure(false);
                  setNotice("サイト反映中");
                } catch (e) {
                  setFailure(true);
                  setNotice((e as Error).message);
                } finally {
                  publishInFlight.current = false;
                  setBusy(false);
                }
              }}
            >
              保存済みの内容を再反映
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="visual-workspace-heading">
        <a
          className="text-button"
          href={
            new URL(
              path,
              process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
                "https://www.bassic.jp/",
            ).href
          }
          target="_blank"
          rel="noreferrer"
        >
          公開中のサイトを開く
        </a>
        <div className="visual-page-title">
          <h1>
            {page === "FIRST VISIT"
              ? "初めての方へ"
              : page === "TOP"
                ? "TOPページ"
                : page}
          </h1>
          <span className="visual-edit-status" data-state={editState} role="status" aria-label="編集と掲載の状態">
            {statusText}
          </span>
        </div>
        <label>
          言語
          <select
            value={locale}
            disabled={page === "FIRST VISIT" || busy || !!deploy}
            onChange={(e) => {
              if (
                dirty &&
                !confirm(
                  "未掲載の編集内容を保持したまま、別の言語へ移動しますか？",
                )
              )
                return;
              setLocale(e.target.value);
            }}
          >
            <option value="">日本語</option>
            <option value="en">English</option>
            <option value="ko">한국어</option>
            <option value="zh-hant">繁體中文</option>
            <option value="zh-hans">简体中文</option>
          </select>
        </label>
      </div>
      <div className="visual-editor-grid">
        <div className="visual-editor-main">
          {review ? (
            <section
              className="publish-review-summary"
              aria-label="掲載する変更"
            >
              <h2>今回の変更</h2>
              {changes.length ? (
                <>
                  <ul>
                    {changes.slice(0, 4).map((group) => (
                      <li key={group.path}>
                        <strong>{group.label}</strong>
                        <span>
                          {[...new Set(group.details.map((item) => item.kind))]
                            .map(
                              (kind) =>
                                `${kind} ${group.details.filter((item) => item.kind === kind).length}件`,
                            )
                            .join("・")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {changes.length > 4 ? (
                    <p>ほか{changes.length - 4}ページ。内訳で確認できます。</p>
                  ) : null}
                  <details>
                    <summary>変更内容を見る</summary>
                    {changes.map((group) => (
                      <div key={group.path}>
                        <h3>{group.label}</h3>
                        <ul>
                          {group.details.map((item, index) => (
                            <li key={index}>
                              <strong>
                                {item.label}：{item.kind}
                              </strong>
                              {item.before !== undefined ? (
                                <div className="publish-change-values">
                                  <span>変更前：{item.before}</span>
                                  <span>変更後：{item.after}</span>
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </details>
                </>
              ) : (
                <p>設定内容の変更はありません。</p>
              )}
            </section>
          ) : null}
          {editing && node ? (
            <fieldset
              ref={formTop}
              tabIndex={-1}
              disabled={busy || !!deploy}
              className="visual-direct-form"
            >
              <button
                className="text-button"
                type="button"
                onClick={() => setEditing(false)}
              >
                ← ページに戻る
              </button>
              <p className="eyebrow">{editLocation}</p>
              <h2>{category}</h2>
              {node.inherited ? (
                <p className="eyebrow">
                  {Object.keys(patch).length
                    ? "スマホ用に個別設定"
                    : "PCのメニューを引き継ぎ中"}
                </p>
              ) : null}
              <label>
                反映する範囲
                <select
                  value={scope}
                  onChange={(e) =>
                    setScope(e.target.value as "shared" | "page")
                  }
                >
                  <option value="page">このページ・この言語</option>
                  {node.id.startsWith("shared-") ? (
                    <option value="shared">全ページ・全言語</option>
                  ) : null}
                </select>
              </label>
              {node.record ? (
                <div className="notice info">
                  イベントや商品情報は登録データを使います。
                  <button
                    type="button"
                    onClick={() => {
                      const [id, itemId] = node.record!.split(":");
                      onLegacySelect({
                        id,
                        itemId,
                        editLabel: "登録情報を編集",
                      });
                    }}
                  >
                    登録情報を編集
                  </button>
                </div>
              ) : null}
              {category === "文章" && !node.record
                ? Object.entries(node.texts).map(([key, text]) => (
                    <label key={key}>
                      {node.sourceTexts?.[key] ? (
                        <button
                          type="button"
                          onClick={() =>
                            onLegacySelect({
                              id: "site-settings",
                              fieldKeys: [node.sourceTexts![key]],
                              editLabel: "共通の店舗情報",
                            })
                          }
                        >
                          共通の店舗情報から変更
                        </button>
                      ) : null}
                      {node.tag.match(/^h\d$/) ? "見出し" : "文章"}
                      {Object.keys(node.texts).length > 1
                        ? " " + (Number(key) + 1)
                        : ""}
                      <textarea
                        rows={3}
                        readOnly={!!node.sourceTexts?.[key]}
                        value={effective.texts?.[key] ?? text}
                        onChange={(e) =>
                          update({
                            texts: {
                              ...effective.texts,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))
                : null}
              {category === "写真・ロゴ" && !node.record ? (
                <>
                  {(effective.attrs?.src ?? node.attrs.src) ? (
                    <AdminImage
                      className="visual-current-image"
                      src={effective.attrs?.src ?? node.attrs.src}
                      alt="現在の画像"
                    />
                  ) : (
                    <p>画像なし・標準アイコン</p>
                  )}
                  <label>
                    写真・ロゴを差し替える
                    <input
                      type="file"
                      accept="image/*"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f, node.id);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      update({ attrs: { ...effective.attrs, src: "" } })
                    }
                  >
                    画像を外す
                  </button>
                  <details>
                    <summary>スマホ専用の写真</summary>
                    <label>
                      スマホ用画像URL
                      <input
                        placeholder="共通の画像を使う"
                        value={effective.mobileImage ?? ""}
                        onChange={(e) =>
                          update({ mobileImage: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      スマホ用の写真を選ぶ
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void upload(file, node.id, true);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </details>
                  <details>
                    <summary>画像URL・説明</summary>
                    {["src", "alt"].map((key) => (
                      <label key={key}>
                        {key === "src" ? "画像URL" : "画像の説明"}
                        <input
                          value={
                            effective.attrs?.[key] ?? node.attrs[key] ?? ""
                          }
                          onChange={(e) =>
                            update({
                              attrs: {
                                ...effective.attrs,
                                [key]: e.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </details>
                </>
              ) : null}
              {category === "ボタン・リンク" && !node.record ? (
                <>
                  {node.attrs.href?.startsWith("mailto:") ? (
                    <>
                      <label>
                        メールの件名
                        <input
                          value={
                            effective.mailSubject ??
                            new URL(node.attrs.href).searchParams.get(
                              "subject",
                            ) ??
                            ""
                          }
                          onChange={(e) =>
                            update({ mailSubject: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        メールの本文
                        <textarea
                          value={
                            effective.mailBody ??
                            new URL(node.attrs.href).searchParams.get("body") ??
                            ""
                          }
                          onChange={(e) => update({ mailBody: e.target.value })}
                        />
                      </label>
                    </>
                  ) : null}
                  {/\.pdf(?:[?#]|$)/i.test(node.attrs.href || "") ? (
                    <div><h3>機材リストPDF</h3><PdfField key={`${node.id}:${scope}`} id="visual-pdf" value={effective.attrs?.href ?? node.attrs.href ?? ""} onChange={href => update({ attrs: { ...effective.attrs, href } })} /></div>
                  ) : null}
                  {[
                    node.tag === "iframe" ? "src" : "href",
                    "title",
                    "aria-label",
                  ].filter(key => key !== "href" || !/\.pdf(?:[?#]|$)/i.test(node.attrs.href || "")).map((key) => (
                    <label key={key}>
                      {key === "src"
                        ? "埋め込み先URL"
                        : key === "href"
                          ? "リンク先URL"
                          : key === "title"
                            ? "補足"
                            : "読み上げ名"}
                      {node.sourceAttrs?.[key] ? (
                        <button
                          type="button"
                          onClick={() =>
                            onLegacySelect({
                              id: "site-settings",
                              fieldKeys: [node.sourceAttrs![key]],
                              editLabel: "共通の店舗情報・リンク",
                            })
                          }
                        >
                          共通設定から変更（ほかのページにも反映）
                        </button>
                      ) : null}
                      <input
                        readOnly={!!node.sourceAttrs?.[key]}
                        value={effective.attrs?.[key] ?? node.attrs[key] ?? ""}
                        onChange={(e) =>
                          update({
                            attrs: {
                              ...effective.attrs,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                  {Object.entries(node.texts).map(([key, text]) => (
                    <label key={key}>
                      表示名
                      <input
                        value={effective.texts?.[key] ?? text}
                        onChange={(e) =>
                          update({
                            texts: {
                              ...effective.texts,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </>
              ) : null}
              {category === "見た目" ? (
                <>
                  <label>
                    背景
                    <select
                      value={effective.backgroundMode || "image"}
                      onChange={(e) =>
                        update({
                          backgroundMode: e.target.value as "image" | "color",
                        })
                      }
                    >
                      <option value="image">現在の画像・背景</option>
                      <option value="color">
                        単色（背景の写真・装飾を外す）
                      </option>
                    </select>
                  </label>
                  <label>
                    調整する場所
                    <select
                      value={stylePart}
                      onChange={(e) =>
                        setStylePart(
                          e.target.value as "self" | "before" | "after",
                        )
                      }
                    >
                      <option value="self">項目本体</option>
                      <option value="before">背景・装飾の前面</option>
                      <option value="after">背景・装飾の背面</option>
                    </select>
                  </label>
                  {mobile && stylePart === "self" ? (
                    <label>
                      <input
                        type="checkbox"
                        checked={activeStyle?.display === "none"}
                        onChange={(e) =>
                          styleField("display", e.target.checked ? "none" : "")
                        }
                      />
                      スマホでは表示しない
                    </label>
                  ) : null}
                  {stylePart !== "self" ? (
                    <>
                      <label>
                        装飾の文字
                        <input
                          value={
                            (stylePart === "before"
                              ? effective.beforeText
                              : effective.afterText) ?? ""
                          }
                          onChange={(e) =>
                            update({
                              [stylePart === "before"
                                ? "beforeText"
                                : "afterText"]: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={activeStyle?.display === "none"}
                          onChange={(e) =>
                            styleField(
                              "display",
                              e.target.checked ? "none" : "",
                            )
                          }
                        />
                        この装飾を非表示
                      </label>
                    </>
                  ) : null}
                  <label>
                    調整する表示
                    <select
                      value={mobile ? "mobile" : "desktop"}
                      onChange={(e) => setMobile(e.target.value === "mobile")}
                    >
                      <option value="desktop">PC・共通</option>
                      <option value="mobile">スマホだけ</option>
                    </select>
                  </label>
                  <p>
                    {mobile
                      ? "空欄はPC・共通の設定を使います。"
                      : "空欄は現在の標準デザインです。"}
                  </p>
                  <div className="visual-style-fields">
                    {styleOptions.map(([key, label, type]) => {
                      const value = activeStyle?.[key] || "";
                      return (
                        <label key={key}>
                          {label}
                          <input
                            type={type === "color" ? "color" : type}
                            min={type === "number" ? 0 : undefined}
                            max={
                              type === "number"
                                ? key === "opacity"
                                  ? 1
                                  : key === "lineHeight"
                                    ? 5
                                    : key === "fontSize"
                                      ? 160
                                      : 1200
                                : undefined
                            }
                            step={
                              key === "opacity"
                                ? 0.05
                                : key === "lineHeight"
                                  ? 0.1
                                  : undefined
                            }
                            placeholder={
                              type === "color"
                                ? "標準"
                                : computedStyles[node.id]?.[key]?.replace(
                                    /px$/,
                                    "",
                                  ) || "標準"
                            }
                            value={
                              type === "color"
                                ? colorHex(
                                    value ||
                                      computedStyles[node.id]?.[key] ||
                                      "#fff7d9",
                                  )
                                : type === "number"
                                  ? value.replace(/px$|s$/g, "")
                                  : value
                            }
                            onChange={(e) =>
                              styleField(
                                key,
                                e.target.value === ""
                                  ? ""
                                  : type === "number" &&
                                      !["lineHeight", "opacity"].includes(key)
                                    ? e.target.value +
                                      (key === "animationDuration" ? "s" : "px")
                                    : e.target.value,
                              )
                            }
                          />
                          {value ? (
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => styleField(key, "")}
                            >
                              標準に戻す
                            </button>
                          ) : null}
                        </label>
                      );
                    })}
                    <label>
                      書体
                      <select
                        value={
                          (mobile ? effective.mobile : effective.style)
                            ?.fontFamily || ""
                        }
                        onChange={(e) =>
                          styleField("fontFamily", e.target.value)
                        }
                      >
                        <option value="">標準</option>
                        <option value="sans-serif">ゴシック</option>
                        <option value="serif">明朝</option>
                      </select>
                    </label>
                    <label>
                      文字の太さ
                      <select
                        value={activeStyle?.fontWeight || ""}
                        onChange={(e) =>
                          styleField("fontWeight", e.target.value)
                        }
                      >
                        <option value="">標準</option>
                        <option value="300">細め</option>
                        <option value="400">普通</option>
                        <option value="700">太め</option>
                        <option value="900">特に太く</option>
                      </select>
                    </label>
                    <label>
                      影
                      <select
                        value={activeStyle?.boxShadow || ""}
                        onChange={(e) =>
                          styleField("boxShadow", e.target.value)
                        }
                      >
                        <option value="">標準</option>
                        <option value="none">なし</option>
                        <option value="0 4px 12px #0002">小さく</option>
                        <option value="0 14px 34px #0003">普通</option>
                        <option value="0 24px 60px #0004">大きく</option>
                      </select>
                    </label>
                    <label>
                      文字の配置
                      <select
                        value={
                          (mobile ? effective.mobile : effective.style)
                            ?.textAlign || ""
                        }
                        onChange={(e) =>
                          styleField("textAlign", e.target.value)
                        }
                      >
                        <option value="">標準</option>
                        <option value="left">左</option>
                        <option value="center">中央</option>
                        <option value="right">右</option>
                      </select>
                    </label>
                    <label>
                      列数
                      <select
                        value={
                          (mobile ? effective.mobile : effective.style)
                            ?.gridTemplateColumns || ""
                        }
                        onChange={(e) =>
                          update(
                            mobile
                              ? {
                                  mobile: {
                                    ...effective.mobile,
                                    display: e.target.value
                                      ? "grid"
                                      : undefined,
                                    gridTemplateColumns:
                                      e.target.value || undefined,
                                  },
                                }
                              : {
                                  style: {
                                    ...effective.style,
                                    display: e.target.value
                                      ? "grid"
                                      : undefined,
                                    gridTemplateColumns:
                                      e.target.value || undefined,
                                  },
                                },
                          )
                        }
                      >
                        <option value="">標準</option>
                        {[1, 2, 3, 4].map((n) => (
                          <option
                            key={n}
                            value={`repeat(${n}, minmax(0, 1fr))`}
                          >
                            {n}列
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      写真と文章の配置
                      <select
                        value={
                          (mobile ? effective.mobile : effective.style)
                            ?.flexDirection || ""
                        }
                        onChange={(e) =>
                          update(
                            mobile
                              ? {
                                  mobile: {
                                    ...effective.mobile,
                                    display: e.target.value
                                      ? "flex"
                                      : undefined,
                                    flexDirection: e.target.value || undefined,
                                  },
                                }
                              : {
                                  style: {
                                    ...effective.style,
                                    display: e.target.value
                                      ? "flex"
                                      : undefined,
                                    flexDirection: e.target.value || undefined,
                                  },
                                },
                          )
                        }
                      >
                        <option value="">標準</option>
                        <option value="row">写真を左</option>
                        <option value="row-reverse">写真を右</option>
                        <option value="column">縦並び</option>
                      </select>
                    </label>
                    <label>
                      写真の位置
                      <select
                        value={
                          (mobile ? effective.mobile : effective.style)
                            ?.objectPosition || ""
                        }
                        onChange={(e) =>
                          styleField("objectPosition", e.target.value)
                        }
                      >
                        <option value="">標準</option>
                        {["center", "top", "bottom", "left", "right"].map(
                          (p) => (
                            <option key={p}>{p}</option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                </>
              ) : null}
              {category === "カード" || category === "表示・並び順" ? (
                <>
                  <label className="visual-toggle">
                    <input
                      type="checkbox"
                      checked={!!effective.hidden}
                      onChange={(e) => update({ hidden: e.target.checked })}
                    />
                    この項目を非表示
                  </label>
                  {childIds.map((id, index, ids) => (
                    <div className="visual-child-row" key={id}>
                      <button type="button" onClick={() => select(id)}>
                        {map.has(id) ? displayLabel(map.get(id)!) : id}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const order = effective.order || ids;
                          const at = order.indexOf(id);
                          if (at < 1) return;
                          const next = [...order];
                          [next[at - 1], next[at]] = [next[at], next[at - 1]];
                          update({ order: next });
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const order = effective.order || childIds;
                          const at = order.indexOf(id);
                          if (at < 0 || at >= order.length - 1) return;
                          const next = [...order];
                          [next[at], next[at + 1]] = [next[at + 1], next[at]];
                          update({ order: next });
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void duplicate(id)}
                      >
                        複製
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const p = target.nodes[id] || {};
                          setPage({
                            ...target,
                            nodes: {
                              ...target.nodes,
                              [id]: {
                                ...p,
                                hidden: !(p.hidden ?? map.get(id)?.hidden),
                              },
                            },
                          });
                        }}
                      >
                        {(target.nodes[id]?.hidden ?? map.get(id)?.hidden)
                          ? "表示する"
                          : "非表示にする"}
                      </button>
                      <span>{index + 1}</span>
                    </div>
                  ))}
                  <h3>案内を追加</h3>
                  <div className="visual-add-choices">
                    {(["text", "photo", "card", "button"] as const).map(
                      (kind, index) => (
                        <button
                          type="button"
                          key={kind}
                          onClick={() =>
                            update({
                              blocks: [
                                ...(effective.blocks || []),
                                {
                                  id: node.id + ".added-" + crypto.randomUUID(),
                                  kind,
                                  title: [
                                    "案内",
                                    "写真の案内",
                                    "新しいカード",
                                    "詳しく見る",
                                  ][index],
                                  body: "",
                                  image:
                                    kind === "photo"
                                      ? "/assets/brand/index-logo.png"
                                      : undefined,
                                  href: kind === "button" ? "/" : undefined,
                                },
                              ],
                            })
                          }
                        >
                          {["文章", "写真付き案内", "カード", "ボタン"][index]}
                        </button>
                      ),
                    )}
                  </div>
                </>
              ) : null}
              <details>
                <summary>標準に戻す</summary>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("この項目を標準に戻しますか？")) return;
                    const nodes = { ...target.nodes };
                    const removed = [
                      ...(patch.copies || []).map((x) => x.id),
                      ...(patch.blocks || []).map((x) => x.id),
                    ];
                    for (const key of Object.keys(nodes))
                      if (
                        removed.some(
                          (prefix) =>
                            key === prefix || key.startsWith(prefix + "."),
                        )
                      )
                        delete nodes[key];
                    delete nodes[node.id];
                    setPage({ ...target, nodes });
                  }}
                >
                  この項目を標準に戻す
                </button>
              </details>
            </fieldset>
          ) : null}
          {document ? (
            <div hidden={editing}>
              <PublicPageCanvas
                path={path}
                title={
                  review
                    ? "変更後・未掲載"
                    : dirty
                      ? "編集前のページ"
                      : "公開中のページ"
                }
                document={document}
                precise
                suspended={editing}
                onStyles={setComputedStyles}
                targets={visibleNodes.map((n) => ({
                  key: n.id,
                  label: displayLabel(n),
                }))}
                selected={selected}
                onSelect={select}
              />
            </div>
          ) : (
            <div className="loading-panel">ページを読み込み中</div>
          )}
        </div>
        <aside className="visual-editor-sidebar">
          <h2>{node ? displayLabel(node) : "変更する場所"}</h2>
          {!node ? <p className="visual-section-hint">ページの上から順に表示</p> : null}
          <details>
            <summary>登録情報・非表示の項目</summary>
            {(page === "EVENT SCHEDULE"
              ? [
                  ["events", "イベント一覧"],
                  ["social-notices", "SNS投稿の下書き"],
                ]
              : page === "MENU"
                ? [
                    ["visual-menu", "料理カード"],
                    ["visual-drinks", "ドリンク表"],
                  ]
                : page === "PARTY & RENTAL"
                  ? [
                      ["party-plans", "貸切プラン"],
                      ["equipment-rental", "機材・PDF"],
                    ]
                  : [["site-settings", "共通の店舗情報"]]
            ).map(([id, label]) => (
              <button
                className="visual-target-choice"
                key={id}
                type="button"
                onClick={() => {
                  if (id.startsWith("visual-")) {
                    const n = catalog.find(
                      (n) =>
                        n.label ===
                        (id === "visual-menu"
                          ? "menu-card-grid"
                          : "drink-menu-sheet-grid"),
                    );
                    if (n) open(n.id, "カード");
                  } else onLegacySelect({ id, editLabel: label });
                }}
              >
                {label}
              </button>
            ))}
            {document?.hiddenRecords?.map((item) => (
              <button
                className="visual-target-choice"
                key={item.id}
                type="button"
                onClick={() =>
                  onLegacySelect({
                    id: item.endpoint,
                    itemId: item.id,
                    editLabel: item.label,
                  })
                }
              >
                {item.label}（非表示）
              </button>
            ))}
          </details>
          {node ? (
            <>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  node.parent ? select(node.parent) : setSelected("")
                }
              >
                ひとつ上へ
              </button>
              {["文章", "写真・ロゴ", "ボタン・リンク", "カード"].map(
                renderCategory,
              )}
              <details
                className="visual-advanced-controls"
                open={editing && ["見た目", "表示・並び順"].includes(category)}
              >
                <summary>詳細な調整</summary>
                {["見た目", "表示・並び順"].map(renderCategory)}
              </details>
            </>
          ) : (
            relevant.map((n, index) => (
              <button
                className="visual-target-choice visual-section-choice"
                key={n.id}
                type="button"
                aria-label={displayLabel(n) + (n.hidden ? "（非表示）" : "")}
                onClick={() => select(n.id)}
              >
                <span className="visual-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="visual-section-name">{displayLabel(n)}{n.hidden ? <small>非表示</small> : null}</span>
                <span className="visual-section-arrow" aria-hidden="true">›</span>
              </button>
            ))
          )}
          <details>
            <summary>ページ全体・検索表示</summary>
            <fieldset
              className="visual-page-options-fields"
              disabled={busy || !!deploy}
            >
              <button
                type="button"
                className="text-button"
                onClick={exportInventory}
              >
                編集対象一覧を保存
              </button>
              <h3>共通・ページの見た目</h3>
              <label>
                対象
                <select
                  value={baseStyleGroup}
                  onChange={(e) =>
                    setBaseStyleGroup(e.target.value as typeof baseStyleGroup)
                  }
                >
                  <option value="baseStyle">ページ全体</option>
                  <option value="mobileBaseStyle">スマホのページ全体</option>
                  <option value="dialogStyle">拡大写真の背景・枠</option>
                  <option value="dialogButtonStyle">拡大写真のボタン</option>
                  <option value="dialogCaptionStyle">拡大写真の説明</option>
                </select>
              </label>
              {(
                [
                  "color",
                  "backgroundColor",
                  "fontFamily",
                  "fontSize",
                  "lineHeight",
                  "padding",
                  "gap",
                  "borderRadius",
                  "boxShadow",
                  "width",
                  "height",
                  "maxWidth",
                ] as const
              ).map((key) => {
                const value =
                  (themeScope === "shared" ? settings.shared : local)
                    .baseStyle?.[key] || "";
                return (
                  <label key={key}>
                    {
                      (
                        {
                          color: "文字色",
                          backgroundColor: "背景色",
                          width: "幅",
                          height: "高さ",
                          maxWidth: "最大幅",
                          fontFamily: "書体",
                          fontSize: "文字の基準サイズ",
                          lineHeight: "行間",
                          padding: "ページの余白",
                          gap: "間隔",
                          borderRadius: "角丸",
                          boxShadow: "影",
                        } as Record<string, string>
                      )[key]
                    }
                    {key === "fontFamily" || key === "boxShadow" ? (
                      <select
                        value={value}
                        onChange={(e) => updateBaseStyle(key, e.target.value)}
                      >
                        <option value="">標準</option>
                        {key === "fontFamily" ? (
                          <>
                            <option value="sans-serif">ゴシック</option>
                            <option value="serif">明朝</option>
                          </>
                        ) : (
                          <>
                            <option value="none">なし</option>
                            <option value="0 4px 14px rgba(0,0,0,0.12)">
                              控えめ
                            </option>
                            <option value="0 12px 32px rgba(0,0,0,0.24)">
                              はっきり
                            </option>
                          </>
                        )}
                      </select>
                    ) : (
                      <input
                        type="number"
                        placeholder="標準"
                        value={value.replace(/px$/, "")}
                        onChange={(e) =>
                          updateBaseStyle(
                            key,
                            e.target.value === ""
                              ? ""
                              : e.target.value +
                                  (key === "lineHeight" ? "" : "px"),
                          )
                        }
                      />
                    )}
                  </label>
                );
              })}
              <h3>写真を拡大したときの表示</h3>
              {(["close", "previous", "next", "title"] as const).map((key) => (
                <label key={key}>
                  {
                    (
                      {
                        close: "閉じる",
                        previous: "前へ",
                        next: "次へ",
                        title: "拡大写真の見出し",
                      } as Record<string, string>
                    )[key]
                  }
                  <input
                    placeholder="標準"
                    value={
                      local.interactions?.[key] ??
                      settings.shared.interactions?.[key] ??
                      ""
                    }
                    onChange={(e) =>
                      change({
                        ...settings,
                        pages: {
                          ...settings.pages,
                          [path]: {
                            ...local,
                            interactions: {
                              ...local.interactions,
                              [key]: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                </label>
              ))}
              {history.length ? (
                <details className="visual-history">
                  <summary>以前のページ設定を開く（最大3回）</summary>
                  {history.map((previous, index) => (
                    <button
                      key={previous.revision || index}
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        if (
                          !confirm(
                            "以前の設定を下書きとして開きますか？掲載するまでサイトは変わりません。",
                          )
                        )
                          return;
                        try {
                          change(parseVisualSettings(previous));
                          setNotice(
                            "以前の設定を開きました。まだ掲載されていません。",
                          );
                        } catch {
                          setFailure(true);
                          setNotice("以前の設定を読み込めませんでした。");
                        }
                      }}
                    >
                      {index + 1}回前
                      {previous.savedAt &&
                      Number.isFinite(Date.parse(previous.savedAt))
                        ? "（" +
                          new Intl.DateTimeFormat("ja-JP", {
                            timeZone: "Asia/Tokyo",
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(previous.savedAt)) +
                          "）"
                        : ""}
                    </button>
                  ))}
                </details>
              ) : null}
              <h3>検索・共有表示</h3>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  const next = { ...local };
                  delete next.meta;
                  change({
                    ...settings,
                    pages: { ...settings.pages, [path]: next },
                  });
                }}
              >
                検索・共有を標準に戻す
              </button>
              <label>
                検索タイトル
                <input
                  value={local.meta?.title ?? document?.meta?.title ?? ""}
                  onChange={(e) =>
                    change({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        [path]: {
                          ...local,
                          meta: { ...local.meta, title: e.target.value },
                        },
                      },
                    })
                  }
                />
              </label>
              <label>
                説明
                <textarea
                  value={
                    local.meta?.description ?? document?.meta?.description ?? ""
                  }
                  onChange={(e) =>
                    change({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        [path]: {
                          ...local,
                          meta: { ...local.meta, description: e.target.value },
                        },
                      },
                    })
                  }
                />
              </label>
              <label>
                共有画像URL
                <input
                  value={local.meta?.image ?? document?.meta?.image ?? ""}
                  onChange={(e) =>
                    change({
                      ...settings,
                      pages: {
                        ...settings.pages,
                        [path]: {
                          ...local,
                          meta: { ...local.meta, image: e.target.value },
                        },
                      },
                    })
                  }
                />
              </label>
              <label>
                色の反映範囲
                <select
                  value={themeScope}
                  onChange={(e) =>
                    setThemeScope(e.target.value as "shared" | "page")
                  }
                >
                  <option value="page">このページ</option>
                  <option value="shared">全ページ</option>
                </select>
              </label>
              {Object.entries(themeNames).map(([key, label]) => {
                const current =
                  themeScope === "shared" ? settings.shared : local;
                const value = current.theme?.[key];
                return (
                  <label key={key}>
                    {label}
                    <input
                      type="color"
                      value={colorHex(
                        value ||
                          settings.shared.theme?.[key] ||
                          computedStyles.__theme?.[key] ||
                          "#fff7d9",
                      )}
                      onChange={(e) => {
                        const theme = {
                          ...current.theme,
                          [key]: e.target.value,
                        };
                        change(
                          themeScope === "shared"
                            ? { ...settings, shared: { ...current, theme } }
                            : {
                                ...settings,
                                pages: {
                                  ...settings.pages,
                                  [path]: { ...current, theme },
                                },
                              },
                        );
                      }}
                    />
                    {value ? (
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => {
                          const theme = { ...current.theme };
                          delete theme[key];
                          change(
                            themeScope === "shared"
                              ? { ...settings, shared: { ...current, theme } }
                              : {
                                  ...settings,
                                  pages: {
                                    ...settings.pages,
                                    [path]: { ...current, theme },
                                  },
                                },
                          );
                        }}
                      >
                        標準に戻す
                      </button>
                    ) : (
                      <small>標準・共通の色</small>
                    )}
                  </label>
                );
              })}
            </fieldset>
          </details>
        </aside>
      </div>
      <div className="visual-savebar">
        <div className="visual-save-state"><span className="visual-edit-status" data-state={editState}>{statusText}</span></div>
        <button
          type="button"
          className="primary-button"
          disabled={busy || !!deploy}
          onClick={review ? publish : preview}
        >
          {busy ? "処理中" : review ? "サイトに掲載" : "掲載前に確認"}
        </button>
      </div>
    </div>
  );
}
