import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { AccessContent, EventsTeaser, FirstVisitBlock, PageHero, heroImagePath } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";
import { site } from "@/lib/site";

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: site.name,
    alternateName: site.japaneseName,
    description: site.description,
    url: site.siteUrl,
    telephone: site.phone,
    email: site.email,
    priceRange: site.priceRange,
    image: `${site.siteUrl}/ogp.png`,
    hasMap: site.googleMapsUrl,
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
          title={
            <span className="home-hero-title">
              <span>初めてでも入りやすい、</span>
              <span>音楽と料理の夜。</span>
            </span>
          }
          lead={contents.home.heroLead}
          image={contents.home.heroImage?.url || heroImagePath}
          imageAlt={contents.home.heroImage?.alt || "public bar Bassic.のバーカウンター"}
        />

        <section className="section route-section">
          <div className="section-heading narrow-copy">
            <p className="eyebrow">Find What You Need</p>
            <h2>
              知りたいことへ、
              <br />
              すぐ進めるサイトにしました。
            </h2>
          </div>
          <div className="route-grid">
            <Link href="/first-visit">
              <span>初めての方へ</span>
              <strong>雰囲気・価格感・来店前の不安を確認</strong>
              <ArrowRight size={18} />
            </Link>
            <Link href="/events">
              <span>イベント</span>
              <strong>ライブ、DJ、予約方法を見る</strong>
              <ArrowRight size={18} />
            </Link>
            <Link href="/menu">
              <span>メニュー</span>
              <strong>料理とドリンクの写真・価格を見る</strong>
              <ArrowRight size={18} />
            </Link>
            <Link href="/access">
              <span>アクセス</span>
              <strong>Google Mapと駅からの行き方を見る</strong>
              <MapPin size={18} />
            </Link>
          </div>
        </section>

        <FirstVisitBlock lead={contents.home.firstVisitLead} />
        <EventsTeaser events={contents.events} />

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
