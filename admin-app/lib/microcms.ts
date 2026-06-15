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
    label: "SNS告知",
    type: "list",
    defaultOrders: "-date"
  }
} satisfies Record<string, AdminEndpoint>;

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

  return Object.fromEntries(Object.entries(draft).filter(([key, value]) => !blockedKeys.has(key) && value !== undefined));
}

export function getEndpoint(endpoint: string) {
  const config = endpointMap[endpoint as EndpointId];

  if (!config) {
    throw new Error("Unknown endpoint.");
  }

  return config;
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

  if (endpoint.type === "object") {
    return microCmsFetch(`/${endpoint.id}`);
  }

  const params = new URLSearchParams({
    limit: "100"
  });

  if (endpoint.defaultOrders) {
    params.set("orders", endpoint.defaultOrders);
  }

  return microCmsFetch(`/${endpoint.id}?${params.toString()}`);
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
