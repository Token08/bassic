import { NextRequest, NextResponse } from "next/server";
import { renderToReadableStream } from "react-dom/server.edge";
import { isAuthenticatedRequest } from "@/lib/auth";
import {
  getContent,
  updateObjectContent,
  readEditorSnapshot,
} from "@/lib/microcms";
import {
  parseVisualSettings,
  emptyVisualSettings,
  allowedVisualPath,
  type VisualSettings,
} from "@public/lib/editor-document";
import { previewContents } from "@public/lib/preview-context";
import { normalizeContents } from "@public/lib/microcms";
import Home from "@public/app/page";
import Events from "@public/app/events/page";
import Menu from "@public/app/menu/page";
import Party from "@public/app/party/page";
import Access from "@public/app/access/page";
import FirstVisit from "@public/app/first-visit/page";
import { renderLocalizedPage } from "@public/lib/localized-page";
import type { CmsContents } from "@public/lib/types";
export const runtime = "nodejs";
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function stored() {
  const raw = (await getContent("visual-editor")) as Record<string, unknown>;
  if (!raw.version) return emptyVisualSettings();
  return parseVisualSettings(raw);
}
export async function GET(r: NextRequest) {
  if (!isAuthenticatedRequest(r)) return reply({ ok: false }, 401);
  try {
    return reply({ ok: true, data: await stored() });
  } catch {
    return reply({ ok: false, message: "設定を読み込めませんでした。" }, 502);
  }
}
export async function PUT(r: NextRequest) {
  if (!isAuthenticatedRequest(r)) return reply({ ok: false }, 401);
  try {
    const payload = await r.json();
    const settings = parseVisualSettings(payload.settings);
    const before = await stored();
    if (payload.baseRevision !== (before.revision || ""))
      return reply(
        {
          ok: false,
          message:
            "別の更新が保存されています。入力を控えてから再読み込みしてください。",
        },
        409,
      );
    settings.previous = { ...before };
    delete settings.previous.previous;
    settings.revision = crypto.randomUUID();
    parseVisualSettings(settings);
    await updateObjectContent(
      "visual-editor",
      settings as unknown as Record<string, unknown>,
    );
    return reply({ ok: true, data: settings });
  } catch (error) {
    return reply(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "保存できませんでした。",
      },
      502,
    );
  }
}
export async function POST(r: NextRequest) {
  if (!isAuthenticatedRequest(r)) return reply({ ok: false }, 401);
  try {
    const payload = await r.json();
    const path = payload.path as string;
    if (!allowedVisualPath(path))
      return reply(
        { ok: false, message: "対象ページを確認してください。" },
        400,
      );
    const config: VisualSettings = payload.settings
      ? parseVisualSettings(payload.settings)
      : await stored();
    const keys = [
      "site-settings",
      "home",
      "hero-slides",
      "events",
      "menu",
      "drink-menu-sheets",
      "party-plans",
      "equipment-rental",
      "social-notices",
      "page-copy",
      "page-sections",
      "custom-sections",
    ];
    const data = await readEditorSnapshot();
    if (payload.sectionId && payload.draft) {
      const key = String(payload.sectionId);
      if (!keys.includes(key)) throw Error("編集対象を確認してください。");
      if (Array.isArray(data[key])) {
        const draft = payload.draft as { id?: string };
        data[key] = [
          ...(data[key] as { id?: string }[]).filter((x) => x.id !== draft.id),
          draft,
        ];
      } else data[key] = payload.draft;
    }
    const group = (items: Record<string, unknown>[], field: string) =>
      Object.fromEntries(
        [...new Set(items.map((x) => String(x[field])))].map((key) => [
          key,
          items.filter((x) => x[field] === key),
        ]),
      );
    const snapshot = normalizeContents(
      {
        siteSettings: data["site-settings"],
        home: data.home,
        heroSlides: group(
          data["hero-slides"] as Record<string, unknown>[],
          "page",
        ),
        events: data.events,
        menu: data.menu,
        drinkMenuSheets: data["drink-menu-sheets"],
        partyPlans: data["party-plans"],
        equipmentRental: data["equipment-rental"],
        socialNotices: data["social-notices"],
        pageCopy: Object.fromEntries(
          (data["page-copy"] as { page: string }[]).map((x) => [x.page, x]),
        ),
        customSections: group(
          data["custom-sections"] as Record<string, unknown>[],
          "page",
        ),
        visualEditor: config,
      } as Partial<CmsContents>,
      data["page-sections"] as CmsContents["pageSections"]["home"],
    );
    const route = path.replace(/^\/(en|ko|zh-hant|zh-hans)\//, "/");
    const locale = /^\/(en|ko|zh-hant|zh-hans)\//.exec(path)?.[1];
    const pages: Record<string, () => Promise<React.ReactNode>> = {
      "/": Home,
      "/events/": Events,
      "/menu/": Menu,
      "/party/": Party,
      "/access/": Access,
      "/first-visit/": FirstVisit,
    };
    const tree = await previewContents.run(snapshot, () =>
      locale
        ? renderLocalizedPage(
            (route === "/" ? "home" : route.slice(1, -1)) as "home",
            Promise.resolve({ locale }),
          )
        : pages[route](),
    );
    const markup = await new Response(
      await renderToReadableStream(tree),
    ).text();
    const base =
      process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/";
    const upstream = await fetch(new URL(path, base), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw Error("公開ページの見た目を取得できませんでした。");
    const original = await upstream.text();
    const publishedRevision =
      /data-visual-revision="([^"]*)"/.exec(original)?.[1] || "";
    let head = (
      /<head[^>]*>([\s\S]*?)<\/head>/i.exec(original)?.[1] || ""
    ).replace(/<script\b[\s\S]*?<\/script>/g, "");
    const meta = { ...config.shared.meta, ...config.pages[path]?.meta };
    const escape = (text: string) =>
      text
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined) continue;
      if (key === "title") {
        head = head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, "");
        head += "<title>" + escape(value) + "</title>";
      }
      for (const [attribute, name] of key === "title"
        ? [
            ["property", "og:title"],
            ["name", "twitter:title"],
          ]
        : key === "description"
          ? [
              ["name", "description"],
              ["property", "og:description"],
              ["name", "twitter:description"],
            ]
          : [
              ["property", "og:image"],
              ["name", "twitter:image"],
            ]) {
        head = head.replace(
          new RegExp(
            "<meta\\b(?=[^>]*" + attribute + '="' + name + '")[^>]*>',
            "gi",
          ),
          "",
        );
        if (value)
          head +=
            "<meta " +
            attribute +
            '="' +
            name +
            '" content="' +
            escape(value) +
            '">';
      }
    }
    const pageKey = route === "/" ? "home" : route.slice(1, -1);
    const hiddenRecords = [
      "page-sections",
      "custom-sections",
      "hero-slides",
    ].flatMap((endpoint) =>
      (data[endpoint] as Record<string, unknown>[])
        .filter((item) => item.page === pageKey && item.isPublished === false)
        .map((item) => ({
          endpoint,
          id: item.id,
          label: String(item.title || item.sectionKey || "非表示の項目"),
        })),
    );
    return reply({
      ok: true,
      data: {
        hiddenRecords,
        publishedRevision,
        html:
          '<!doctype html><html><head><base href="' +
          new URL(path, base).href +
          '">' +
          head +
          "</head><body>" +
          markup +
          "</body></html>",
        url: new URL(path, base).href,
      },
    });
  } catch (error) {
    return reply(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "プレビューを取得できませんでした。",
      },
      502,
    );
  }
}
