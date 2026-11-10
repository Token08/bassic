export type CmsImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type SiteSettings = {
  email?: string;
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
  endTime?: string;
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

export type ManagedPage = "home" | "events" | "menu" | "party" | "access";

export type PageCopy = {
  id?: string;
  page: ManagedPage;
  heroEyebrow?: string;
  heroTitle?: string;
  heroLead?: string;
  introLead?: string;
  accessNote?: string;
  socialTitleLine1?: string;
  socialTitleLine2?: string;
  socialLead?: string;
  listEyebrow?: string;
  listTitle?: string;
  calendarNote?: string;
  drinkLead?: string;
  foodLead?: string;
  partyLead?: string;
  rentalLead?: string;
  displayOrder?: number;
  isPublished?: boolean;
};

export type PageSection = {
  id?: string;
  page: ManagedPage;
  sectionKey: string;
  displayOrder?: number;
  isPublished?: boolean;
};

export type CustomSection = {
  eyebrow?: string;
  id?: string;
  page: ManagedPage;
  title: string;
  body: string;
  image?: CmsImage;
  linkLabel?: string;
  linkUrl?: string;
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
  image?: CmsImage;
  id: string;
  platform: SocialPlatform;
  title: string;
  url: string;
  date?: string;
  description?: string;
  isPublished: boolean;
};

export type HomeContent = {
  heroMobileTitle?: string;
  mobileHideCall?: boolean;
  mobileHideMap?: boolean;
  mobileHideInstagram?: boolean;
  mobileHideReserve?: boolean;
  homeHeroTitle?: string;
  homeHeroLead?: string;
  heroEyebrow?: string;
  heroMapLabel?: string;
  heroCallLabel?: string;
  heroReserveLabel?: string;
  heroLogo?: CmsImage;
  visitInfoCard1Title?: string;
  visitInfoCard1Text?: string;
  visitInfoCard2Title?: string;
  visitInfoCard2Text?: string;
  visitInfoCard3Title?: string;
  visitInfoCard3Text?: string;
  visitInfoCard4Title?: string;
  visitInfoCard4Text?: string;
  socialEyebrow?: string;
  socialInstagramLabel?: string;
  socialInstagramAccount?: string;
  socialInstagramButton?: string;
  socialInstagramDescription?: string;
  socialInstagramImage?: CmsImage;
  socialFacebookLabel?: string;
  socialFacebookAccount?: string;
  socialFacebookButton?: string;
  socialXLabel?: string;
  socialXAccount?: string;
  socialXButton?: string;
  socialXDescription?: string;
  socialXImage?: CmsImage;
  homeAccessEyebrow?: string;
  homeAccessAddressLabel?: string;
  homeAccessPhoneLabel?: string;
  homeAccessEmailLabel?: string;
  homeAccessHoursLabel?: string;
  homeAccessSmokingLabel?: string;
  homeAccessEventsLabel?: string;
  homeAccessDirectionsTitle?: string;
  homeAccessDirectionsLabel?: string;
  homeAccessReserveLabel?: string;
  headerLogo?: CmsImage;
  headerBackground?: CmsImage;
  footerBackground?: CmsImage;
  footerStoreName?: string;
  footerCopyright?: string;
  headerNav1Label?: string;
  headerNav2Label?: string;
  headerNav3Label?: string;
  headerNav4Label?: string;
  headerNav5Label?: string;
  headerNav6Label?: string;
  mobileCallLabel?: string;
  mobileMapLabel?: string;
  mobileInstagramLabel?: string;
  mobileReserveLabel?: string;
  heroTitle: string;
  heroLead: string;
  firstVisitLead: string;
  accessNote: string;
  instagramWidgetSrc?: string;
  heroImage?: CmsImage;
  firstVisitEyebrow?: string;
  firstVisitTitle?: string;
  firstVisitDescription?: string;
  visitInfoTitle?: string;
  visitInfoLead?: string;
  localSearchEyebrow?: string;
  localSearchTitle?: string;
  localSearchLead?: string;
  socialTitleLine1?: string;
  socialTitleLine2?: string;
  socialLead?: string;
  homeAccessTitle?: string;
  homeAccessNote?: string;
  homeAccessTip1?: string;
  homeAccessTip2?: string;
  homeAccessTip3?: string;
} & Partial<Record<`firstVisitCard${1 | 2 | 3}MobilePosition`, string>>
  & Partial<Record<`firstVisitCard${1 | 2 | 3}${"Title" | "Text"}` | `localSearchCard${1 | 2 | 3 | 4}${"Title" | "Text"}`, string>>
  & Partial<Record<`firstVisitCard${1 | 2 | 3}Image`, CmsImage>>;

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
  pageCopy: Record<ManagedPage, PageCopy>;
  pageSections: Record<ManagedPage, PageSection[]>;
  customSections: Record<ManagedPage, CustomSection[]>;
};
