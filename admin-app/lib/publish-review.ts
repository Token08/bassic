import type {
  VisualSettings,
  VisualNode,
  VisualPage,
} from "../../lib/editor-document";

export type ChangeDetail = {
  label: string;
  kind: string;
  before?: string;
  after?: string;
};
export type ChangeGroup = {
  path: string;
  label: string;
  details: ChangeDetail[];
};
const pageNames: Record<string, string> = {
  "/": "TOPページ",
  "/events/": "イベント",
  "/menu/": "MENU",
  "/party/": "貸切・機材",
  "/access/": "アクセス",
  "/first-visit/": "初めての方へ",
};
export function pageLabel(path: string) {
  const locale = /^\/(en|ko|zh-hant|zh-hans)(\/.*)$/.exec(path);
  return (
    (pageNames[locale?.[2] || path] || "ページ") +
    (locale
      ? "（" +
        (
          {
            en: "英語",
            ko: "韓国語",
            "zh-hant": "繁体字",
            "zh-hans": "簡体字",
          } as Record<string, string>
        )[locale[1]] +
        "）"
      : "")
  );
}
function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalized(val)] as const)
      .filter(([, val]) => val !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));
function short(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text ? (text.length > 90 ? text.slice(0, 90) + "…" : text) : "空欄";
}
function textValue(
  value: Record<string, string> | undefined,
  defaults?: Record<string, string>,
) {
  return value || defaults
    ? short(Object.values({ ...defaults, ...value }).join(" "))
    : "標準の内容";
}

/** Compare editable content only; revision/history and object-key order aren't changes. */
export function summarizeVisualChanges(
  before: VisualSettings,
  after: VisualSettings,
  catalog: VisualNode[],
  currentPath: string,
): ChangeGroup[] {
  const groups: ChangeGroup[] = [];
  const paths = [
    "shared",
    ...new Set([...Object.keys(before.pages), ...Object.keys(after.pages)]),
  ];
  for (const path of paths) {
    const old: VisualPage = (path === "shared"
      ? before.shared
      : before.pages[path]) || { nodes: {} };
    const next: VisualPage = (path === "shared"
      ? after.shared
      : after.pages[path]) || { nodes: {} };
    const details: ChangeDetail[] = [];
    const structuralIds = (page: VisualPage) =>
      new Set(
        Object.values(page.nodes).flatMap((p) => [
          ...(p.copies || []).map((x) => x.id),
          ...(p.blocks || []).map((x) => x.id),
        ]),
      );
    const oldIds = structuralIds(old),
      nextIds = structuralIds(next);
    const changedPrefixes = [...oldIds]
      .filter((id) => !nextIds.has(id))
      .concat([...nextIds].filter((id) => !oldIds.has(id)));
    for (const id of new Set([
      ...Object.keys(old.nodes),
      ...Object.keys(next.nodes),
    ])) {
      if (
        changedPrefixes.some(
          (prefix) => id === prefix || id.startsWith(prefix + "."),
        )
      )
        continue;
      const a = old.nodes[id] || {},
        b = next.nodes[id] || {};
      const node =
        path === "shared" || path === currentPath
          ? catalog.find((n) => n.id === id)
          : undefined;
      const label = node
        ? /^h[1-6]$/.test(node.tag)
          ? "見出し"
          : node.tag === "img"
            ? "写真"
            : node.tag === "a"
              ? "リンク"
              : node.tag === "p"
                ? "文章"
                : "ページの項目"
        : "ページの項目";
      if (!equal(a.texts, b.texts))
        details.push({
          label,
          kind: "文章",
          before: textValue(a.texts, node?.texts),
          after: textValue(b.texts, node?.texts),
        });
      const attrsA = a.attrs || {},
        attrsB = b.attrs || {};
      if (
        !equal(
          [attrsA.src, attrsA.alt, a.mobileImage],
          [attrsB.src, attrsB.alt, b.mobileImage],
        )
      )
        details.push({ label, kind: "写真・ロゴ" });
      if (
        !equal(
          [
            attrsA.href,
            attrsA.title,
            attrsA["aria-label"],
            a.mailSubject,
            a.mailBody,
          ],
          [
            attrsB.href,
            attrsB.title,
            attrsB["aria-label"],
            b.mailSubject,
            b.mailBody,
          ],
        )
      )
        details.push({ label, kind: "ボタン・リンク" });
      if (!equal(a.hidden, b.hidden))
        details.push({
          label,
          kind: "表示",
          before:
            a.hidden === undefined
              ? "標準を使う"
              : a.hidden
                ? "非表示"
                : "表示する",
          after:
            b.hidden === undefined
              ? "標準を使う"
              : b.hidden
                ? "非表示"
                : "表示する",
        });
      if (!equal(a.order, b.order)) details.push({ label, kind: "並び順" });
      if (!equal([a.blocks, a.copies], [b.blocks, b.copies]))
        details.push({ label, kind: "カード・案内の追加／削除" });
      if (
        !equal(
          [
            a.style,
            a.mobile,
            a.before,
            a.after,
            a.mobileBefore,
            a.mobileAfter,
            a.beforeText,
            a.afterText,
            a.backgroundMode,
          ],
          [
            b.style,
            b.mobile,
            b.before,
            b.after,
            b.mobileBefore,
            b.mobileAfter,
            b.beforeText,
            b.afterText,
            b.backgroundMode,
          ],
        )
      )
        details.push({ label, kind: "見た目" });
    }
    for (const key of [
      "theme",
      "baseStyle",
      "mobileBaseStyle",
      "dialogStyle",
      "dialogButtonStyle",
      "dialogCaptionStyle",
      "interactions",
      "meta",
    ] as const) {
      if (!equal(old[key], next[key]))
        details.push({
          label: key === "meta" ? "検索・共有表示" : "ページ全体",
          kind: key === "meta" ? "検索・共有表示" : "見た目",
        });
    }
    if (details.length)
      groups.push({
        path,
        label: path === "shared" ? "全ページ共通（全言語）" : pageLabel(path),
        details,
      });
  }
  return groups;
}

function snapshot(value: VisualSettings): VisualSettings {
  return {
    version: 1,
    ...(value.revision ? { revision: value.revision } : {}),
    ...(value.savedAt ? { savedAt: value.savedAt } : {}),
    shared: value.shared,
    pages: value.pages,
  };
}
export function visualHistory(settings: VisualSettings) {
  const history: VisualSettings[] = [];
  let next = settings.previous;
  while (next && history.length < 3) {
    if (next.version !== 1 || !next.shared || !next.pages) break;
    history.push(next);
    next = next.previous;
  }
  return history;
}
/** Existing `previous` format, bounded to three snapshots and the storage limit. */
export function withVisualHistory(
  current: VisualSettings,
  before: VisualSettings,
  maxChars = 500000,
): VisualSettings {
  const result = snapshot(current);
  const history = [
    snapshot(before),
    ...visualHistory(before).map(snapshot),
  ].slice(0, 3);
  const attach = () => {
    delete result.previous;
    let item = result;
    for (const prior of history) {
      delete prior.previous;
      item.previous = prior;
      item = prior;
    }
  };
  attach();
  while (history.length && JSON.stringify(result).length > maxChars) {
    history.pop();
    attach();
  }
  if (JSON.stringify(result).length > maxChars)
    throw Error("設定が大きすぎます。");
  return result;
}
