import { fallbackContents as adminFallbackContents } from "../../lib/fallback-data";
import { defaultMenuItems as adminDefaultMenuItems, drinkMenuSheets as adminDrinkMenuSheets } from "../../lib/menu-data";
import {equipmentRentalInfo} from "../../lib/page-content";
import { packSlideTitle, unpackSlideTitle } from "../../lib/responsive-media";
import { mergeEventRecords, packEventRecord } from "../../lib/event-storage.mjs";
import { decodeSocialNoticeRecord, packSocialNoticeRecord } from "../../lib/social-notice-storage.mjs";
import { cmsRequest } from "./cms-request";
export { ContentStorageError } from "./cms-request";

export type AdminEndpointType = "object" | "list";

export type AdminEndpoint = {
  id: string;
  label: string;
  type: AdminEndpointType;
  defaultOrders?: string;
};

export const endpointMap = {
  'visual-editor': { id: 'visual-editor', label: 'ページ編集設定', type: 'object' },
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

export type EndpointId = keyof typeof endpointMap;

const compactStoreEndpointId = "menu";
const compactListEndpointIds = new Set([
  "events",
  "drink-menu-sheets",
  "party-plans",
  "social-notices",
  "page-copy",
  "page-sections",
  "custom-sections"
]);
const compactObjectEndpointIds = new Set(["site-settings", "home", "equipment-rental", "visual-editor"]);
const compactJsonObjectEndpointIds = new Set(["site-settings", "home", "visual-editor"]);

function isCompactListEndpoint(endpointId: string) {
  return compactListEndpointIds.has(endpointId);
}

function isCompactObjectEndpoint(endpointId: string) {
  return compactObjectEndpointIds.has(endpointId);
}

function isCompactEndpoint(endpointId: string) {
  return isCompactListEndpoint(endpointId) || isCompactObjectEndpoint(endpointId);
}

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

function compactDraft(endpointId: string, draft: Record<string, unknown>) {
  const sanitized = sanitizeDraft(draft);
  if (endpointId === "events") return packEventRecord(sanitized);
  if (endpointId === "social-notices") return packSocialNoticeRecord(sanitized);

  if (endpointId === "hero-slides") {
    const { mobileImage, mobilePosition, title, ...slide } = sanitized;
    return { ...slide, title: packSlideTitle(title, mobileImage, mobilePosition) };
  }

  if (endpointId === "menu") {
    return {
      ...sanitized,
      kind: sanitized.kind || "menu",
      category: sanitized.category || "food"
    };
  }

  if (!isCompactEndpoint(endpointId)) {
    return sanitized;
  }

  if (compactJsonObjectEndpointIds.has(endpointId)) {
    return {
      kind: endpointId,
      category: "cms",
      title: endpointId,
      body: JSON.stringify(sanitized)
    };
  }

  return {
    ...sanitized,
    kind: endpointId,
    category: "cms"
  };
}

function compactItemMatches(endpointId: string, item: Record<string, unknown>) {
  const kind = typeof item.kind === "string" ? item.kind : "";

  if (endpointId === "menu") {
    return !kind || kind === "menu";
  }

  return kind === endpointId;
}

async function getCompactItems() {
  return readAllItems(compactStoreEndpointId, "displayOrder");
}

async function findCompactObject(endpointId: string) {
  const items = await getCompactItems();
  return items.find((item) => compactItemMatches(endpointId, item));
}

function expandCompactObject(endpointId: string, item: Record<string, unknown> | undefined) {
  if (!item) {
    return undefined;
  }

  if (!compactJsonObjectEndpointIds.has(endpointId)) {
    return item;
  }

  const body = typeof item.body === "string" ? item.body : "";

  const parsed = JSON.parse(body);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("保存データの形式を確認してください。");
  return { ...parsed, id: item.id };
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
    "party-plans": withFallbackMeta(adminFallbackContents.partyPlans || [],"party-plan"),
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
    "equipment-rental": { ...equipmentRentalInfo, pdfUrl: "/assets/pdf/equipment-rental-list.pdf" },
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
  if (init.method && init.method !== "GET" && process.env.VERCEL_ENV === "preview") {
    throw new Error("Preview CMS access is read-only.");
  }
  return cmsRequest(`${getContentBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {})
    }
  }, path);
}

export async function getContent(endpointId: string) {
  const endpoint = getEndpoint(endpointId);

  try {
    if(endpointId==='menu'){
      const contents=(await getCompactItems()).filter(item=>compactItemMatches('menu',item));
      return contents.length?{contents}:getFallbackContent(endpointId,endpoint);
    }
    if (endpointId === "social-notices") {
      return { contents: await getStoredItems("social-notices") };
    }
    if (endpointId === "events") return { contents: await getStoredItems("events") };

    if (isCompactListEndpoint(endpointId)) {
      const contents = (await getCompactItems()).filter((item) => compactItemMatches(endpointId, item));

      if (!contents.length && endpointId === "drink-menu-sheets") {
        return getFallbackContent(endpointId, endpoint);
      }

      return { contents };
    }

    if (isCompactObjectEndpoint(endpointId)) {
      return expandCompactObject(endpointId, await findCompactObject(endpointId)) || getFallbackContent(endpointId, endpoint);
    }

    if (endpoint.type === "object") {
      return await microCmsFetch(`/${endpoint.id}`);
    }

    const contents = await readAllItems(endpoint.id, endpoint.defaultOrders);

    if (!contents.length && (endpointId === "menu" || endpointId === "drink-menu-sheets")) {
      return getFallbackContent(endpointId, endpoint);
    }

    return endpointId === "hero-slides"
      ? { contents: contents.map((slide) => ({ ...slide, ...unpackSlideTitle(slide.title) })) }
      : { contents };
  } catch (error) {
    if (process.env.ADMIN_ALLOW_CONTENT_FALLBACK !== "true" || process.env.NODE_ENV === "production") {
      throw error;
    }

    return getFallbackContent(endpointId, endpoint);
  }
}

/** One strict, paginated read of each physical endpoint per page preview. */
export async function readEditorSnapshot(){
  const [compact,legacyEvents,slides]=await Promise.all([getCompactItems(),readAllItems('events'),readAllItems('hero-slides','page,displayOrder')]);
  const events=mergeEventRecords(legacyEvents,compact);
  const data:Record<string,unknown>={events,'hero-slides':slides.map(slide=>({...slide,...unpackSlideTitle(slide.title)}))};
  for(const id of ['site-settings','home','equipment-rental','visual-editor'])data[id]=expandCompactObject(id,compact.find(item=>compactItemMatches(id,item)));
  for(const id of ['menu','drink-menu-sheets','party-plans','page-copy','page-sections','custom-sections']){
    const items=compact.filter(item=>compactItemMatches(id,item));
    data[id]=items;
  }
  data['social-notices']=[];
  return data;
}

async function readAllItems(endpoint: string, orders = "createdAt") {
  const items: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();
  for (let offset = 0; ; offset += 100) {
    const query = new URLSearchParams({ limit: "100", orders, offset: String(offset) });
    const data = await microCmsFetch(`/${endpoint}?${query}`);
    if (!Array.isArray(data?.contents)) throw new Error("CMS一覧を取得できませんでした。");
    for (const item of data.contents) {
      if (!item || typeof item.id !== "string" || seenIds.has(item.id)) {
        throw new Error("CMS一覧を最後まで確認できませんでした。もう一度読み込んでください。");
      }
      seenIds.add(item.id);
    }
    items.push(...data.contents);
    if (data.contents.length < 100 || items.length >= data.totalCount) break;
  }
  return items;
}

export async function getStoredItems(endpointId: "events" | "social-notices") {
  if (endpointId === "events") {
    const [legacy, compact] = await Promise.all([readAllItems("events"), getCompactItems()]);
    return mergeEventRecords(legacy, compact);
  }
  return (await getCompactItems()).filter((item) => compactItemMatches(endpointId, item)).map(decodeSocialNoticeRecord).filter(item => !item.__removed);
}

export function facebookEventIdentity(event: Record<string, unknown>) {
  try {
    const url = new URL(String(event.sourceUrl || ""));
    if (["facebook.com", "www.facebook.com", "m.facebook.com", "mbasic.facebook.com", "fb.me"].includes(url.hostname)) {
      const parts = url.pathname.split("/");
      const index = parts.indexOf("events");
      const id = index >= 0 ? parts.slice(index + 1).reverse().find((part) => /^\d{6,}$/.test(part)) : undefined;
      if (id) return id;
    }
  } catch {
    // Older records may contain only the source ID.
  }
  const sourceId = String(event.sourceId || "");
  return event.sourceType === "facebook" && /^\d{6,}$/.test(sourceId) ? sourceId : "";
}

export async function findFacebookEvents(sourceId: string) {
  return (await getStoredItems("events")).filter((event) => facebookEventIdentity(event) === sourceId);
}

export async function createContent(endpointId: string, draft: Record<string, unknown>) {
  const endpoint = getEndpoint(endpointId);

  if (isCompactEndpoint(endpointId)) {
    return microCmsFetch(`/${compactStoreEndpointId}`, {
      method: "POST",
      body: JSON.stringify(compactDraft(endpointId, draft))
    });
  }

  if (endpoint.type !== "list") {
    return updateObjectContent(endpointId, draft);
  }

  return microCmsFetch(`/${endpoint.id}`, {
    method: "POST",
    body: JSON.stringify(compactDraft(endpointId, draft))
  });
}

export async function updateObjectContent(endpointId: string, draft: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const endpoint = getEndpoint(endpointId);
  if ((endpointId === "events" || endpointId === "social-notices") && typeof draft.id === "string") return updateContent(endpointId, draft.id, draft);

  if (isCompactObjectEndpoint(endpointId)) {
    const existing = await findCompactObject(endpointId);
    const body = JSON.stringify(compactDraft(endpointId, draft));

    if (existing?.id) {
      return microCmsFetch(`/${compactStoreEndpointId}/${encodeURIComponent(String(existing.id))}`, {
        method: "PATCH",
        body
      });
    }

    return microCmsFetch(`/${compactStoreEndpointId}`, {
      method: "POST",
      body
    });
  }

  return microCmsFetch(`/${endpoint.id}`, {
    method: "PATCH",
    body: JSON.stringify(compactDraft(endpointId, draft))
  });
}

export async function updateContent(endpointId: string, contentId: string, draft: Record<string, unknown>) {
  const endpoint = getEndpoint(endpointId);

  if (endpointId === "social-notices") {
    const existing = (await getStoredItems("social-notices")).find(item => item.id === contentId);
    if (!existing) throw new Error("SNS下書きが見つかりません。");
    return microCmsFetch(`/${compactStoreEndpointId}/${encodeURIComponent(contentId)}`, {
      method: "PATCH", body: JSON.stringify(packSocialNoticeRecord({ ...existing, ...sanitizeDraft(draft) }))
    });
  }

  if (endpointId === "events") {
    const [legacy, compact] = await Promise.all([readAllItems("events"), getCompactItems()]);
    const existing = mergeEventRecords(legacy, compact).find(item => item.id === contentId);
    if (!existing) throw new Error("イベントが見つかりません。");
    const stored = compact.find(item => item.id === contentId && item.kind === "events");
    return microCmsFetch(stored ? `/${compactStoreEndpointId}/${encodeURIComponent(contentId)}` : `/${compactStoreEndpointId}`, {
      method: stored ? "PATCH" : "POST",
      body: JSON.stringify(packEventRecord({ ...existing, ...sanitizeDraft(draft) }, { legacyId: stored ? JSON.parse(String(stored.body)).legacyId : contentId }))
    });
  }

  if (endpoint.type === "object") {
    return updateObjectContent(endpointId, draft);
  }

  const storedEndpointId = isCompactEndpoint(endpointId) ? compactStoreEndpointId : endpoint.id;

  return microCmsFetch(`/${storedEndpointId}/${encodeURIComponent(contentId)}`, {
    method: "PATCH",
    body: JSON.stringify(compactDraft(endpointId, draft))
  });
}

export async function deleteContent(endpointId: string, contentId: string) {
  const endpoint = getEndpoint(endpointId);
  if (endpointId === "social-notices") {
    const existing = (await getStoredItems("social-notices")).find(item => item.id === contentId);
    if (!existing) throw new Error("SNS下書きが見つかりません。");
    return microCmsFetch(`/${compactStoreEndpointId}/${encodeURIComponent(contentId)}`, {
      method: "PATCH", body: JSON.stringify(packSocialNoticeRecord({ ...existing, isPublished: false, deliveryStatus: "draft" }, { removed: true }))
    });
  }

  if (endpointId === "events") {
    const [legacy, compact] = await Promise.all([readAllItems("events"), getCompactItems()]);
    const existing = mergeEventRecords(legacy, compact).find(item => item.id === contentId);
    if (!existing) throw new Error("イベントが見つかりません。");
    const stored = compact.find(item => item.id === contentId && item.kind === "events");
    // Keep a tombstone so removing a migrated item never resurrects its old copy.
    return microCmsFetch(stored ? `/${compactStoreEndpointId}/${encodeURIComponent(contentId)}` : `/${compactStoreEndpointId}`, {
      method: stored ? "PATCH" : "POST",
      body: JSON.stringify(packEventRecord({ ...existing, isPublished: false }, { legacyId: stored ? JSON.parse(String(stored.body)).legacyId : contentId, removed: true }))
    });
  }

  if (endpoint.type === "object") {
    throw new Error("Object endpoint cannot be deleted.");
  }

  const storedEndpointId = isCompactEndpoint(endpointId) ? compactStoreEndpointId : endpoint.id;

  return microCmsFetch(`/${storedEndpointId}/${encodeURIComponent(contentId)}`, {
    method: "DELETE"
  });
}

export async function uploadMedia(file: File) {
  if (process.env.VERCEL_ENV === "preview") {
    throw new Error("Preview CMS access is read-only.");
  }
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
