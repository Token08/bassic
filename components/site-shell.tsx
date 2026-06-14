"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Instagram, Mail, MapPin, Menu, Phone } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { type LocaleCode } from "@/lib/i18n";
import { currentLocale, localizedInternalHref } from "@/lib/path-utils";
import { mailHref, navItems, site, telHref } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";
import { LanguageSwitcher } from "./language-switcher";

function HeaderNavLinks({ locale }: { locale?: LocaleCode }) {
  return (
    <>
      {navItems.map((item) =>
        "external" in item && item.external ? (
          <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
            {item.label}
          </a>
        ) : (
          <Link key={item.href} href={localizedInternalHref(item.href, locale)}>
            {item.label}
          </Link>
        )
      )}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const locale = currentLocale(pathname);
  const homeHref = localizedInternalHref("/", locale);

  return (
    <header className="site-header">
      <Image className="site-header-bg" src={assetPath("/assets/brand/topbar.jpg")} alt="" fill priority sizes="100vw" />
      <Link href={homeHref} className="brand" aria-label="public bar Bassic. ホーム">
        <img src={assetPath("/assets/brand/b-logo-mark2.png")} alt="public bar Bassic." width={132} height={132} />
      </Link>
      <nav className="desktop-nav" aria-label="主要ナビゲーション">
        <HeaderNavLinks locale={locale} />
      </nav>
      <LanguageSwitcher />
      <details className="mobile-menu">
        <summary aria-label="メニューを開く">
          <Menu size={24} />
        </summary>
        <nav aria-label="スマートフォン用ナビゲーション">
          <HeaderNavLinks locale={locale} />
          <LanguageSwitcher compact />
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter({ settings }: { settings?: SiteSettings }) {
  const footerSettings = settings || site;

  return (
    <footer className="footer">
      <Image className="footer-bg" src={assetPath("/assets/brand/topbar.jpg")} alt="" fill sizes="100vw" />
      <p>
        {site.name} / {footerSettings.address}
      </p>
      <p>Copyright (C) 2009 - {new Date().getFullYear()} bar Bassic. All Rights Reserved.</p>
    </footer>
  );
}

export function MobileCta({ settings }: { settings?: SiteSettings }) {
  const ctaSettings = settings || site;

  return (
    <div className="mobile-cta" aria-label="固定アクション">
      <a href={telHref(ctaSettings.phone)}>
        <Phone size={18} />
        電話
      </a>
      <a href={ctaSettings.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        地図
      </a>
      <a href={ctaSettings.instagramUrl} target="_blank" rel="noreferrer">
        <Instagram size={18} />
        Instagram
      </a>
      <a href={mailHref("Bassic.予約問い合わせ")}>
        <CalendarDays size={18} />
        予約
      </a>
    </div>
  );
}

export function PageShell({ children, settings }: { children: React.ReactNode; settings?: SiteSettings }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter settings={settings} />
      <MobileCta settings={settings} />
    </>
  );
}

export function PrimaryActions({
  mapLabel = "Google Mapで開く",
  callLabel = "電話する",
  reserveLabel = "メール予約"
}: {
  mapLabel?: string;
  callLabel?: string;
  reserveLabel?: string;
} = {}) {
  return (
    <div className="hero-actions">
      <a className="button primary" href={site.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        {mapLabel}
      </a>
      <a className="button" href={telHref()}>
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
