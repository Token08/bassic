import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CustomSectionBlock, EventList, PageHero } from "@/components/content";
import { EventCalendarSection } from "@/components/event-calendar";
import { PageShell } from "@/components/site-shell";
import { editableMedia, resolveHeroSlides } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";

export const metadata: Metadata = {
  ...buildMetadata("events")
};

function EventsJsonLd({ events, settings }: { events: Awaited<ReturnType<typeof getCmsContents>>["events"]; settings: SiteSettings }) {
  const data = events.slice(0, 8).map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: `${event.date}T${event.startTime || event.openTime || "20:00"}:00+09:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: site.name,
      address: settings.address
    },
    image: [event.image?.url ? (event.image.url.startsWith("/") ? absoluteUrl(event.image.url) : event.image.url) : absoluteUrl("/ogp.png")],
    description: [event.performers, event.price, event.reservation].filter(Boolean).join(" / "),
    url: event.sourceUrl || absoluteUrl("/events/"),
    organizer: {
      "@type": "Organization",
      name: site.name,
      url: site.siteUrl
    }
  }));

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

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
            />
          )
        }
      : null,
    visibleSections.has("eventList")
      ? {
          key: "eventList",
          order: sectionOrder("eventList", 2),
          node: (
            <section className="section">
              <div className="section-heading narrow-copy">
                <p className="eyebrow">{copy.listEyebrow || "Event List"}</p>
                <h2>{copy.listTitle || "Event Schedule"}</h2>
              </div>
              <EventList events={contents.events} />
            </section>
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

  return (
    <PageShell settings={contents.siteSettings}>
      <EventsJsonLd events={contents.events} settings={contents.siteSettings} />
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
