import type { Metadata } from "next";
import { PageHero, PartyContent } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";

export const metadata: Metadata = {
  title: "貸切・パーティー | 天神の二次会・打ち上げ",
  description: "public bar Bassic.の貸切、パーティープラン、ライブ後の打ち上げ、レンタル利用について紹介します。"
};

export default async function PartyPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Party & Rental"
          title={
            <>
              貸切、二次会、
              <br />
              ライブ後の打ち上げに。
            </>
          }
          lead="親不孝通りで、音楽と料理を楽しめるパーティーやレンタル利用に対応しています。"
          image="/assets/drive/index_back/live-room.jpg"
          imageAlt="赤い照明のBassic.店内"
        />
        <PartyContent plans={contents.partyPlans} />
      </main>
    </PageShell>
  );
}
