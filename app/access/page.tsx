import type { Metadata } from "next";
import { AccessContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { resolveEditableImage } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("access");

export default async function AccessPage() {
  const contents = await getCmsContents();
  const accessHero = resolveEditableImage(contents.heroSlides.access[0]?.image, {
    src: pageHeroes.access.image || "",
    alt: pageHeroes.access.imageAlt || ""
  });

  return (
    <PageShell settings={contents.siteSettings}>
      <main>
        <PageHero
          eyebrow={pageHeroes.access.eyebrow}
          title={pageHeroes.access.title}
          lead={pageHeroes.access.lead}
          image={accessHero.src}
          imageAlt={accessHero.alt}
          className={pageHeroes.access.className}
        />
        <AccessContent note={contents.home.accessNote} settings={contents.siteSettings} />
      </main>
    </PageShell>
  );
}
