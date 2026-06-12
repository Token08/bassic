import type { Metadata } from "next";
import { FirstVisitBlock, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { getCmsContents } from "@/lib/microcms";
import { pageHeroes } from "@/lib/page-content";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = buildMetadata("firstVisit");

const faqs = [
  {
    question: "ひとりでも大丈夫？",
    answer: "大丈夫です。カウンターで音楽やイベントの話をしながら、気軽に過ごせます。"
  },
  {
    question: "予約は必要？",
    answer: "通常営業は予約なしでも利用できます。ライブや貸切日は、事前確認がおすすめです。"
  },
  {
    question: "どんな使い方が多い？",
    answer: "ライブ前後の一杯、食事、DJイベント、二次会、貸切パーティーなど幅広く使えます。"
  },
  {
    question: "喫煙はできますか？",
    answer: "店内は紙タバコ・電子タバコともに喫煙OKです。"
  },
  {
    question: "天神駅から近いですか？",
    answer: "天神駅から徒歩約4分、親不孝通りのWITH天神5Fにあります。Google Mapから現在地ルートを開けます。"
  }
];

function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/first-visit/"),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${faq.answer} ${site.hoursLabel}。${site.chargeLabel}。${site.smokingLabel}。`
      }
    }))
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function FirstVisitPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <FaqJsonLd />
      <main>
        <PageHero
          eyebrow={pageHeroes.firstVisit.eyebrow}
          title={pageHeroes.firstVisit.title}
          lead={pageHeroes.firstVisit.lead}
          image={pageHeroes.firstVisit.image}
          imageAlt={pageHeroes.firstVisit.imageAlt}
        />
        <FirstVisitBlock lead={contents.home.firstVisitLead} tone="light" />
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
            {faqs.map((faq) => (
              <article key={faq.question}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
