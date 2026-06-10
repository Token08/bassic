import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { AccessContent, FirstVisitBlock, PageHero, heroImagePath, homeHeroSlides } from "@/components/content";
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

const socialLinks = [
  {
    label: "Instagram",
    handle: "@bassic_official",
    description: "イベント、おすすめフード、店内の雰囲気を写真で更新しています。",
    href: site.instagramUrl
  },
  {
    label: "X",
    handle: "@bar_Bassic",
    description: "ライブ、DJ、営業情報など直近のお知らせはこちらから。",
    href: site.xUrl
  },
  {
    label: "Facebook",
    handle: "bar.Bassic",
    description: "イベント情報やお店からのお知らせをまとめて確認できます。",
    href: site.facebookUrl
  },
  {
    label: "Online Store",
    handle: "bassic.official.ec",
    description: "Bassic.関連アイテムやオンライン販売はこちらから。",
    href: site.onlineStoreUrl
  }
];

function SocialUpdatesSection() {
  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Social Updates</p>
        <h2>
          最新情報は、
          <br />
          公式SNSから。
        </h2>
        <p className="section-lead">
          Instagram、X、Facebook、Online Storeへつながる導線をまとめました。イベントや営業情報はSNSでも確認できます。
        </p>
      </div>
      <div className="social-grid">
        {socialLinks.map((link) => (
          <a key={link.label} className="social-card" href={link.href} target="_blank" rel="noreferrer">
            <span className="social-label">{link.label}</span>
            <strong>{link.handle}</strong>
            <p>{link.description}</p>
            <span className="social-action">
              開く <ExternalLink size={16} />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
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
