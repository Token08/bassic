import type { Metadata } from "next";
import { EventList, PageHero } from "@/components/content";
import { PageShell } from "@/components/site-shell";
import { assetPath } from "@/lib/assets";
import { getCmsContents } from "@/lib/microcms";
import { mailHref } from "@/lib/site";
import { ExternalLink } from "lucide-react";

const eventHeroSlides = [
  { src: assetPath("/assets/brand/event-slides/event-01.jpg"), alt: "Bassic.のライブイベント風景" },
  { src: assetPath("/assets/brand/event-slides/event-02.jpg"), alt: "Bassic.のステージと客席" },
  { src: assetPath("/assets/brand/event-slides/event-03.jpg"), alt: "Bassic.のライブフロア" },
  { src: assetPath("/assets/brand/event-slides/event-04.jpg"), alt: "Bassic.のイベント風景" },
  { src: assetPath("/assets/brand/event-slides/event-05.jpg"), alt: "Bassic.の音楽イベント" },
  { src: assetPath("/assets/brand/event-slides/event-06.jpg"), alt: "Bassic.のライブとDJの夜" }
];

export const metadata: Metadata = {
  title: "イベント | ライブ・DJ・予約情報",
  description: "public bar Bassic.のライブ、DJ、イベント予定、出演者、料金、予約方法を掲載しています。"
};

export default async function EventsPage() {
  const contents = await getCmsContents();

  return (
    <PageShell>
      <main>
        <PageHero
          eyebrow="Event Schedule"
          title="ライブ・DJ・イベント予定。"
          lead="日付、開場、開演、料金、予約方法をまとめています。イベント情報は管理画面から更新できます。"
          slides={eventHeroSlides}
          className="event-hero"
        />
        <section className="section split">
          <div className="narrow-copy">
            <p className="eyebrow">Reservation</p>
            <h2>
              気になるイベントは、
              <br />
              メールで予約できます。
            </h2>
            <p className="section-lead">
              予約時は、イベント日、枚数、氏名、電話番号をお送りください。詳細はイベントごとの案内をご確認ください。
            </p>
            <a className="text-link" href={mailHref("Bassic.イベント予約")}>
              イベント予約メールを送る <ExternalLink size={16} />
            </a>
          </div>
          <EventList events={contents.events} />
        </section>
      </main>
    </PageShell>
  );
}
