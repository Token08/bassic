import type { Metadata } from "next";
import { MenuContent, PageHero } from "@/components/content";
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
          eyebrow={pageHeroes.menu.eyebrow}
          title={pageHeroes.menu.title}
          lead={pageHeroes.menu.lead}
          image={pageHeroes.menu.image}
          imageAlt={pageHeroes.menu.imageAlt}
          className={pageHeroes.menu.className}
        />
        <MenuContent menu={contents.menu} />
      </main>
    </PageShell>
  );
}
