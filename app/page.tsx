import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AccessContent, FirstVisitBlock, PageHero, SocialUpdatesSection, VisitInfoCards } from "@/components/content";
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
        <SocialUpdatesSection />

        <section className="section home-menu-teaser">
          <div className="section-heading narrow-copy">
            <p className="eyebrow">Food & Drink</p>
            <h2>
              料理もドリンクも、
              <br />
              写真で先に見られます。
            </h2>
            <p className="section-lead">ファズ・カレー、タコス、カクテルなど。詳しい一覧はメニューページへ。</p>
            <Link className="text-link" href="/menu">
              メニューページを見る <ArrowRight size={16} />
            </Link>
          </div>
          <figure className="wide-photo">
            <Image src={editableMedia.foodTeaser.src} alt={editableMedia.foodTeaser.alt} fill sizes="100vw" />
          </figure>
        </section>

        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
