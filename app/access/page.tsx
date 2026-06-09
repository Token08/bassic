import type { Metadata } from "next";
import { AccessContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";

export const metadata: Metadata = {
  title: "アクセス | Google Map・天神駅からの行き方",
  description: "public bar Bassic.へのアクセス。福岡市中央区天神3-4-19 WITH天神5F、天神駅から徒歩約4分。"
};

export default async function AccessPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Access"
          title={
            <>
              天神駅から徒歩約4分。
              <br />
              WITH天神5Fへ。
            </>
          }
          lead="Google Map、住所、電話、メールをまとめました。初めての方も地図から迷わず来店できます。"
          image={assetPath("/assets/drive/index_back/bar-counter.jpg")}
          imageAlt="Bassic.のバーカウンター"
        />
        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
