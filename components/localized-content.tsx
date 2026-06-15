import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Navigation } from "lucide-react";
import { FeatureCardGrid, PageHero } from "@/components/content";
import { SocialUpdates } from "@/components/social-updates";
import { VisitInfoGrid, type VisitInfoGridItem } from "@/components/visit-info";
import { editableMedia } from "@/lib/editable-content";
import { type LocaleCode, type LocalizedPageKey, localizedLabels, localizedPages } from "@/lib/i18n";
import { eventScheduleLinkLabels, localizedHomeSections, localizedPageEyebrow, localizedVisitInfoTitles } from "@/lib/localized-content";
import { localizedPageImages } from "@/lib/page-content";
import { localizedInternalHref } from "@/lib/path-utils";
import { mailHref, site } from "@/lib/site";

function LocalizedVisitInfoCards({ locale, labels }: { locale: LocaleCode; labels: (typeof localizedLabels)[LocaleCode] }) {
  const titles = localizedVisitInfoTitles[locale];
  const items: VisitInfoGridItem[] = [
    { icon: "clock", title: titles.hours, text: labels.hours },
    { icon: "calendar", title: titles.events, text: labels.eventHours },
    { icon: "smoking", title: titles.smoking, text: labels.smoking },
    { icon: "charge", title: titles.charge, text: labels.charge }
  ];

  return <VisitInfoGrid ariaLabel={titles.aria} title={titles.heading} lead={titles.lead} items={items} />;
}

function LocalizedFirstVisit({ locale }: { locale: LocaleCode }) {
  const copy = localizedHomeSections[locale];

  return (
    <section className="section intro intro-light">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">First Visit</p>
        <h2>{copy.firstVisitTitle}</h2>
      </div>
      <p className="section-lead narrow-copy">{copy.firstVisitLead}</p>
      <FeatureCardGrid features={copy.features} />
    </section>
  );
}

function LocalizedSocialIntro({ locale }: { locale: LocaleCode }) {
  const copy = localizedHomeSections[locale];

  return (
    <SocialUpdates title={copy.socialTitle} lead={copy.socialLead} instagramFallbackLabel="Instagram" xFallbackLabel="X" />
  );
}

function LocalizedMenuTeaser({ locale }: { locale: LocaleCode }) {
  const copy = localizedHomeSections[locale];

  return (
    <section className="section home-menu-teaser">
      <div className="section-heading narrow-copy">
        <p className="eyebrow">Food & Drink</p>
        <h2>{copy.menuTitle}</h2>
        <p className="section-lead">{copy.menuLead}</p>
        <Link className="text-link" href={localizedInternalHref("/menu", locale)}>
          {localizedLabels[locale].menuLink} <ArrowRight size={16} />
        </Link>
      </div>
      <figure className="wide-photo">
        <Image src={editableMedia.foodTeaser.src} alt={editableMedia.foodTeaser.alt} fill sizes="100vw" />
      </figure>
    </section>
  );
}

function LocalizedAccessPreview({ locale }: { locale: LocaleCode }) {
  const labels = localizedLabels[locale];
  const copy = localizedHomeSections[locale];
  const titles = localizedVisitInfoTitles[locale];
  const mapQuery = encodeURIComponent("public bar Bassic. 福岡市中央区天神3-4-19 WITH天神5F");
  const mapSrc = `https://maps.google.com/maps?q=${mapQuery}&z=16&hl=ja&output=embed`;

  return (
    <section className="section access-section">
      <div className="access-copy narrow-copy">
        <p className="eyebrow">Access</p>
        <h2>{copy.accessTitle}</h2>
        <p>{copy.accessLead}</p>
        <dl className="access-list">
          <dt>{labels.address}</dt>
          <dd>{site.address}</dd>
          <dt>{labels.phone}</dt>
          <dd>{site.phone}</dd>
          <dt>{labels.email}</dt>
          <dd>{site.email}</dd>
          <dt>{titles.hours}</dt>
          <dd>
            {labels.hours}
            <br />
            {labels.eventHours}
            <br />
            <Link className="inline-access-link" href={localizedInternalHref("/events", locale)}>
              {eventScheduleLinkLabels[locale]}
            </Link>
          </dd>
          <dt>{titles.smoking}</dt>
          <dd>{labels.smoking}</dd>
        </dl>
        <div className="hero-actions">
          <a className="button primary" href={site.directionsUrl} target="_blank" rel="noreferrer">
            <Navigation size={18} />
            {labels.directions}
          </a>
          <a className="button" href={mailHref("Bassic. reservation")}>
            <CalendarDays size={18} />
            {labels.reserve}
          </a>
        </div>
      </div>
      <iframe
        title="public bar Bassic. Google Map"
        className="map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapSrc}
      />
    </section>
  );
}

function LocalizedHomePage({ locale }: { locale: LocaleCode }) {
  const page = localizedPages[locale].home;
  const labels = localizedLabels[locale];

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        image={editableMedia.homeHeroImage.src}
        imageAlt={page.title}
        slides={editableMedia.homeHeroSlides}
        className="home-hero"
        actionLabels={{ mapLabel: labels.map, callLabel: labels.call, reserveLabel: labels.reserve }}
      />
      <LocalizedFirstVisit locale={locale} />
      <LocalizedVisitInfoCards locale={locale} labels={labels} />
      <LocalizedSocialIntro locale={locale} />
      <LocalizedMenuTeaser locale={locale} />
      <LocalizedAccessPreview locale={locale} />
    </>
  );
}

export function LocalizedPage({ locale, pageKey }: { locale: LocaleCode; pageKey: LocalizedPageKey }) {
  if (pageKey === "home") {
    return <LocalizedHomePage locale={locale} />;
  }

  const page = localizedPages[locale][pageKey];
  const labels = localizedLabels[locale];

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={page.lead}
        image={localizedPageImages[pageKey]}
        imageAlt={page.title}
        className={`localized-hero localized-${pageKey}-hero`}
        actionLabels={{ mapLabel: labels.map, callLabel: labels.call, reserveLabel: labels.reserve }}
      />
      <section className="section intro intro-light localized-section">
        <div className="section-heading narrow-copy">
          <p className="eyebrow">{localizedPageEyebrow[locale]}</p>
          <h2>{page.title}</h2>
          <p className="section-lead">{page.lead}</p>
        </div>
      </section>
      <LocalizedVisitInfoCards locale={locale} labels={labels} />
      {pageKey === "menu" ? <LocalizedMenuTeaser locale={locale} /> : null}
      {pageKey === "events" ? <LocalizedSocialIntro locale={locale} /> : null}
      {pageKey === "party" ? <LocalizedFirstVisit locale={locale} /> : null}
      {pageKey === "access" ? <LocalizedAccessPreview locale={locale} /> : null}
    </>
  );
}
