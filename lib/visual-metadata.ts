import type { Metadata } from "next";
import { getCmsContents } from "./microcms";
export async function visualMetadata(
  base: Metadata,
  path: string,
): Promise<Metadata> {
  const { visualEditor } = await getCmsContents();
  const m = {
    ...visualEditor?.shared.meta,
    ...visualEditor?.pages[path]?.meta,
  };
  return {
    ...base,
    ...(m.title !== undefined ? { title: { absolute: m.title } } : {}),
    ...(m.description !== undefined ? { description: m.description } : {}),
    openGraph: {
      ...base.openGraph,
      ...(m.title !== undefined ? { title: m.title } : {}),
      ...(m.description !== undefined ? { description: m.description } : {}),
      ...(m.image !== undefined ? { images: m.image ? [m.image] : [] } : {}),
    },
    twitter: {
      ...base.twitter,
      ...(m.title !== undefined ? { title: m.title } : {}),
      ...(m.description !== undefined ? { description: m.description } : {}),
      ...(m.image !== undefined ? { images: m.image ? [m.image] : [] } : {}),
    },
  };
}
