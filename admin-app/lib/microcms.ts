export type AdminEndpointType = "object" | "list";

export type AdminEndpoint = {
  id: string;
  label: string;
  type: AdminEndpointType;
  defaultOrders?: string;
};

export const endpointMap = {
  "site-settings": {
    id: "site-settings",
    label: "店舗情報",
    type: "object"
  },
  home: {
    id: "home",
    label: "TOP文言",
    type: "object"
  },
  "hero-slides": {
    id: "hero-slides",
    label: "メイン画像",
    type: "list",
    defaultOrders: "page,displayOrder"
  },
  events: {
    id: "events",
    label: "イベント",
    type: "list",
    defaultOrders: "-date"
  },
  menu: {
    id: "menu",
    label: "フードメニュー",
    type: "list",
    defaultOrders: "displayOrder"
  },
  "drink-menu-sheets": {
    id: "drink-menu-sheets",
    label: "ドリンク表",
    type: "list",
    defaultOrders: "displayOrder"
  },
  "party-plans": {
    id: "party-plans",
    label: "貸切プラン",
    type: "list",
    defaultOrders: "displayOrder"
  },
  "equipment-rental": {
    id: "equipment-rental",
    label: "機材レンタル",
    type: "object"
  },
  "social-notices": {
    id: "social-notices",
    label: "SNSお知らせ",
    type: "list",
    defaultOrders: "-date"
  },
  "page-copy": {
    id: "page-copy",
    label: "ページ文言",
    type: "list",
    defaultOrders: "page,displayOrder"
  },
  "page-sections": {
    id: "page-sections",
    label: "セクション表示",
    type: "list",
    defaultOrders: "page,displayOrder"
  },
  "custom-sections": {
    id: "custom-sections",
    label: "お知らせ枠",
    type: "list",
    defaultOrders: "page,displayOrder"
  }
} satisfies Record<string, AdminEndpoint>;

const adminFallbackContents = {
  siteSettings: {
    address: "福岡市中央区天神3丁目4-19 WITH天神ビル5F",
    phone: "092-713-1040",
    hoursLabel: "20:00-2:00",
    eventHoursNote: "イベント日は営業時間が変わる場合があります。",
    smokingLabel: "喫煙可",
    chargeLabel: "チャージあり",
    googleMapsUrl: "https://maps.google.com/?q=public+bar+Bassic.",
    directionsUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    xUrl: "",
    onlineStoreUrl: ""
  },
  home: {
    heroTitle: "public bar Bassic.",
    heroLead: "福岡・天神のミュージックバーです。",
    firstVisitLead: "初めての方も、ライブ後の一杯も、お気軽にお越しください。",
    accessNote: "天神駅から徒歩圏内、WITH天神ビル5Fです。"
  },
  events: [],
  partyPlans: [],
  socialNotices: []
};

const adminDefaultMenuItems = [
  {
    category: "food",
    name: "Fuzz Curry",
    price: "¥1,200",
    image: { url: "/assets/menu-refresh/fuzz-curry.jpg", alt: "Fuzz Curry" }
  },
  {
    category: "food",
    name: "Tacos & Potato",
    price: "¥900",
    image: { url: "/assets/menu-refresh/tacos-potato.jpg", alt: "Tacos & Potato" }
  }
];

const adminDrinkMenuSheets = [
  { title: "DRINK MENU 1", src: "/assets/menu-refresh/drinks/drink-menu-2026-01.webp" },
  { title: "DRINK MENU 2", src: "/assets/menu-refresh/drinks/drink-menu-2026-02.webp" },
  { title: "DRINK MENU 3", src: "/assets/menu-refresh/drinks/drink-menu-2026-03.webp" },
  { title: "DRINK MENU 4", src: "/assets/menu-refresh/drinks/drink-menu-2026-04.webp" }
];

export type EndpointId = keyof typeof endpointMap;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

function getContentBaseUrl() {
  return `https://${getRequiredEnv("MICROCMS_SERVICE_DOMAIN")}.microcms.io/api/v1`;
}

function getManagementBaseUrl() {
  return `https://${getRequiredEnv("MICROCMS_SERVICE_DOMAIN")}.microcms-management.io/api/v1`;
}

function headers() {
  return {
    "Content-Type": "application/json",
    "X-MICROCMS-API-KEY": getRequiredEnv("MICROCMS_API_KEY")
  };
}

function sanitizeDraft(draft: Record<string, unknown>) {
  const blockedKeys = new Set(["id", "createdAt", "updatedAt", "publishedAt", "revisedAt"]);

  return Object.fromEntries(Object.entries(draft).filter(([key, value]) => !blockedKeys.has(key) && !key.startsWith("__") && value !== undefined));
}

export function getEndpoint(endpoint: string) {
  const config = endpointMap[endpoint as EndpointId];

  if (!config) {
    throw new Error("Unknown endpoint.");
  }

  return config;
}

function getFallbackContent(endpointId: string, endpoint: AdminEndpoint) {
  const withFallbackMeta = <T extends Record<string, unknown>>(items: T[], prefix: string) =>
    items.map((item, index) => ({
      ...item,
      isPublished: item.isPublished ?? true,
      id: `fallback-${prefix}-${index + 1}`,
      __isFallback: true
    }));

  const fallbackMap: Record<string, unknown> = {
    "site-settings": adminFallbackContents.siteSettings,
    home: {
      ...adminFallbackContents.home,
      instagramWidgetSrc: ""
    },
    events: adminFallbackContents.events || [],
    menu: withFallbackMeta(adminDefaultMenuItems.filter((item) => item.category === "food"), "menu"),
    "party-plans": adminFallbackContents.partyPlans || [],
    "social-notices": adminFallbackContents.socialNotices || [],
    "hero-slides": [],
    "drink-menu-sheets": withFallbackMeta(
      adminDrinkMenuSheets.map((sheet, index) => ({
        title: sheet.title,
        image: { url: sheet.src, alt: sheet.title },
        displayOrder: index + 1,
        isPublished: true
      })),
      "drink-menu-sheet"
    ),
    "equipment-rental": {},
    "page-copy": [],
    "page-sections": [],
    "custom-sections": []
  };

  const fallback = fallbackMap[endpointId];

  if (endpoint.type === "list") {
    return { contents: Array.isArray(fallback) ? fallback : [] };
  }

  return fallback && typeof fallback === "object" && !Array.isArray(fallback) ? fallback : {};
}

async function microCmsFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${getContentBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `microCMS request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getContent(endpointId: string) {
  const endpoint = getEndpoint(endpointId);

  try {
    if (endpoint.type === "object") {
      return await microCmsFetch(`/${endpoint.id}`);
    }

    const params = new URLSearchParams({
      limit: "100"
    });

    if (endpoint.defaultOrders) {
      params.set("orders", endpoint.defaultOrders);
    }

    const data = await microCmsFetch(`/${endpoint.id}?${params.toString()}`);
    const contents = Array.isArray(data?.contents) ? data.contents : [];

    if (!contents.length && (endpointId === "menu" || endpointId === "drink-menu-sheets")) {
      return getFallbackContent(endpointId, endpoint);
    }

    return data;
  } catch (error) {
    if (process.env.ADMIN_ALLOW_CONTENT_FALLBACK === "false") {
      throw error;
    }

    return getFallbackContent(endpointId, endpoint);
  }
}

export async function createContent(endpointId: string, draft: Record<string, unknown>) {
  const endpoint = getEndpoint(endpointId);

  if (endpoint.type !== "list") {
    return updateObjectContent(endpointId, draft);
  }

  return microCmsFetch(`/${endpoint.id}`, {
    method: "POST",
    body: JSON.stringify(sanitizeDraft(draft))
  });
}

export async function updateObjectContent(endpointId: string, draft: Record<string, unknown>) {
  const endpoint = getEndpoint(endpointId);

  return microCmsFetch(`/${endpoint.id}`, {
    method: "PATCH",
    body: JSON.stringify(sanitizeDraft(draft))
  });
}

export async function updateContent(endpointId: string, contentId: string, draft: Record<string, unknown>) {
  const endpoint = getEndpoint(endpointId);

  if (endpoint.type === "object") {
    return updateObjectContent(endpointId, draft);
  }

  return microCmsFetch(`/${endpoint.id}/${encodeURIComponent(contentId)}`, {
    method: "PATCH",
    body: JSON.stringify(sanitizeDraft(draft))
  });
}

export async function deleteContent(endpointId: string, contentId: string) {
  const endpoint = getEndpoint(endpointId);

  if (endpoint.type === "object") {
    throw new Error("Object endpoint cannot be deleted.");
  }

  return microCmsFetch(`/${endpoint.id}/${encodeURIComponent(contentId)}`, {
    method: "DELETE"
  });
}

export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`${getManagementBaseUrl()}/media`, {
    method: "POST",
    headers: {
      "X-MICROCMS-API-KEY": getRequiredEnv("MICROCMS_API_KEY")
    },
    body: formData,
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `microCMS media upload failed: ${response.status}`);
  }

  return response.json() as Promise<{ url: string }>;
}
