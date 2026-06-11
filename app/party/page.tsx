import type { Metadata } from "next";
import { PageHero, PartyContent } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { editableMedia } from "@/lib/editable-content";
import { getCmsContents } from "@/lib/microcms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("party");

export default async function PartyPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Party & Rental"
          title="貸切、二次会、ライブ後の打ち上げに。"
          lead="親不孝通りで、音楽と料理を楽しめるパーティーやレンタル利用に対応しています。"
          slides={editableMedia.partyHeroSlides}
          className="party-hero"
        />
        <PartyContent plans={contents.partyPlans} />
      </main>
    </PageShell>
  );
}
