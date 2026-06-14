import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import { EventCalendarSection } from "@/components/event-calendar";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  ...buildMetadata("events")
};

function EventsJsonLd({ events }: { events: Awaited<ReturnType<typeof getCmsContents>>["events"] }) {
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
      address: site.address
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

  return (
    <PageShell>
      <EventsJsonLd events={contents.events} />
      <main>
        <PageHero
          eyebrow={pageHeroes.events.eyebrow}
          title={pageHeroes.events.title}
          lead={pageHeroes.events.lead}
          slides={pageHeroes.events.slides}
          className={pageHeroes.events.className}
        />
        <EventCalendarSection />
      </main>
    </PageShell>
  );
}
