import type { Metadata } from "next";
import {
  AccessContent,
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
      { "@type": "LocationFeatureSpecification", name: "店内喫煙可", value: true },
      { "@type": "LocationFeatureSpecification", name: "ライヴ・DJイベント", value: true },
      { "@type": "LocationFeatureSpecification", name: "貸切相談可", value: true }
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
        name: "テーブル・チャージ",
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
  const homeHeroImage = resolveEditableImage(contents.home.heroImage, editableMedia.homeHeroImage);
  const homeHeroSlides = resolveHeroSlides(contents.heroSlides.home, editableMedia.homeHeroSlides);

  return (
    <PageShell settings={contents.siteSettings}>
      <JsonLd settings={contents.siteSettings} />
      <main id="top">
        <PageHero
          eyebrow={site.tagline}
          title={contents.home.heroTitle}
          lead={contents.home.heroLead}
          image={homeHeroImage.src}
          imageAlt={homeHeroImage.alt}
          slides={homeHeroSlides}
          className="home-hero"
        />

        <FirstVisitBlock lead={contents.home.firstVisitLead} tone="light" />
        <VisitInfoCards settings={contents.siteSettings} />
        <LocalSearchSection />
        <SocialUpdatesSection
          notices={contents.socialNotices}
          instagramWidgetSrc={contents.home.instagramWidgetSrc}
          settings={contents.siteSettings}
        />

        <AccessContent note={contents.home.accessNote} settings={contents.siteSettings} />
      </main>
    </PageShell>
  );
}
