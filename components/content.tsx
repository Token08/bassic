import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { CalendarDays, ExternalLink, Music2, Navigation, Store, UsersRound } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { mailHref, site } from "@/lib/site";
import type { EventItem, MenuItem, PartyPlan } from "@/lib/types";
import { MenuGallery } from "./menu-gallery";
import { PrimaryActions } from "./site-shell";

export const heroImagePath = assetPath("/assets/brand/top-slides/hero-01.jpg");

export const homeHeroSlides = [
  { src: assetPath("/assets/brand/top-slides/hero-01.jpg"), alt: "public bar Bassic.の客席とバーカウンターが見える店内" },
  { src: assetPath("/assets/brand/top-slides/hero-02.jpg"), alt: "public bar Bassic.のバーカウンター" },
  { src: assetPath("/assets/brand/top-slides/hero-03.jpg"), alt: "Bassic.のボトルとグラス" },
  { src: assetPath("/assets/brand/top-slides/hero-04.jpg"), alt: "public bar Bassic.の入口へ続く通路" },
  { src: assetPath("/assets/brand/top-slides/hero-05.jpg"), alt: "ミラーボールの光" },
  { src: assetPath("/assets/brand/top-slides/hero-06.jpg"), alt: "DJターンテーブル" },
  { src: assetPath("/assets/brand/top-slides/hero-07.jpg"), alt: "Bassic.のステージと音楽のある夜" },
  { src: assetPath("/assets/brand/top-slides/hero-08.jpg"), alt: "Bassic.の店内風景" },
  { src: assetPath("/assets/brand/top-slides/hero-09.jpg"), alt: "Bassic.の夜の空間" },
  { src: assetPath("/assets/brand/top-slides/hero-10.jpg"), alt: "public bar Bassic.の店内写真" }
];

export const atmosphereImages = [
  { src: assetPath("/assets/drive/bassic/drums.jpg"), alt: "Bassic.のドラムセットがあるライブスペース" },
  { src: assetPath("/assets/drive/index_back/live-room.jpg"), alt: "赤い照明のBassic.店内" },
  { src: assetPath("/assets/drive/index_back/warm-interior.jpg"), alt: "温かい照明のBassic.店内" }
];

const fallbackMenuImages = {
  food: assetPath("/assets/drive/menu/fuzz-curry.jpg"),
  drink: assetPath("/assets/drive/menu/cocktails.jpg")
} as const;

const instagramPostUrl = "https://www.instagram.com/p/BTbP44JFyJt/";
const facebookPluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
  site.facebookUrl
)}&tabs=timeline&width=340&height=675&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&appId=542452342568830`;

function imageSrc(path: string) {
  return path.startsWith("/assets/") ? assetPath(path) : path;
}

export function PageHero({
  eyebrow,
  title,
  lead,
  image = heroImagePath,
  imageAlt = "public bar Bassic.の店内",
  slides,
  className,
  highlights,
  actionLabels
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  image?: string;
  imageAlt?: string;
  slides?: { src: string; alt: string }[];
  className?: string;
  highlights?: string[];
  actionLabels?: {
    mapLabel?: string;
    callLabel?: string;
    reserveLabel?: string;
  };
}) {
  return (
    <section className={`hero page-hero${className ? ` ${className}` : ""}`}>
      {slides?.length ? (
        <div className="hero-slideshow" aria-hidden="true">
          {slides.map((slide, index) => (
            <Image
              key={slide.src}
              className={`hero-slide hero-slide-${index + 1}`}
              src={slide.src}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
            />
          ))}
        </div>
      ) : (
        <Image className="hero-image" src={image} alt={imageAlt} fill priority sizes="100vw" />
      )}
      <div className="hero-overlay" />
      <img className="hero-logo" src={assetPath("/assets/brand/index-logo.png")} alt="public bar Bassic." width={800} height={800} />
      <div className="hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
        <PrimaryActions {...actionLabels} />
        {highlights?.length ? (
          <div className="quick-info" aria-label="来店前の基本情報">
            {highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function FirstVisitBlock({ lead, tone = "dark" }: { lead: string; tone?: "dark" | "light" }) {
  return (
    <section className={`section intro intro-${tone}`}>
      <div className="section-heading narrow-copy">
        <p className="eyebrow">First Visit</p>
        <h2>
          高い天井と柔らかな灯り。豊富なお酒と心地よい空間が、それぞれの夜をゆっくりと深めていく。
        </h2>
      </div>
      <p className="section-lead narrow-copy">{lead}</p>
      <div className="feature-grid">
        <article>
          <Music2 />
          <h3>天神の夜に、音楽という余白を。</h3>
          <p>ライヴ、DJ、イベントの余韻まで。当店イベント後は通常バータイムでそれぞれお楽しみいただけます。</p>
          <PairedFeaturePhoto photo={atmosphereImages[0]} />
        </article>
        <article>
          <Store />
          <h3>ノンアルコールでも、お食事だけでも。</h3>
          <p>当店名物のファズカレーやタコス＆ポテトなど、自家製のサングリアや珈琲焼酎も人気です。</p>
          <PairedFeaturePhoto photo={atmosphereImages[1]} />
        </article>
        <article>
          <UsersRound />
          <h3>お一人様でもグループでも。</h3>
          <p>お一人でふらっと来店、待ち合わせ、貸切パーティーまで用途に合わせてご利用いただけます。</p>
          <PairedFeaturePhoto photo={atmosphereImages[2]} />
        </article>
      </div>
    </section>
  );
}

function PairedFeaturePhoto({ photo }: { photo: (typeof atmosphereImages)[number] }) {
  return (
    <figure className="feature-photo">
      <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
    </figure>
  );
}

export function SocialUpdatesSection() {
  return (
    <section className="section social-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Social Updates</p>
        <h2>
          最新情報は、
          <br />
          公式SNSから。
        </h2>
        <p className="section-lead">
          Instagram、Facebook、Xの公式投稿をまとめて確認できます。イベント、営業情報、店内の空気感はSNSでも更新しています。
        </p>
      </div>
      <div className="social-embed-grid">
        <SocialEmbedCard label="Instagram" href={site.instagramUrl} account="@bassic_official">
          <div className="social-embed-frame instagram-frame">
            <blockquote
              className="instagram-media"
              data-instgrm-captioned
              data-instgrm-permalink={instagramPostUrl}
              data-instgrm-version="14"
            >
              <a href={instagramPostUrl} target="_blank" rel="noreferrer">
                Instagramで投稿を見る
              </a>
            </blockquote>
          </div>
        </SocialEmbedCard>

        <SocialEmbedCard label="Facebook" href={site.facebookUrl} account="bar.Bassic">
          <div className="social-embed-frame">
            <iframe
              title="public bar Bassic. Facebook timeline"
              src={facebookPluginUrl}
              width="340"
              height="675"
              loading="lazy"
              referrerPolicy="origin-when-cross-origin"
            />
          </div>
        </SocialEmbedCard>

        <SocialEmbedCard label="X" href={site.xUrl} account="@bar_Bassic">
          <div className="social-embed-frame">
            <a className="twitter-timeline" data-height="675" data-theme="dark" href="https://twitter.com/bar_Bassic?ref_src=twsrc%5Etfw">
              Tweets by bar_Bassic
            </a>
            <a className="social-fallback-link" href={site.xUrl} target="_blank" rel="noreferrer">
              Xで最新情報を見る <ExternalLink size={15} />
            </a>
          </div>
        </SocialEmbedCard>
      </div>
      <div className="social-direct-links">
        <a href={site.instagramUrl} target="_blank" rel="noreferrer">
          Instagram <ExternalLink size={15} />
        </a>
        <a href={site.xUrl} target="_blank" rel="noreferrer">
          X <ExternalLink size={15} />
        </a>
        <a href={site.facebookUrl} target="_blank" rel="noreferrer">
          Facebook <ExternalLink size={15} />
        </a>
      </div>
      <Script src="https://www.instagram.com/embed.js" strategy="lazyOnload" />
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
    </section>
  );
}

function SocialEmbedCard({
  label,
  href,
  account,
  children
}: {
  label: string;
  href: string;
  account: string;
  children: React.ReactNode;
}) {
  return (
    <article className="social-embed-card">
      <div className="social-embed-heading">
        <span>{label}</span>
        <a href={href} target="_blank" rel="noreferrer">
          {account} <ExternalLink size={15} />
        </a>
      </div>
      {children}
    </article>
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(value));
}

export function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="event-card">
      <div className="event-date">{formatDate(event.date)}</div>
      <div>
        <h3>{event.title}</h3>
        <dl className="event-meta">
          {event.openTime ? (
            <>
              <dt>OPEN</dt>
              <dd>{event.openTime}</dd>
            </>
          ) : null}
          {event.startTime ? (
            <>
              <dt>START</dt>
              <dd>{event.startTime}</dd>
            </>
          ) : null}
          {event.price ? (
            <>
              <dt>PRICE</dt>
              <dd>{event.price}</dd>
            </>
          ) : null}
        </dl>
        {event.performers ? <p>{event.performers}</p> : null}
        {event.reservation ? <p className="muted">{event.reservation}</p> : null}
      </div>
    </article>
  );
}

export function EventList({ events, includePoster = true }: { events: EventItem[]; includePoster?: boolean }) {
  return (
    <div className="event-list">
      {includePoster ? (
        <figure className="event-poster">
          <Image
            src={assetPath("/assets/drive/brf-2023.jpg")}
            alt="Bassic Rock Fesのイベントポスター"
            fill
            sizes="(max-width: 900px) 100vw, 42vw"
          />
        </figure>
      ) : null}
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

export function EventsTeaser({ events }: { events: EventItem[] }) {
  return (
    <section className="section split">
      <div className="narrow-copy">
        <p className="eyebrow">Event Schedule</p>
        <h2>
          ライブ・DJ・
          <br />
          イベント情報
        </h2>
        <p className="section-lead">
          最新イベントは管理画面から更新できます。日付、出演者、料金、予約方法を分かりやすく表示します。
        </p>
        <Link className="text-link" href="/events">
          イベントページを見る <ExternalLink size={16} />
        </Link>
      </div>
      <EventList events={events.slice(0, 2)} includePoster={false} />
    </section>
  );
}

function resolveMenuItem(item: MenuItem) {
  const image = item.image?.url ? imageSrc(item.image.url) : fallbackMenuImages[item.category];

  return {
    ...item,
    resolvedImage: image,
    imageAlt: item.image?.alt || `${item.name}の写真`
  };
}

export function MenuContent({ menu }: { menu: MenuItem[] }) {
  const foods = menu.filter((item) => item.category === "food").map(resolveMenuItem);
  const drinks = menu.filter((item) => item.category === "drink").map(resolveMenuItem);

  return (
    <section className="section menu-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Food & Drink</p>
        <h2>
          写真で選べる、
          <br />
          Bassic.のメニュー。
        </h2>
        <p className="section-lead">
          料理やドリンクの雰囲気が初めての方にも伝わるよう、画像と紹介文をセットで見られる形にしました。
        </p>
        <div className="notice-row" aria-label="メニュー利用時の基本情報">
          <span>{site.chargeLabel}</span>
          <span>{site.hoursLabel}</span>
        </div>
      </div>

      <div className="menu-block">
        <div className="menu-block-heading">
          <p className="eyebrow">Foods</p>
          <h2>料理</h2>
        </div>
        <MenuGallery items={foods} />
      </div>

      <div className="menu-block">
        <div className="menu-block-heading">
          <p className="eyebrow">Drinks</p>
          <h2>ドリンク</h2>
        </div>
        <MenuGallery items={drinks} />
      </div>
    </section>
  );
}

export function PartyContent({ plans }: { plans: PartyPlan[] }) {
  return (
    <section className="section party-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Party & Rental</p>
        <h2>
          貸切、二次会、
          <br />
          ライブ後の打ち上げにも。
        </h2>
      </div>
      <div className="plan-grid">
        {plans.map((plan) => (
          <article key={plan.title}>
            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AccessContent({ note }: { note: string }) {
  return (
    <section className="section access-section">
      <div className="access-copy narrow-copy">
        <p className="eyebrow">Access</p>
        <h2>
          天神駅から徒歩約4分。
          <br />
          Google Mapから迷わず来店。
        </h2>
        <p>{note}</p>
        <dl className="access-list">
          <dt>住所</dt>
          <dd>{site.address}</dd>
          <dt>電話</dt>
          <dd>{site.phone}</dd>
          <dt>メール</dt>
          <dd>{site.email}</dd>
          <dt>営業時間</dt>
          <dd>
            {site.hoursLabel}
            <br />
            {site.eventHoursNote}
          </dd>
          <dt>喫煙</dt>
          <dd>{site.smokingLabel}</dd>
        </dl>
        <div className="hero-actions">
          <a className="button primary" href={site.directionsUrl} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            現在地から向かう
          </a>
          <a className="button" href={mailHref("Bassic.予約問い合わせ")}>
            <CalendarDays size={18} />
            予約する
          </a>
        </div>
      </div>
      <iframe
        title="public bar Bassic. Google Map"
        className="map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F&output=embed"
      />
    </section>
  );
}
