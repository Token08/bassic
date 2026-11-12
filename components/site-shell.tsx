import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Instagram, Mail, MapPin, Menu, Phone } from "lucide-react";
import { assetPath } from "@public/lib/assets";
import { type LocaleCode } from "@public/lib/i18n";
import { currentLocale, localizedInternalHref } from "@public/lib/path-utils";
import { mailHref, navItems, site, telHref } from "@public/lib/site";
import type { HomeContent, SiteSettings } from "@public/lib/types";
import { LanguageSwitcher } from "./language-switcher";

function HeaderNavLinks({ locale, home, settings }: { locale?: LocaleCode; home?: HomeContent; settings?: SiteSettings }) {
  return (
    <>
      {navItems.map((item, index) => {
        const position = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
        const label = home?.[`headerNav${position}Label`]?.trim() || item.label;
        return "external" in item && item.external ? (
          <a key={item.href} href={settings?.onlineStoreUrl || item.href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <Link key={item.href} href={localizedInternalHref(item.href, locale)}>
            {label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader({ home, settings, pathname = "/" }: { home?: HomeContent; settings?: SiteSettings; pathname?: string } = {}) {
  const locale = currentLocale(pathname);
  const homeHref = localizedInternalHref("/", locale);

  return (
    <header className="site-header">
      <Image className="site-header-bg" src={assetPath(home?.headerBackground?.url || "/assets/brand/topbar.jpg")} alt="" fill priority sizes="100vw" />
      <Link href={homeHref} className="brand" aria-label="public bar Bassic. ホーム">
        <img src={assetPath(home?.headerLogo?.url || "/assets/brand/b-logo-mark2.png")} alt={home?.headerLogo?.alt || "public bar Bassic."} width={132} height={132} />
      </Link>
      <nav className="desktop-nav" aria-label="主要ナビゲーション">
        <HeaderNavLinks locale={locale} home={home} settings={settings} />
      </nav>
      <LanguageSwitcher pathname={pathname} />
      <details className="mobile-menu">
        <summary aria-label="メニューを開く">
          <Menu size={24} />
        </summary>
        <nav aria-label="スマートフォン用ナビゲーション">
          <HeaderNavLinks locale={locale} home={home} settings={settings} />
          <LanguageSwitcher compact pathname={pathname} />
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter({ settings, home }: { settings?: SiteSettings; home?: HomeContent }) {
  const footerSettings = settings || site;

  return (
    <footer className="footer">
      <Image className="footer-bg" src={assetPath("/assets/brand/topbar.jpg")} alt="" fill sizes="100vw" />
      <p>
        {home?.footerStoreName?.trim() || site.name} / {footerSettings.address}
      </p>
      <p>{home?.footerCopyright?.trim() || `Copyright (C) 2009 - ${new Date().getFullYear()} bar Bassic. All Rights Reserved.`}</p>
    </footer>
  );
}

export function MobileCta({ settings, home }: { settings?: SiteSettings; home?: HomeContent }) {
  const ctaSettings = settings || site;

  const links = [
    { hidden: home?.mobileHideCall, label: home?.mobileCallLabel?.trim() || "電話", href: telHref(ctaSettings.phone), icon: Phone },
    { hidden: home?.mobileHideMap, label: home?.mobileMapLabel?.trim() || "地図", href: ctaSettings.googleMapsUrl, icon: MapPin, external: true },
    { hidden: home?.mobileHideInstagram, label: home?.mobileInstagramLabel?.trim() || "Instagram", href: ctaSettings.instagramUrl, icon: Instagram, external: true },
    { hidden: home?.mobileHideReserve, label: home?.mobileReserveLabel?.trim() || "予約", href: mailHref("Bassic.予約問い合わせ", ctaSettings.email), icon: CalendarDays }
  ].filter((link) => link.hidden !== true);

  return links.length ? (
    <div className="mobile-cta" aria-label="固定アクション" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
      {links.map(({ label, href, icon: Icon, external }) => (
        <a key={href} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
          <Icon size={18} />
          {label}
        </a>
      ))}
    </div>
  ) : null;
}

export function PageShell({ children, settings, home, pathname = "/" }: { children: React.ReactNode; settings?: SiteSettings; home?: HomeContent; pathname?: string }) {
  return (
    <>
      <SiteHeader home={home} settings={settings} pathname={pathname} />
      {children}
      <SiteFooter settings={settings} home={home} />
      <MobileCta settings={settings} home={home} />
    </>
  );
}

export function PrimaryActions({
  mapLabel = "Google Mapで開く",
  callLabel = "電話する",
  reserveLabel = "メール予約",
  settings
}: {
  mapLabel?: string;
  callLabel?: string;
  reserveLabel?: string;
  settings?: SiteSettings;
} = {}) {
  return (
    <div className="hero-actions">
      <a className="button primary" href={settings?.googleMapsUrl || site.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        {mapLabel}
      </a>
      <a className="button" href={telHref(settings?.phone)}>
        <Phone size={18} />
        {callLabel}
      </a>
      <a className="button" href={mailHref("Bassic.予約問い合わせ")}>
        <Mail size={18} />
        {reserveLabel}
      </a>
    </div>
  );
}
