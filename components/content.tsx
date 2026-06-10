import Image from "next/image";
import Link from "next/link";
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
  { src: assetPath("/assets/brand/top-slides/hero-07.jpg"), alt: "Bassic.のステージと音楽のある夜" }
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
  className
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  image?: string;
  imageAlt?: string;
  slides?: { src: string; alt: string }[];
  className?: string;
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
        <PrimaryActions />
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
          初めてでも入りやすい、
          <br />
          音楽と料理の夜。
        </h2>
      </div>
      <p className="section-lead narrow-copy">{lead}</p>
      <div className="feature-grid">
        <article>
          <Music2 />
          <h3>音楽好きに開いたバー</h3>
          <p>ロック、ライブ、DJ、イベントの余韻まで楽しめる親不孝通りのミュージックバーです。</p>
        </article>
        <article>
          <Store />
          <h3>食事だけでも使いやすい</h3>
          <p>ファズ・カレーやタコスなど、飲む前にも飲んだ後にも頼みやすい料理があります。</p>
        </article>
        <article>
          <UsersRound />
          <h3>ひとりでもグループでも</h3>
          <p>ひとり来店、ライブ前後の待ち合わせ、貸切パーティーまで用途に合わせて使えます。</p>
        </article>
      </div>
      <PhotoStrip />
    </section>
  );
}

export function PhotoStrip() {
  return (
    <div className="photo-strip" aria-label="Bassic.の店内写真">
      {atmosphereImages.map((photo) => (
        <figure key={photo.src}>
          <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
        </figure>
      ))}
    </div>
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
          <dd>{site.hoursLabel}</dd>
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
