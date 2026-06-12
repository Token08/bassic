import type { Metadata } from "next";
import { PageHero, PartyContent } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("party");

export default async function PartyPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow={pageHeroes.party.eyebrow}
          title={pageHeroes.party.title}
          lead={pageHeroes.party.lead}
          slides={pageHeroes.party.slides}
          className={pageHeroes.party.className}
        />
        <PartyContent plans={contents.partyPlans} />
      </main>
    </PageShell>
  );
}
