import type { Metadata } from "next";
import { MenuContent, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";

export const metadata: Metadata = {
  title: "メニュー | 福岡 天神のミュージックバー",
  description: "public bar Bassic.のフード、ドリンク、人気メニューを写真と価格感で紹介します。"
};

export default async function MenuPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Food & Drink"
          title={
            <>
              Bassic.の料理と、
              <br />
              音楽に合うお酒。
            </>
          }
          lead="初めての方にも選びやすいよう、人気メニューと価格感を見やすく整理しました。"
          image="/assets/drive/index_back/table-food.jpg"
          imageAlt="Bassic.の料理とドリンク"
        />
        <MenuContent menu={contents.menu} />
      </main>
    </PageShell>
  );
}
