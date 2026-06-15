import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AccessContent,
  CustomSectionBlock,
  FirstVisitBlock,
  LocalSearchSection,
  PageHero,
  SocialUpdatesSection,
  VisitInfoCards
} from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { editableMedia, resolveEditableImage, resolveHeroSlides } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";

export const metadata: Metadata = buildMetadata("home");

function JsonLd({ settings }: { settings: SiteSettings }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${site.siteUrl.replace(/\/$/, "")}/#bar`,
    name: site.name,
    alternateName: site.japaneseName,
    description: site.description,
    url: site.siteUrl,
    telephone: settings.phone,
    email: site.email,
    priceRange: site.priceRange,
    image: absoluteUrl("/ogp.png"),
    hasMap: settings.googleMapsUrl,
    hasMenu: absoluteUrl("/menu/"),
    keywords: site.keywords.join(", "),
    areaServed: [
      { "@type": "City", name: "福岡市" },
      { "@type": "Place", name: "天神" },
      { "@type": "Place", name: "親不孝通り" }
    ],
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "喫煙可", value: true },
      { "@type": "LocationFeatureSpecification", name: "ライヴ・DJイベント", value: true },
      { "@type": "LocationFeatureSpecification", name: "貸切相談", value: true }
    ],
    smokingAllowed: true,
    publicAccess: true,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "通常営業時間",
        value: settings.hoursLabel
      },
      {
        "@type": "PropertyValue",
        name: "チャージ",
        value: settings.chargeLabel
      },
      {
        "@type": "PropertyValue",
        name: "喫煙",
        value: settings.smokingLabel
      }
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "20:00",
        closes: "02:00"
      }
    ],
    sameAs: [settings.instagramUrl, settings.xUrl, settings.facebookUrl, settings.onlineStoreUrl || site.onlineStoreUrl],
    address: {
      "@type": "PostalAddress",
      postalCode: site.postalCode,
      addressRegion: site.region,
      addressLocality: site.locality,
      streetAddress: settings.address,
      addressCountry: "JP"
    },
    founder: {
      "@type": "Person",
      name: site.owner
    }
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function Home() {
  const contents = await getCmsContents();
  const copy = contents.pageCopy.home;
  const pageSections = contents.pageSections.home;
  const sectionOrder = (key: string, fallback: number) => pageSections.find((section) => section.sectionKey === key)?.displayOrder ?? fallback;
  const visibleSections = new Set(pageSections.map((section) => section.sectionKey));
  const homeHeroImage = resolveEditableImage(contents.home.heroImage, editableMedia.homeHeroImage);
  const homeHeroSlides = resolveHeroSlides(contents.heroSlides.home, editableMedia.homeHeroSlides);
  const managedSectionItems: Array<{ key: string; order: number; node: ReactNode } | null> = [
    visibleSections.has("hero")
      ? {
          key: "hero",
          order: sectionOrder("hero", 1),
          node: (
            <PageHero
              eyebrow={site.tagline}
              title={copy.heroTitle || contents.home.heroTitle}
              lead={copy.heroLead || contents.home.heroLead}
              image={homeHeroImage.src}
              imageAlt={homeHeroImage.alt}
              slides={homeHeroSlides}
              className="home-hero"
            />
          )
        }
      : null,
    visibleSections.has("firstVisit")
      ? { key: "firstVisit", order: sectionOrder("firstVisit", 2), node: <FirstVisitBlock lead={copy.introLead || contents.home.firstVisitLead} tone="light" /> }
      : null,
    visibleSections.has("visitInfo")
      ? { key: "visitInfo", order: sectionOrder("visitInfo", 3), node: <VisitInfoCards settings={contents.siteSettings} /> }
      : null,
    visibleSections.has("localSearch")
      ? { key: "localSearch", order: sectionOrder("localSearch", 4), node: <LocalSearchSection /> }
      : null,
    visibleSections.has("social")
      ? {
          key: "social",
          order: sectionOrder("social", 5),
          node: (
            <SocialUpdatesSection
              notices={contents.socialNotices}
              instagramWidgetSrc={contents.home.instagramWidgetSrc}
              settings={contents.siteSettings}
              titleLine1={copy.socialTitleLine1}
              titleLine2={copy.socialTitleLine2}
              lead={copy.socialLead}
            />
          )
        }
      : null,
    visibleSections.has("access")
      ? {
          key: "access",
          order: sectionOrder("access", 6),
          node: <AccessContent note={copy.accessNote || contents.home.accessNote} settings={contents.siteSettings} />
        }
      : null,
    ...contents.customSections.home.map((section) => ({
      key: `custom-${section.id || section.title}`,
      order: section.displayOrder ?? 9000,
      node: <CustomSectionBlock section={section} />
    }))
  ];
  const managedSections = managedSectionItems.filter((section): section is NonNullable<typeof section> => section !== null);

  return (
    <PageShell settings={contents.siteSettings}>
      <JsonLd settings={contents.siteSettings} />
      <main id="top">
        {managedSections.sort((a, b) => a.order - b.order).map((section) => (
          <div className="managed-section" key={section.key}>
            {section.node}
          </div>
        ))}
      </main>
    </PageShell>
  );
}
