import { mobileCrop, type MobileCropPosition } from "@/lib/responsive-media";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
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
import { mailHref, site, telHref } from "@/lib/site";
import type { CmsImage, CustomSection, EquipmentRental, EventItem, HomeContent, MenuItem, PartyPlan, SiteSettings, SocialNotice } from "@/lib/types";
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
  return assetPath(path);
}

export function PageHero({
  eyebrow,
  title,
  mobileTitle,
  lead,
  image = heroImagePath,
  imageAlt = "public bar Bassic.の店内",
  slides,
  className,
  highlights,
  actionLabels,
  logo,
  settings
}: {
  eyebrow: string;
  title: React.ReactNode;
  mobileTitle?: string;
  lead: string;
  image?: string;
  imageAlt?: string;
  slides?: readonly { src: string; alt: string; mobileSrc?: string; mobilePosition?: MobileCropPosition }[];
  className?: string;
  highlights?: string[];
  logo?: CmsImage;
  settings?: SiteSettings;
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
            <picture key={slide.src + index}>
              {slide.mobileSrc ? <source media="(max-width: 900px)" srcSet={slide.mobileSrc} /> : null}
            <Image
              className={`hero-slide hero-slide-${index + 1}`}
              data-mobile-position={slide.mobilePosition}
              src={slide.src}
              alt=""
              fill
              priority={index === 0 && !slide.mobileSrc}
              loading={index === 0 && slide.mobileSrc ? "eager" : undefined}
              sizes="100vw"
            />
            </picture>
          ))}
        </div>
      ) : (
        <Image className="hero-image" src={imageSrc(image)} alt={imageAlt} fill priority sizes="100vw" />
      )}
      <div className="hero-overlay" />
      <img className="hero-logo" src={assetPath(logo?.url || "/assets/brand/index-logo.png")} alt={logo?.alt || "public bar Bassic."} width={220} height={220} />
      <div className="hero-content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{mobileTitle ? <>
          <span className="hero-title-desktop">{title}</span>
          <span className="hero-title-mobile">{mobileTitle}</span>
        </> : title}</h1>
        <p className="lead">{lead}</p>
        <PrimaryActions {...actionLabels} settings={settings} />
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

export function FirstVisitBlock({ lead, tone = "dark", home }: { lead: string; tone?: "dark" | "light"; home?: HomeContent }) {
  const features = firstVisitSection.features.map((feature, index) => {
    const card = (index + 1) as 1 | 2 | 3;
    return {
      ...feature,
      title: home?.[`firstVisitCard${card}Title`]?.trim() || feature.title,
      text: home?.[`firstVisitCard${card}Text`]?.trim() || feature.text,
      image: home?.[`firstVisitCard${card}Image`],
      mobilePosition: mobileCrop(home?.[`firstVisitCard${card}MobilePosition`])
    };
  });
  return (
    <section className={`section intro intro-${tone}`}>
      <div className="section-heading narrow-copy">
        <p className="eyebrow">{home?.firstVisitEyebrow?.trim() || firstVisitSection.eyebrow}</p>
        <h2>{home?.firstVisitTitle?.trim() || firstVisitSection.title}</h2>
      </div>
      <p className="section-lead narrow-copy">{lead}</p>
      <FeatureCardGrid features={features} />
    </section>
  );
}

export function VisitInfoCards({ settings, title, lead, home }: { settings?: SiteSettings; title?: string; lead?: string; home?: HomeContent }) {
  const items = settings
    ? visitInfoItems.map((item) => {
        if (item.icon === "clock") return { ...item, text: settings.hoursLabel };
        if (item.icon === "calendar") return { ...item, text: settings.eventHoursNote || item.text };
        if (item.icon === "smoking") return { ...item, text: settings.smokingLabel };
        if (item.icon === "charge") return { ...item, text: settings.chargeLabel };
        return item;
      })
    : visitInfoItems;

  return (
    <VisitInfoGrid
      ariaLabel="来店前の基本情報"
      title={title?.trim() || "初めての来店前に、知っておくと安心なこと。"}
      lead={lead?.trim() || "営業時間、テーブル・チャージ、喫煙可否、イベント日の営業について、来店前に迷いやすい情報をまとめました。"}
      items={items.map((item, index) => {
        const position = (index + 1) as 1 | 2 | 3 | 4;
        return { ...item, title: home?.[`visitInfoCard${position}Title`]?.trim() || item.title, text: home?.[`visitInfoCard${position}Text`]?.trim() || item.text };
      })}
    />
  );
}

export function LocalSearchSection({ home }: { home?: HomeContent }) {
  return (
    <section className="section local-search-section">
      <div className="section-heading">
        <p className="eyebrow">{home?.localSearchEyebrow?.trim() || localSearchSection.eyebrow}</p>
        <h2>{home?.localSearchTitle?.trim() || localSearchSection.title}</h2>
        <p className="section-lead">{home?.localSearchLead?.trim() || localSearchSection.lead}</p>
      </div>
      <div className="local-search-grid">
        {localSearchSection.cards.map((card, index) => {
          const Icon = localSearchIcons[card.icon];
          const position = (index + 1) as 1 | 2 | 3 | 4;

          return (
            <article key={card.title}>
              <Icon />
              <h3>{home?.[`localSearchCard${position}Title`]?.trim() || card.title}</h3>
              <p>{home?.[`localSearchCard${position}Text`]?.trim() || card.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PairedFeaturePhoto({ photo, mobilePosition }: { photo: (typeof atmosphereImages)[number]; mobilePosition?: MobileCropPosition }) {
  return (
    <figure className="feature-photo">
      <Image src={photo.src} alt={photo.alt} data-mobile-position={mobilePosition} fill sizes="(max-width: 900px) 100vw, 33vw" />
    </figure>
  );
}

export function FeatureCardGrid({ features }: { features: readonly (FeatureCardContent & { image?: CmsImage; mobilePosition?: MobileCropPosition })[] }) {
  return (
    <div className="feature-grid">
      {features.map((feature, index) => {
        const Icon = featureIcons[feature.icon];
        const defaultPhoto = atmosphereImages[index % atmosphereImages.length];
        const url = feature.image?.url?.trim();
        const photo = url && (url.startsWith("https://") || url.startsWith("/assets/"))
          ? { src: imageSrc(url), alt: feature.image?.alt?.trim() || feature.title }
          : defaultPhoto;

        return (
          <article key={index}>
            <Icon />
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
            <PairedFeaturePhoto photo={photo} mobilePosition={feature.mobilePosition} />
          </article>
        );
      })}
    </div>
  );
}

export function SocialUpdatesSection({
  notices = [],
  instagramWidgetSrc,
  settings,
  home,
  titleLine1 = socialUpdatesCopy.titleLines[0],
  titleLine2 = socialUpdatesCopy.titleLines[1],
  lead = socialUpdatesCopy.lead
}: {
  notices?: SocialNotice[];
  instagramWidgetSrc?: string;
  settings?: SiteSettings;
  home?: HomeContent;
  titleLine1?: string;
  titleLine2?: string;
  lead?: string;
}) {
  return (
    <SocialUpdates
      title={
        <>
          {titleLine1}
          <br />
          {titleLine2}
        </>
      }
      lead={lead}
      notices={notices}
      instagramWidgetSrc={instagramWidgetSrc}
      home={home}
      settings={settings}
    />
  );
}

export function CustomSectionBlock({ section }: { section: CustomSection }) {
  const hasImage = Boolean(section.image?.url);
  const hasLink = Boolean(section.linkLabel && section.linkUrl);

  return (
    <section className={`section custom-section${hasImage ? " has-image" : ""}`}>
      <div className="custom-section-inner">
        {hasImage ? (
          <figure className="custom-section-image">
            <Image src={assetPath(section.image!.url)} alt={section.image?.alt || section.title} fill sizes="(max-width: 900px) 100vw, 42vw" />
          </figure>
        ) : null}
        <div className="section-heading narrow-copy">
          <p className="eyebrow">{section.eyebrow?.trim() || "Information"}</p>
          <h2>{section.title}</h2>
          <p className="section-lead">{section.body}</p>
          {hasLink ? (
            <a className="text-link" href={section.linkUrl} target={section.linkUrl?.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {section.linkLabel} <ExternalLink size={16} />
            </a>
          ) : null}
        </div>
      </div>
    </section>
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
      {event.image?.url ? (
        <a className="event-card-image" href={event.sourceUrl || "/events"} target={event.sourceUrl ? "_blank" : undefined} rel="noreferrer">
          <img src={imageSrc(event.image.url)} alt={event.image.alt || event.title} loading="lazy" />
        </a>
      ) : null}
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
        {event.sourceUrl ? (
          <a className="text-link event-source-link" href={event.sourceUrl} target="_blank" rel="noreferrer">
            イベントの詳細を見る <ExternalLink size={15} />
          </a>
        ) : null}
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

export function PartyContent({
  plans,
  equipmentRental,
  showPlans = true,
  showEquipmentRental = true,
  showUseCases = true,
  partyLead,
  rentalLead
}: {
  plans: PartyPlan[];
  equipmentRental?: EquipmentRental;
  showPlans?: boolean;
  showEquipmentRental?: boolean;
  showUseCases?: boolean;
  partyLead?: string;
  rentalLead?: string;
}) {
  const rental = equipmentRental || {
    title: equipmentRentalInfo.title,
    price: equipmentRentalInfo.price,
    body: equipmentRentalInfo.body,
    pdfUrl: "/assets/pdf/equipment-rental-list.pdf"
  };
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
      {partyLead ? <p className="section-lead narrow-copy">{partyLead}</p> : null}
      {showPlans ? (
      <div className="plan-grid">
        {visiblePlans.map((plan) => (
          <article key={plan.title}>
            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.body}</p>
          </article>
        ))}
      </div>
      ) : null}
      {showEquipmentRental ? (
      <article className="equipment-rental-card">
        <SlidersHorizontal />
        <div>
          <p className="eyebrow">{equipmentRentalInfo.eyebrow}</p>
          <h3>{rental.title}</h3>
          {rental.price ? <strong>{rental.price}</strong> : null}
          <p>{rentalLead || rental.body}</p>
          <a className="button equipment-rental-link" href={assetPath(rental.pdfUrl || "/assets/pdf/equipment-rental-list.pdf")} target="_blank" rel="noreferrer">
            詳細はコチラ
          </a>
        </div>
      </article>
      ) : null}
      {showUseCases ? (
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
      ) : null}
    </section>
  );
}

export function AccessContent({
  note,
  heading,
  home,
  routeTips = accessRouteTips,
  settings,
  showInfo = true,
  showMap = true
}: {
  note: string;
  heading?: string;
  home?: HomeContent;
  routeTips?: readonly string[];
  settings?: SiteSettings;
  showInfo?: boolean;
  showMap?: boolean;
}) {
  const accessSettings = settings || site;
  const mapQuery = encodeURIComponent(`public bar Bassic. ${accessSettings.address}`);
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=16&hl=ja&output=embed`;

  return (
    <section className="section access-section">
      {showInfo ? (
      <div className="access-copy narrow-copy">
        <p className="eyebrow">{home?.homeAccessEyebrow?.trim() || "Access"}</p>
        <h2>
          {heading?.trim() || <>天神駅から徒歩約4分。<br />Google Mapから迷わず来店。</>}
        </h2>
        <p>{note}</p>
        <dl className="access-list">
          <dt>{home?.homeAccessAddressLabel?.trim() || "住所"}</dt>
          <dd>{accessSettings.address}</dd>
          <dt>{home?.homeAccessPhoneLabel?.trim() || "電話"}</dt>
          <dd>{accessSettings.phone}</dd>
          <dt>{home?.homeAccessEmailLabel?.trim() || "メール"}</dt>
          <dd>{accessSettings.email || site.email}</dd>
          <dt>{home?.homeAccessHoursLabel?.trim() || "営業時間"}</dt>
          <dd>
            {accessSettings.hoursLabel}
            <br />
            {accessSettings.eventHoursNote || site.eventHoursNote}
            <br />
            <Link className="inline-access-link" href="/events">
              {home?.homeAccessEventsLabel?.trim() || "イベントスケジュールページを見る"}
            </Link>
          </dd>
          <dt>{home?.homeAccessSmokingLabel?.trim() || "喫煙"}</dt>
          <dd>{accessSettings.smokingLabel}</dd>
        </dl>
        <div className="route-tips" aria-label="初来店向けの行き方案内">
          <h3>{home?.homeAccessDirectionsTitle?.trim() || "Google Mapから来店する方へ"}</h3>
          <ul>
            {routeTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
        <div className="hero-actions">
          <a className="button primary" href={accessSettings.directionsUrl || accessSettings.googleMapsUrl} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            {home?.homeAccessDirectionsLabel?.trim() || "現在地から向かう"}
          </a>
          <a className="button" href={telHref(accessSettings.phone)}>
            <Phone size={18} />
            電話する
          </a>
        </div>
      </div>
      ) : null}
      {showMap ? (
      <iframe
        title="public bar Bassic. Google Map"
        className="map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSrc}
      />
      ) : null}
    </section>
  );
}
