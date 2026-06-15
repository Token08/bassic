import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bassic. 管理画面",
  description: "Bassic. 専用の更新管理画面",
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
