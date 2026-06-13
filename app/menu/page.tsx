import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import { MenuContent } from "@/components/menu-content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import type { MenuItem } from "@/lib/types";

export const metadata: Metadata = buildMetadata("menu");

function MenuJsonLd({ menu }: { menu: MenuItem[] }) {
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
    itemListElement: menu.slice(0, 20).map((item) => {
      const price = item.price?.replace(/[^\d]/g, "");

      return {
        "@type": "Offer",
        ...(price ? { price, priceCurrency: "JPY" } : {}),
        itemOffered: {
          "@type": "MenuItem",
          name: item.name,
          ...(item.description ? { description: item.description } : {})
        }
      };
    })
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function MenuPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <MenuJsonLd menu={contents.menu} />
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
