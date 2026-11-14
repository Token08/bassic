import type { Metadata } from "next";
import { brandIcons } from "@public/lib/brand-icons";
import { resolvePublicUrl } from "@/lib/public-site-url";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bassic. 管理画面",
  description: "Bassic. 専用の更新管理画面",
  icons: {
    icon: resolvePublicUrl(brandIcons.icon, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp"),
    apple: resolvePublicUrl(brandIcons.apple, process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp")
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
