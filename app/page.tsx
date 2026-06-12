import type { Metadata } from "next";
import {
  AccessContent,
  FirstVisitBlock,
  HomeMenuTeaser,
  LocalSearchSection,
  PageHero,
  SocialUpdatesSection,
  VisitInfoCards
} from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { editableMedia, resolveEditableImage } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = buildMetadata("home");

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${site.siteUrl}/#bar`,
    name: site.name,
    alternateName: site.japaneseName,
    description: site.description,
    url: site.siteUrl,
    telephone: site.phone,
    email: site.email,
    priceRange: site.priceRange,
    image: `${site.siteUrl}/ogp.png`,
    hasMap: site.googleMapsUrl,
    hasMenu: `${site.siteUrl}/menu/`,
    keywords: "福岡 ミュージックバー, 天神 バー, 親不孝通り バー, 福岡 ライブバー, 天神 貸切, ファズカレー",
    areaServed: [
      { "@type": "City", name: "福岡市" },
      { "@type": "Place", name: "天神" },
      { "@type": "Place", name: "親不孝通り" }
    ],
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "喫煙可", value: true },
      { "@type": "LocationFeatureSpecification", name: "ライブ・DJイベント", value: true },
      { "@type": "LocationFeatureSpecification", name: "貸切相談", value: true }
    ],
    smokingAllowed: true,
    publicAccess: true,
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "通常営業時間",
        value: site.hoursLabel
      },
      {
        "@type": "PropertyValue",
        name: "チャージ",
        value: site.chargeLabel
      },
      {
        "@type": "PropertyValue",
        name: "喫煙",
        value: site.smokingLabel
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
    sameAs: [site.instagramUrl, site.xUrl, site.facebookUrl, site.onlineStoreUrl],
    address: {
      "@type": "PostalAddress",
      postalCode: site.postalCode,
      addressRegion: site.region,
      addressLocality: site.locality,
      streetAddress: site.streetAddress,
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

  return (
    <PageShell>
      <JsonLd />
      <main id="top">
        <PageHero
          eyebrow={site.tagline}
          title={contents.home.heroTitle}
          lead={contents.home.heroLead}
          image={homeHeroImage.src}
          imageAlt={homeHeroImage.alt}
          slides={editableMedia.homeHeroSlides}
          className="home-hero"
        />

        <FirstVisitBlock lead={contents.home.firstVisitLead} tone="light" />
        <VisitInfoCards />
        <LocalSearchSection />
        <SocialUpdatesSection />

        <HomeMenuTeaser />

        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
