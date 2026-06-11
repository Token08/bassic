import type { Metadata } from "next";
import { AccessContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata("access");

export default async function AccessPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Access"
          title="天神駅から徒歩約4分。WITH天神5Fへ。"
          lead="Google Map、住所、電話、メールをまとめました。初めての方も地図から迷わず来店できます。"
          image={assetPath("/assets/drive/index_back/bar-counter.jpg")}
          imageAlt="Bassic.のバーカウンター"
        />
        <AccessContent note={contents.home.accessNote} />
      </main>
    </PageShell>
  );
}
