import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import { MenuContent } from "@/components/menu-content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = buildMetadata("menu");

function MenuJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "public bar Bassic. Food & Drink",
    url: absoluteUrl("/menu/"),
    description: `${site.chargeLabel}。福岡・天神 親不孝通りのミュージックバーで、ファズ・カレー、タコス＆ポテト、ドリンク各種を提供しています。`,
    provider: {
      "@type": "BarOrPub",
      name: site.name,
      address: site.address,
      telephone: site.phone
    },
    itemListElement: [
      { "@type": "Offer", price: "1200", priceCurrency: "JPY", itemOffered: { "@type": "MenuItem", name: "ファズ・カレー" } },
      { "@type": "Offer", price: "900", priceCurrency: "JPY", itemOffered: { "@type": "MenuItem", name: "タコス＆ポテト" } },
      { "@type": "Offer", price: "900", priceCurrency: "JPY", itemOffered: { "@type": "MenuItem", name: "チョリソーコンパパス" } },
      { "@type": "Offer", price: "500", priceCurrency: "JPY", itemOffered: { "@type": "MenuItem", name: "ナチョス" } }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function MenuPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <MenuJsonLd />
      <main>
        <PageHero
          eyebrow={pageHeroes.menu.eyebrow}
          title="Bassic.の料理と、音楽に合うお酒。"
          lead="初めての方にも選びやすいよう、フードとドリンクを写真と価格で見やすく整理しました。"
          image="/assets/menu-refresh/menu-hero.jpg"
          imageAlt="Bassic.の料理とドリンク"
          className={pageHeroes.menu.className}
        />
        <MenuContent menu={contents.menu} />
      </main>
    </PageShell>
  );
}
