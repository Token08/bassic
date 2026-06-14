export type CmsImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type SiteSettings = {
  address: string;
  phone: string;
  hoursLabel: string;
  eventHoursNote?: string;
  smokingLabel: string;
  chargeLabel: string;
  googleMapsUrl: string;
  directionsUrl?: string;
  instagramUrl: string;
  facebookUrl: string;
  xUrl: string;
  onlineStoreUrl?: string;
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
  displayOrder?: number;
  isPublished?: boolean;
};

export type PartyPlan = {
  title: string;
  price: string;
  body: string;
  displayOrder?: number;
  isPublished?: boolean;
};

export type DrinkMenuSheet = {
  title: string;
  image?: CmsImage;
  src?: string;
  displayOrder?: number;
  isPublished?: boolean;
};

export type HeroSlide = {
  page: "home" | "events" | "party" | "menu" | "access";
  title?: string;
  image: CmsImage;
  displayOrder?: number;
  isPublished?: boolean;
};

export type EquipmentRental = {
  title: string;
  price?: string;
  body: string;
  pdfUrl?: string;
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
  siteSettings: SiteSettings;
  home: HomeContent;
  heroSlides: Record<HeroSlide["page"], HeroSlide[]>;
  events: EventItem[];
  menu: MenuItem[];
  drinkMenuSheets: DrinkMenuSheet[];
  partyPlans: PartyPlan[];
  equipmentRental: EquipmentRental;
  socialNotices: SocialNotice[];
};
