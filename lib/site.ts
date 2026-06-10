export const site = {
  name: "public bar Bassic.",
  japaneseName: "パブリックバー ベーシック",
  owner: "渡辺圭一",
  tagline: "福岡・天神 親不孝通りのミュージックバー",
  description:
    "public bar Bassic.は福岡市中央区天神、親不孝通りにあるミュージックバーです。音楽、お酒、料理、ライブイベントを初めての方も気軽に楽しめます。",
  address: "福岡市中央区天神3-4-19 WITH天神5F",
  postalCode: "810-0001",
  region: "福岡県",
  locality: "福岡市中央区天神",
  streetAddress: "3-4-19 WITH天神5F",
  phone: "092-713-1040",
  email: "mail@bassic.jp",
  hoursLabel: "営業時間はイベントにより変動します。公開前に最新情報を確認してください。",
  priceRange: "￥2,000-￥5,000",
  nearestStation: "地下鉄空港線 天神駅から徒歩約4分",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.bassic.jp",
  googleMapsUrl:
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ||
    "https://www.google.com/maps/search/?api=1&query=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F",
  directionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=public%20bar%20Bassic.%20福岡市中央区天神3-4-19%20WITH天神5F",
  instagramUrl: "https://www.instagram.com/bassic_official/",
  onlineStoreUrl: "https://bassic.official.ec/",
  xUrl: "https://x.com/bar_Bassic",
  facebookUrl: "https://www.facebook.com/bar.Bassic/"
} as const;

export const navItems = [
  { href: "/", label: "H O M E" },
  { href: "/events", label: "EVENT SCHEDULE" },
  { href: "/menu", label: "M E N U" },
  { href: site.onlineStoreUrl, label: "ONLINE STORE", external: true },
  { href: "/party", label: "PARTY & RENTAL" },
  { href: "/access", label: "A C C E S S" }
] as const;

export function absoluteUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${site.siteUrl.replace(/\/$/, "")}${normalizedPath}`;
}

export function telHref(phone = site.phone) {
  return `tel:${phone.replace(/-/g, "")}`;
}

export function mailHref(subject: string) {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}
