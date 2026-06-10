import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { mailHref, navItems, site, telHref } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Image className="site-header-bg" src={assetPath("/assets/brand/topbar.jpg")} alt="" fill priority sizes="100vw" />
      <Link href="/" className="brand" aria-label="public bar Bassic. ホーム">
        <img src={assetPath("/assets/brand/b-logo-mark2.png")} alt="public bar Bassic." width={132} height={132} />
      </Link>
      <nav aria-label="主要ナビゲーション">
        {navItems.map((item) => (
          "external" in item && item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          )
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <p>
        {site.name} / {site.address}
      </p>
      <p>Copyright (C) 2009 - {new Date().getFullYear()} bar Bassic. All Rights Reserved.</p>
    </footer>
  );
}

export function MobileCta() {
  return (
    <div className="mobile-cta" aria-label="固定アクション">
      <a href={telHref()}>
        <Phone size={18} />
        電話
      </a>
      <a href={site.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        地図
      </a>
      <a href={site.instagramUrl} target="_blank" rel="noreferrer">
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

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <MobileCta />
    </>
  );
}

export function PrimaryActions() {
  return (
    <div className="hero-actions">
      <a className="button primary" href={site.googleMapsUrl} target="_blank" rel="noreferrer">
        <MapPin size={18} />
        Google Mapで開く
      </a>
      <a className="button" href={telHref()}>
        <Phone size={18} />
        電話する
      </a>
      <a className="button" href={mailHref("Bassic.予約問い合わせ")}>
        <Mail size={18} />
        メール予約
      </a>
    </div>
  );
}
