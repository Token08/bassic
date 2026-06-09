import type { Metadata } from "next";
import { FirstVisitBlock, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";

export const metadata: Metadata = {
  title: "初めての方へ | 福岡 天神 親不孝通りのバー",
  description: "public bar Bassic.に初めて来る方へ。雰囲気、価格感、ひとり来店、予約、アクセスを分かりやすく案内します。"
};

export default async function FirstVisitPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="First Visit"
          title={
            <>
              初めてでも、
              <br />
              入りやすい音楽バー。
            </>
          }
          lead="ひとりでも、ライブ前後でも、音楽の話をしたい夜でも。来店前に知りたいことをまとめました。"
          image="/assets/drive/index_back/warm-interior.jpg"
          imageAlt="温かい照明のBassic.店内"
        />
        <FirstVisitBlock lead={contents.home.firstVisitLead} />
        <section className="section faq-section">
          <div className="section-heading narrow-copy">
            <p className="eyebrow">Before You Come</p>
            <h2>
              来る前に分かると、
              <br />
              安心なこと。
            </h2>
          </div>
          <div className="faq-grid">
            <article>
              <h3>ひとりでも大丈夫？</h3>
              <p>大丈夫です。カウンターで音楽やイベントの話をしながら、気軽に過ごせます。</p>
            </article>
            <article>
              <h3>予約は必要？</h3>
              <p>通常営業は予約なしでも利用できます。ライブや貸切日は、事前確認がおすすめです。</p>
            </article>
            <article>
              <h3>どんな使い方が多い？</h3>
              <p>ライブ前後の一杯、食事、DJイベント、二次会、貸切パーティーなど幅広く使えます。</p>
            </article>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
