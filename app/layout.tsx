import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { absoluteUrl, site } from "@/lib/site";
import { languageAlternates } from "@/lib/seo";

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
  keywords: [...site.keywords, "Bassic", "渡辺圭一"],
  alternates: {
    canonical: absoluteUrl("/"),
    languages: languageAlternates("/")
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
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
