import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { AccessContent, FirstVisitBlock, PageHero, SocialUpdatesSection, heroImagePath, homeHeroSlides } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
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

  return (
    <PageShell>
      <JsonLd />
      <main id="top">
        <PageHero
          eyebrow={site.tagline}
          title="public bar Bassic."
          lead="パブリックバー・ベーシックは福岡・天神 親不孝通りのミュージックバー。初めてでも入りやすい音楽と料理のお店です"
          image={heroImagePath}
          imageAlt="public bar Bassic.の赤い天井と客席が見える店内"
          slides={homeHeroSlides}
          className="home-hero"
          highlights={[site.hoursLabel, site.smokingLabel, site.chargeLabel]}
        />

        <FirstVisitBlock lead={contents.home.firstVisitLead} tone="light" />
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
            <Image src={assetPath("/assets/drive/index_back/table-food.jpg")} alt="Bassic.の料理が並ぶテーブル" fill sizes="100vw" />
          </figure>
        </section>

        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
