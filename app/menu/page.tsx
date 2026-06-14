import type { Metadata } from "next";
import { PageHero } from "@/components/content";
import { MenuContent } from "@/components/menu-content";
import { PageShell } from "@/components/site-shell";
import { resolveEditableImage } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";
import type { MenuItem, SiteSettings } from "@/lib/types";

export const metadata: Metadata = buildMetadata("menu");

function MenuJsonLd({ menu, settings }: { menu: MenuItem[]; settings: SiteSettings }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "public bar Bassic. Food & Drink",
    url: absoluteUrl("/menu/"),
    description: `${site.chargeLabel}。福岡・天神 親不孝通りのミュージックバーで、ファズ・カレー、タコス＆ポテト、ドリンク各種を提供しています。`,
    provider: {
      "@type": "BarOrPub",
      name: site.name,
      address: settings.address,
      telephone: settings.phone
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
  const menuHero = resolveEditableImage(contents.heroSlides.menu[0]?.image, {
    src: pageHeroes.menu.image || "",
    alt: pageHeroes.menu.imageAlt || ""
  });

  return (
    <PageShell settings={contents.siteSettings}>
      <MenuJsonLd menu={contents.menu} settings={contents.siteSettings} />
      <main>
        <PageHero
          eyebrow={pageHeroes.menu.eyebrow}
          title={pageHeroes.menu.title}
          lead={pageHeroes.menu.lead}
          image={menuHero.src}
          imageAlt={menuHero.alt}
          className={pageHeroes.menu.className}
        />
        <MenuContent menu={contents.menu} drinkSheets={contents.drinkMenuSheets} />
      </main>
    </PageShell>
  );
}
