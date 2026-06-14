export type CmsImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type EventItem = {
  id: string;
  sourceId?: string;
  sourceType?: "facebook" | "facebook_ical" | "google_calendar";
  sourceUrl?: string;
  title: string;
  date: string;
  openTime?: string;
  startTime?: string;
  performers?: string;
  price?: string;
  reservation?: string;
  image?: CmsImage;
  isPublished: boolean;
};

export type MenuItem = {
  name: string;
  englishName?: string;
  price?: string;
  description?: string;
  category: "food" | "drink";
  image?: CmsImage;
};

export type PartyPlan = {
  title: string;
  price: string;
  body: string;
};

export type SocialPlatform = "instagram" | "facebook" | "x";

export type SocialNotice = {
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  date?: string;
  description?: string;
  isPublished: boolean;
};

export type HomeContent = {
  heroTitle: string;
  heroLead: string;
  firstVisitLead: string;
  accessNote: string;
  instagramWidgetSrc?: string;
  heroImage?: CmsImage;
};

export type CmsContents = {
  home: HomeContent;
  events: EventItem[];
  menu: MenuItem[];
  partyPlans: PartyPlan[];
  socialNotices: SocialNotice[];
};
