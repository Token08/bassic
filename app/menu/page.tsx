import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CustomSectionBlock, PageHero } from "@/components/content";
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
  const copy = contents.pageCopy.menu;
  const pageSections = contents.pageSections.menu;
  const sectionOrder = (key: string, fallback: number) => pageSections.find((section) => section.sectionKey === key)?.displayOrder ?? fallback;
  const visibleSections = new Set(pageSections.map((section) => section.sectionKey));
  const menuHero = resolveEditableImage(contents.heroSlides.menu[0]?.image, {
    src: pageHeroes.menu.image || "",
    alt: pageHeroes.menu.imageAlt || ""
  });
  const managedSectionItems: Array<{ key: string; order: number; node: ReactNode } | null> = [
    visibleSections.has("hero")
      ? {
          key: "hero",
          order: sectionOrder("hero", 1),
          node: (
            <PageHero
              eyebrow={copy.heroEyebrow || pageHeroes.menu.eyebrow}
              title={copy.heroTitle || pageHeroes.menu.title}
              lead={copy.heroLead || pageHeroes.menu.lead}
              image={menuHero.src}
              imageAlt={menuHero.alt}
              className={pageHeroes.menu.className}
            />
          )
        }
      : null,
    visibleSections.has("drinkSheets") || visibleSections.has("foodMenu")
      ? {
          key: "menuContent",
          order: Math.min(sectionOrder("drinkSheets", 2), sectionOrder("foodMenu", 3)),
          node: (
            <MenuContent
              menu={contents.menu}
              drinkSheets={contents.drinkMenuSheets}
              showDrinkSheets={visibleSections.has("drinkSheets")}
              showFoodMenu={visibleSections.has("foodMenu")}
              drinkLead={copy.drinkLead}
              foodLead={copy.foodLead}
            />
          )
        }
      : null,
    ...contents.customSections.menu.map((section) => ({
      key: `custom-${section.id || section.title}`,
      order: section.displayOrder ?? 9000,
      node: <CustomSectionBlock section={section} />
    }))
  ];
  const managedSections = managedSectionItems.filter((section): section is NonNullable<typeof section> => section !== null);

  return (
    <PageShell settings={contents.siteSettings}>
      <MenuJsonLd menu={contents.menu} settings={contents.siteSettings} />
      <main>
        {managedSections.sort((a, b) => a.order - b.order).map((section) => (
          <div className="managed-section" key={section.key}>
            {section.node}
          </div>
        ))}
      </main>
    </PageShell>
  );
}
