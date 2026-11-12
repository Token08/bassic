import { createElement, type ReactNode } from "react";
import { getCmsContents } from "./microcms";
import {
  renderVisualTree,
  emptyVisualSettings,
  parseVisualSettings,
} from "./editor-document";
export async function editablePage(path: string, tree: ReactNode) {
  const data = await getCmsContents();
  const settings = data.visualEditor || emptyVisualSettings();
  const rendered = renderVisualTree(
    tree,
    path,
    parseVisualSettings(settings),
    false,
    data.siteSettings as unknown as Record<string, unknown>,
  );
  return createElement(
    "div",
    {
      "data-visual-page": path,
      "data-visual-revision": settings.revision || "",
      style: { display: "contents" },
    },
    rendered.tree,
    createElement("script", {
      id: "bassic-editor-interactions",
      type: "application/json",
      dangerouslySetInnerHTML: {
        __html: JSON.stringify({
          ...settings.shared.interactions,
          ...settings.pages[path]?.interactions,
        }).replaceAll("<", "\\u003c"),
      },
    }),
    createElement("script", {
      id: "bassic-editor-catalog",
      type: "application/json",
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(rendered.catalog).replaceAll("<", "\\u003c"),
      },
    }),
  );
}
