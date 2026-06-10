import type { Metadata } from "next";
import { PageHero, PartyContent } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";

const partyHeroSlides = [
  { src: assetPath("/assets/brand/party-slides/party-01.jpg"), alt: "Bassic.のライブイベント風景" },
  { src: assetPath("/assets/brand/party-slides/party-02.jpg"), alt: "Bassic.のステージと客席" },
  { src: assetPath("/assets/brand/party-slides/party-06.jpg"), alt: "Bassic.のライブフロア" },
  { src: assetPath("/assets/brand/party-slides/party-03.jpg"), alt: "Bassic.のライブ写真" },
  { src: assetPath("/assets/brand/party-slides/party-04.jpg"), alt: "Bassic.のイベント写真" },
  { src: assetPath("/assets/brand/party-slides/party-05.jpg"), alt: "Bassic.の音楽イベント写真" }
];

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
          slides={partyHeroSlides}
          className="party-hero"
        />
        <PartyContent plans={contents.partyPlans} />
      </main>
    </PageShell>
  );
}
