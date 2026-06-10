import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import Script from "next/script";
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

const instagramPostUrl = "https://www.instagram.com/p/BTbP44JFyJt/";
const facebookPluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
  site.facebookUrl
)}&tabs=timeline&width=340&height=675&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId=542452342568830`;

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
          Instagram、Facebook、Xの公式投稿をまとめて確認できます。イベント、営業情報、店内の空気感はSNSでも更新しています。
        </p>
      </div>
      <div className="social-embed-grid">
        <article className="social-embed-card">
          <div className="social-embed-heading">
            <span>Instagram</span>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer">
              @bassic_official <ExternalLink size={15} />
            </a>
          </div>
          <div className="social-embed-frame instagram-frame">
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink={instagramPostUrl}
              data-instgrm-version="14"
            >
              <a href={instagramPostUrl} target="_blank" rel="noreferrer">
                Instagramで投稿を見る
              </a>
            </blockquote>
          </div>
        </article>

        <article className="social-embed-card">
          <div className="social-embed-heading">
            <span>Facebook</span>
            <a href={site.facebookUrl} target="_blank" rel="noreferrer">
              bar.Bassic <ExternalLink size={15} />
            </a>
          </div>
          <div className="social-embed-frame">
            <iframe
              title="public bar Bassic. Facebook timeline"
              src={facebookPluginUrl}
              width="340"
              height="675"
              loading="lazy"
              referrerPolicy="origin-when-cross-origin"
            />
          </div>
        </article>

        <article className="social-embed-card">
          <div className="social-embed-heading">
            <span>X</span>
            <a href={site.xUrl} target="_blank" rel="noreferrer">
              @bar_Bassic <ExternalLink size={15} />
            </a>
          </div>
          <div className="social-embed-frame">
            <a className="twitter-timeline" data-height="675" data-theme="dark" href="https://twitter.com/bar_Bassic?ref_src=twsrc%5Etfw">
              Tweets by bar_Bassic
            </a>
            <a className="social-fallback-link" href={site.xUrl} target="_blank" rel="noreferrer">
              Xで最新情報を見る <ExternalLink size={15} />
            </a>
          </div>
        </article>
      </div>
      <div className="social-direct-links">
        <a href={site.instagramUrl} target="_blank" rel="noreferrer">
          Instagram <ExternalLink size={15} />
        </a>
        <a href={site.xUrl} target="_blank" rel="noreferrer">
          X <ExternalLink size={15} />
        </a>
        <a href={site.facebookUrl} target="_blank" rel="noreferrer">
          Facebook <ExternalLink size={15} />
        </a>
      </div>
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
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
