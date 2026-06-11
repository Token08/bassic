import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Mail, MapPin, Phone } from "lucide-react";
import { PageHero, heroImagePath, homeHeroSlides } from "@/components/content";
import { assetPath } from "@/lib/assets";
import { type LocaleCode, type LocalizedPageKey, localizedLabels, localizedPages } from "@/lib/i18n";
import { mailHref, site, telHref } from "@/lib/site";

const pageImages: Record<LocalizedPageKey, string> = {
  home: heroImagePath,
  events: assetPath("/assets/brand/event-slides/event-01.jpg"),
  menu: assetPath("/assets/drive/index_back/table-food.jpg"),
  party: assetPath("/assets/brand/party-slides/party-01.jpg"),
  access: assetPath("/assets/drive/index_back/bar-counter.jpg")
};

function LocalizedActions({ labels }: { labels: (typeof localizedLabels)[LocaleCode] }) {
  return (
    <div className="hero-actions">
      <a className="button primary" href={site.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        {labels.map}
      </a>
      <a className="button" href={telHref()}>
        <Phone size={18} />
        {labels.call}
      </a>
      <a className="button" href={mailHref("Bassic. reservation")}>
        <Mail size={18} />
        {labels.reserve}
      </a>
    </div>
  );
}

function InfoGrid({ labels }: { labels: (typeof localizedLabels)[LocaleCode] }) {
  return (
    <div className="localized-info-grid">
      {[labels.hours, labels.eventHours, labels.charge, labels.smoking].map((text) => (
        <article key={text}>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}

export function LocalizedPage({ locale, pageKey }: { locale: LocaleCode; pageKey: LocalizedPageKey }) {
  const page = localizedPages[locale][pageKey];
  const labels = localizedLabels[locale];
  const isHome = pageKey === "home";

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        image={pageImages[pageKey]}
        imageAlt={page.title}
        slides={isHome ? homeHeroSlides : undefined}
        className={isHome ? "home-hero" : undefined}
        highlights={[labels.hours, labels.charge, labels.smoking]}
        actionLabels={{
          mapLabel: labels.map,
          callLabel: labels.call,
          reserveLabel: labels.reserve
        }}
      />
      <section className="section intro intro-light localized-section">
        <div className="section-heading narrow-copy">
          <p className="eyebrow">{labels.language}</p>
          <h2>{page.title}</h2>
          <p className="section-lead">{page.lead}</p>
        </div>
        <InfoGrid labels={labels} />
        <LocalizedActions labels={labels} />
      </section>
      {pageKey === "menu" ? (
        <section className="section home-menu-teaser">
          <div className="section-heading narrow-copy">
            <p className="eyebrow">Food & Drink</p>
            <h2>Fuzz Curry, tacos, drinks.</h2>
            <p className="section-lead">{labels.charge}</p>
          </div>
          <figure className="wide-photo">
            <Image src={assetPath("/assets/drive/index_back/table-food.jpg")} alt="Bassic. food and drinks" fill sizes="100vw" />
          </figure>
        </section>
      ) : null}
      {pageKey === "events" ? (
        <section className="section split">
          <div className="narrow-copy">
            <p className="eyebrow">Event Schedule</p>
            <h2>{page.title}</h2>
            <p className="section-lead">{labels.eventHours}</p>
            <Link className="text-link" href={`/${locale}/events/`}>
              Event page <CalendarDays size={16} />
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
