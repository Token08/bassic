import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccessContent, CustomSectionBlock, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { resolveEditableImage } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("access");

export default async function AccessPage() {
  const contents = await getCmsContents();
  const copy = contents.pageCopy.access;
  const pageSections = contents.pageSections.access;
  const sectionOrder = (key: string, fallback: number) => pageSections.find((section) => section.sectionKey === key)?.displayOrder ?? fallback;
  const visibleSections = new Set(pageSections.map((section) => section.sectionKey));
  const accessHero = resolveEditableImage(contents.heroSlides.access[0]?.image, {
    src: pageHeroes.access.image || "",
    alt: pageHeroes.access.imageAlt || ""
  });
  const hasAccessContent = visibleSections.has("accessInfo") || visibleSections.has("googleMap");
  const managedSectionItems: Array<{ key: string; order: number; node: ReactNode } | null> = [
    visibleSections.has("hero")
      ? {
          key: "hero",
          order: sectionOrder("hero", 1),
          node: (
            <PageHero
              eyebrow={copy.heroEyebrow || pageHeroes.access.eyebrow}
              title={copy.heroTitle || pageHeroes.access.title}
              lead={copy.heroLead || pageHeroes.access.lead}
              image={accessHero.src}
              imageAlt={accessHero.alt}
              className={pageHeroes.access.className}
            />
          )
        }
      : null,
    hasAccessContent
      ? {
          key: "accessContent",
          order: Math.min(sectionOrder("accessInfo", 2), sectionOrder("googleMap", 3)),
          node: (
            <AccessContent
              note={copy.accessNote || contents.home.accessNote}
              settings={contents.siteSettings}
              showInfo={visibleSections.has("accessInfo")}
              showMap={visibleSections.has("googleMap")}
            />
          )
        }
      : null,
    ...contents.customSections.access.map((section) => ({
      key: `custom-${section.id || section.title}`,
      order: section.displayOrder ?? 9000,
      node: <CustomSectionBlock section={section} />
    }))
  ];
  const managedSections = managedSectionItems.filter((section): section is NonNullable<typeof section> => section !== null);

  return (
    <PageShell settings={contents.siteSettings}>
      <main>
        {managedSections.sort((a, b) => a.order - b.order).map((section) => (
          <div className="managed-section" key={section.key}>
            {section.node}
          </div>
        ))}
      </main>
    </PageShell>
  );
}
