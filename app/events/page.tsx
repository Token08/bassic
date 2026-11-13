import { visualMetadata } from '@public/lib/visual-metadata';
import { editablePage } from '@public/lib/editable-page';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CustomSectionBlock, PageHero } from "@public/components/content";
import { EventCalendarSection } from "@public/components/event-calendar";
import { PageShell } from "@public/components/site-shell";
import { editableMedia, resolveHeroSlides } from "@public/lib/editable-content";
import { getCmsContents } from "@public/lib/microcms";
import { pageHeroes } from "@public/lib/page-content";
import { buildMetadata } from "@public/lib/seo";

const defaultMetadata: Metadata = {
  ...buildMetadata("events")
};
export function generateMetadata(){return visualMetadata(defaultMetadata,'/events/');}

export default async function EventsPage() {
  const contents = await getCmsContents();
  const copy = contents.pageCopy.events;
  const pageSections = contents.pageSections.events;
  const sectionOrder = (key: string, fallback: number) => pageSections.find((section) => section.sectionKey === key)?.displayOrder ?? fallback;
  const visibleSections = new Set(pageSections.map((section) => section.sectionKey));
  const eventSlides = resolveHeroSlides(contents.heroSlides.events, editableMedia.eventHeroSlides);
  const managedSectionItems: Array<{ key: string; order: number; node: ReactNode } | null> = [
    visibleSections.has("hero")
      ? {
          key: "hero",
          order: sectionOrder("hero", 1),
          node: (
            <PageHero
              eyebrow={copy.heroEyebrow || pageHeroes.events.eyebrow}
              title={copy.heroTitle || pageHeroes.events.title}
              lead={copy.heroLead || pageHeroes.events.lead}
              slides={eventSlides}
              className={pageHeroes.events.className}
              actionLabels={{ reserveLabel: "お問い合わせ" }}
            />
          )
        }
      : null,
    visibleSections.has("calendar") ? { key: "calendar", order: sectionOrder("calendar", 3), node: <EventCalendarSection note={copy.calendarNote} /> } : null,
    ...contents.customSections.events.map((section) => ({
      key: `custom-${section.id || section.title}`,
      order: section.displayOrder ?? 9000,
      node: <CustomSectionBlock section={section} />
    }))
  ];
  const managedSections = managedSectionItems.filter((section): section is NonNullable<typeof section> => section !== null);

  return editablePage('/events/', (
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
