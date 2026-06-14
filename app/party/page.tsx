import type { Metadata } from "next";
import { PageHero, PartyContent } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { editableMedia, resolveHeroSlides } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("party");

export default async function PartyPage() {
  const contents = await getCmsContents();
  const partySlides = resolveHeroSlides(contents.heroSlides.party, editableMedia.partyHeroSlides);

  return (
    <PageShell settings={contents.siteSettings}>
      <main>
        <PageHero
          eyebrow={pageHeroes.party.eyebrow}
          title={pageHeroes.party.title}
          lead={pageHeroes.party.lead}
          slides={partySlides}
          className={pageHeroes.party.className}
        />
        <PartyContent plans={contents.partyPlans} equipmentRental={contents.equipmentRental} />
      </main>
    </PageShell>
  );
}
