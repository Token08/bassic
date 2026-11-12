import { visualMetadata } from '@public/lib/visual-metadata';
import { editablePage } from '@public/lib/editable-page';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CustomSectionBlock, PageHero, PartyContent } from "@public/components/content";
import { PageShell } from "@public/components/site-shell";
import { editableMedia, resolveHeroSlides } from "@public/lib/editable-content";
import { getCmsContents } from "@public/lib/microcms";
import { pageHeroes } from "@public/lib/page-content";
import { buildMetadata } from "@public/lib/seo";

const defaultMetadata: Metadata = buildMetadata("party");
export function generateMetadata(){return visualMetadata(defaultMetadata,'/party/');}

export default async function PartyPage() {
  const contents = await getCmsContents();
  const copy = contents.pageCopy.party;
  const pageSections = contents.pageSections.party;
  const sectionOrder = (key: string, fallback: number) => pageSections.find((section) => section.sectionKey === key)?.displayOrder ?? fallback;
  const visibleSections = new Set(pageSections.map((section) => section.sectionKey));
  const partySlides = resolveHeroSlides(contents.heroSlides.party, editableMedia.partyHeroSlides);
  const hasPartyContent = visibleSections.has("plans") || visibleSections.has("equipmentRental") || visibleSections.has("useCases");
  const managedSectionItems: Array<{ key: string; order: number; node: ReactNode } | null> = [
    visibleSections.has("hero")
      ? {
          key: "hero",
          order: sectionOrder("hero", 1),
          node: (
            <PageHero
              eyebrow={copy.heroEyebrow || pageHeroes.party.eyebrow}
              title={copy.heroTitle || pageHeroes.party.title}
              lead={copy.heroLead || pageHeroes.party.lead}
              slides={partySlides}
              className={pageHeroes.party.className}
            />
          )
        }
      : null,
    hasPartyContent
      ? {
          key: "partyContent",
          order: Math.min(sectionOrder("plans", 2), sectionOrder("equipmentRental", 3), sectionOrder("useCases", 4)),
          node: (
            <PartyContent
              plans={contents.partyPlans}
              equipmentRental={contents.equipmentRental}
              showPlans={visibleSections.has("plans")}
              showEquipmentRental={visibleSections.has("equipmentRental")}
              showUseCases={visibleSections.has("useCases")}
              partyLead={copy.partyLead}
              rentalLead={copy.rentalLead}
            />
          )
        }
      : null,
    ...contents.customSections.party.map((section) => ({
      key: `custom-${section.id || section.title}`,
      order: section.displayOrder ?? 9000,
      node: <CustomSectionBlock section={section} />
    }))
  ];
  const managedSections = managedSectionItems.filter((section): section is NonNullable<typeof section> => section !== null);

  return editablePage('/party/', (
    <PageShell settings={contents.siteSettings}>
      <main>
        {managedSections.sort((a, b) => a.order - b.order).map((section) => (
          <div className="managed-section" data-public-section={section.key} key={section.key}>
            {section.node}
          </div>
        ))}
      </main>
    </PageShell>
  ));
}
