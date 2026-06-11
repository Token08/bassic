import type { Metadata } from "next";
import { MenuContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = buildMetadata("menu");

function MenuJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "public bar Bassic. Food & Drink",
    url: absoluteUrl("/menu/"),
    description: `${site.chargeLabel}。ファズカレー、タコス、ドリンクなどを提供しています。`,
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "MenuItem", name: "ファズ・カレー" } },
      { "@type": "Offer", itemOffered: { "@type": "MenuItem", name: "タコス＆ポテト" } },
      { "@type": "Offer", itemOffered: { "@type": "MenuItem", name: "自家製サングリア" } }
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
          eyebrow="Food & Drink"
          title="Bassic.の料理と、音楽に合うお酒。"
          lead="初めての方にも選びやすいよう、人気メニューと価格感を見やすく整理しました。"
          image={assetPath("/assets/drive/index_back/table-food.jpg")}
          imageAlt="Bassic.の料理とドリンク"
        />
        <MenuContent menu={contents.menu} />
      </main>
    </PageShell>
  );
}
