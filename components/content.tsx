import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Mic2,
  Music2,
  Navigation,
  SlidersHorizontal,
  Store,
  Utensils,
  UsersRound
} from "lucide-react";
import { assetPath } from "@/lib/assets";
import { editableMedia } from "@/lib/editable-content";
import {
  accessRouteTips,
  equipmentRentalInfo,
  firstVisitSection,
  homeMenuTeaser,
  localSearchSection,
  partyUseCases,
  socialUpdatesCopy,
  visitInfoItems,
  type FeatureCardContent
} from "@/lib/page-content";
import { mailHref, site } from "@/lib/site";
import type { EventItem, MenuItem, PartyPlan, SocialNotice } from "@/lib/types";
import { MenuGallery } from "./menu-gallery";
import { PrimaryActions } from "./site-shell";
import { SocialUpdates } from "./social-updates";
import { VisitInfoGrid } from "./visit-info";

const heroImagePath = editableMedia.homeHeroImage.src;
const atmosphereImages = editableMedia.atmosphereImages;
const featureIcons = {
  music: Music2,
  store: Store,
  users: UsersRound
} as const;
const localSearchIcons = {
  map: MapPin,
  music: Mic2,
  food: Utensils,
  party: UsersRound
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
  className,
  highlights,
  actionLabels
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  image?: string;
  imageAlt?: string;
  slides?: readonly { src: string; alt: string }[];
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
        <Image className="hero-image" src={imageSrc(image)} alt={imageAlt} fill priority sizes="100vw" />
      )}
      <div className="hero-overlay" />
      <img className="hero-logo" src={assetPath("/assets/brand/index-logo.png")} alt="public bar Bassic." width={220} height={220} />
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
        <p className="eyebrow">{firstVisitSection.eyebrow}</p>
        <h2>{firstVisitSection.title}</h2>
      </div>
      <p className="section-lead narrow-copy">{lead}</p>
      <FeatureCardGrid features={firstVisitSection.features} />
    </section>
  );
}

export function VisitInfoCards() {
  return (
    <VisitInfoGrid
      ariaLabel="来店前の基本情報"
      title="初めての来店前に、知っておくと安心なこと。"
      lead="営業時間、チャージ、喫煙可否、イベント日の営業について、来店前に迷いやすい情報をまとめました。"
      items={visitInfoItems}
    />
  );
}

export function LocalSearchSection() {
  return (
    <section className="section local-search-section">
      <div className="section-heading">
        <p className="eyebrow">{localSearchSection.eyebrow}</p>
        <h2>{localSearchSection.title}</h2>
        <p className="section-lead">{localSearchSection.lead}</p>
      </div>
      <div className="local-search-grid">
        {localSearchSection.cards.map((card) => {
          const Icon = localSearchIcons[card.icon];

          return (
            <article key={card.title}>
              <Icon />
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          );
        })}
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

export function FeatureCardGrid({ features }: { features: readonly FeatureCardContent[] }) {
  return (
    <div className="feature-grid">
      {features.map((feature, index) => {
        const Icon = featureIcons[feature.icon];
        const photo = atmosphereImages[index % atmosphereImages.length];

        return (
          <article key={feature.title}>
            <Icon />
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
            <PairedFeaturePhoto photo={photo} />
          </article>
        );
      })}
    </div>
  );
}

export function SocialUpdatesSection({
  notices = [],
  instagramWidgetSrc
}: {
  notices?: SocialNotice[];
  instagramWidgetSrc?: string;
}) {
  return (
    <SocialUpdates
      title={
        <>
          {socialUpdatesCopy.titleLines[0]}
          <br />
          {socialUpdatesCopy.titleLines[1]}
        </>
      }
      lead={socialUpdatesCopy.lead}
      notices={notices}
      instagramWidgetSrc={instagramWidgetSrc}
    />
  );
}

export function HomeMenuTeaser() {
  return (
    <section className="section home-menu-teaser">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">{homeMenuTeaser.eyebrow}</p>
        <h2>
          {homeMenuTeaser.titleLines[0]}
          <br />
          {homeMenuTeaser.titleLines[1]}
        </h2>
        <p className="section-lead">{homeMenuTeaser.lead}</p>
        <Link className="text-link" href="/menu">
          {homeMenuTeaser.linkLabel} <ExternalLink size={16} />
        </Link>
      </div>
      <figure className="wide-photo">
        <Image src={editableMedia.foodTeaser.src} alt={editableMedia.foodTeaser.alt} fill sizes="100vw" />
      </figure>
    </section>
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
            src={editableMedia.eventPoster.src}
            alt={editableMedia.eventPoster.alt}
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

export function FeaturedEventsSection({ events }: { events: EventItem[] }) {
  const featuredEvents = events.slice(0, 3);

  if (!featuredEvents.length) return null;

  return (
    <section className="section featured-events-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Pickup</p>
        <h2>
          直近のイベントを、
          <br />
          先にチェック。
        </h2>
        <p className="section-lead">
          ライヴ、DJ、バータイムの予定から直近のものを表示しています。全体の予定は下のGoogle Calendarで確認できます。
        </p>
      </div>
      <div className="featured-event-grid">
        {featuredEvents.map((event) => (
          <article className="featured-event-card" key={event.id}>
            <div className="featured-event-date">{formatDate(event.date)}</div>
            <div className="featured-event-copy">
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EventsTeaser({ events }: { events: EventItem[] }) {
  return (
    <section className="section split">
      <div className="narrow-copy">
        <p className="eyebrow">Event Schedule</p>
        <h2>
          ライヴ・DJ・
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
  const image = item.image?.url ? imageSrc(item.image.url) : editableMedia.fallbackMenuImages[item.category];

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
          福岡・天神 親不孝通りのバーで、食事もドリンクも楽しみたい方へ。料理やドリンクの雰囲気が初めての方にも伝わるよう、画像と紹介文をセットで見られる形にしました。
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
  const visiblePlans = plans.filter((plan) => !/rental|レンタル/i.test(plan.title));

  return (
    <section className="section party-section">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Party & Rental</p>
        <h2>
          貸切、二次会、
          <br />
          ライヴ後の打ち上げにも。
        </h2>
      </div>
      <div className="plan-grid">
        {visiblePlans.map((plan) => (
          <article key={plan.title}>
            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.body}</p>
          </article>
        ))}
      </div>
      <article className="equipment-rental-card">
        <SlidersHorizontal />
        <div>
          <p className="eyebrow">{equipmentRentalInfo.eyebrow}</p>
          <h3>{equipmentRentalInfo.title}</h3>
          <strong>{equipmentRentalInfo.price}</strong>
          <p>{equipmentRentalInfo.body}</p>
          <a className="button equipment-rental-link" href="/assets/pdf/equipment-rental-list.pdf" target="_blank" rel="noreferrer">
            詳細はコチラ
          </a>
        </div>
      </article>
      <div className="use-case-panel" aria-label="貸切やパーティーの利用シーン">
        <div>
          <p className="eyebrow">Use Case</p>
          <h3>天神・親不孝通りで、音楽のある集まりに。</h3>
          <p>
            Bassic.は、バー営業だけでなく、貸切、二次会、ライヴ後の打ち上げ、DJイベント、レンタル利用まで相談できます。
            料理やドリンク、音響のある空間をまとめて検討したい方はメールでお問い合わせください。
          </p>
        </div>
        <ul>
          {partyUseCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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
            <br />
            <Link className="inline-access-link" href="/events">
              イベントスケジュールページを見る
            </Link>
          </dd>
          <dt>喫煙</dt>
          <dd>{site.smokingLabel}</dd>
        </dl>
        <div className="route-tips" aria-label="初来店向けの行き方案内">
          <h3>Google Mapから来店する方へ</h3>
          <ul>
            {accessRouteTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
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
