import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { absoluteUrl, site } from "@/lib/site";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: "public bar Bassic. | 福岡 天神 親不孝通りのミュージックバー",
    template: "%s | public bar Bassic."
  },
  description: site.description,
  keywords: [
    "福岡 ミュージックバー",
    "天神 バー",
    "親不孝通り バー",
    "福岡 ライブバー",
    "Bassic",
    "渡辺圭一",
    "貸切 パーティー 天神"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: site.siteUrl,
    siteName: site.name,
    title: "public bar Bassic. | 福岡 天神 親不孝通りのミュージックバー",
    description: site.description,
    images: [
      {
        url: absoluteUrl("/ogp.png"),
        width: 1200,
        height: 630,
        alt: "public bar Bassic. 福岡 天神 親不孝通りのミュージックバー"
      }
    ],
    locale: "ja_JP"
  },
  twitter: {
    card: "summary_large_image",
    title: "public bar Bassic. | 福岡 天神 親不孝通りのミュージックバー",
    description: site.description,
    images: [absoluteUrl("/ogp.png")]
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15120f"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className={notoSansJp.className}>{children}</body>
    </html>
  );
}
