"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { adminPages, type ActiveSectionState, type PageAdminAction } from "@/lib/admin-pages";
import { AdminImage } from "./components/admin-image";
import { PdfField } from "./components/pdf-field";
import { ClosedDayForm } from "./components/closed-day-form";
import { OperationsHealthPanel } from "./components/operations-health-panel";
import { SnsPostingPanel } from "./components/sns-posting-panel";
import { CalendarSyncStatus } from "./components/calendar-sync-status";
import { EventSocialActions } from "./components/event-social-actions";
import type { CalendarEventInput } from "@/lib/event-handoff";
import { PublicPageCanvas } from "./public-page-canvas";
import { VisualPageEditor } from './visual-page-editor';
import { currentFieldDefaults } from "../lib/current-field-values";
import type { PublishStatus } from "@/lib/deploy-status";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { editableMedia } from "../../lib/editable-content";
import { fallbackContents } from "../../lib/fallback-data";
import { firstVisitSection, localSearchSection, pageHeroes, socialUpdatesCopy, visitInfoItems, type PageHeroContent } from "../../lib/page-content";

import { getSection, homeFieldGroups, sections, type FieldDefinition, type SectionDefinition } from "@/lib/admin-schema";
import { resolvePublicUrl } from "@/lib/public-site-url";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { useErrorFocus } from "@/lib/use-error-focus";
import { publicationDeadline, canLookUpPublication } from "@public/lib/publication-timing.mjs";

type Draft = Record<string, unknown>;
type ApiResult<T = unknown> = {
  ok: boolean;
  data?: T;
  message?: string;
};

type ListResponse = {
  contents?: Array<Draft & { id?: string }>;
};

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
  validation?: boolean;
  actionsUrl?: string;
  requestId?: string;
  retryPublish?: boolean;
  calendarOnly?: boolean;
  eventDelivery?: { calendar: string; social: string; socialEventId?: string; socialSourceId?: string; socialRetryNeeded?: boolean; event?: CalendarEventInput & { id: string; syncKey?: string } };
  sectionId?: string;
  requestedAt?: string;
  sourceLabel?: string;
  confirmationSteps?: string[];
};

type HealthCheck = {
  key: string;
  label: string;
  present: boolean;
  requiredFor: "login" | "save" | "publish";
};

type PublicSiteUrlStatus = {
  url: string;
  isProduction: boolean;
  isTemporary: boolean;
  message: string;
};

type HealthState = {
  ok: boolean;
  checks: HealthCheck[];
  missing: HealthCheck[];
  publicSiteUrl?: PublicSiteUrlStatus;
};

type OpsAlert = {
  id: string;
  severity: "warning" | "error";
  sectionId: SectionDefinition["id"];
  title: string;
  detail: string;
};

type OpsStatus = {
  generatedAt: string;
  alerts: OpsAlert[];
  loadError?: boolean;
};

type FacebookEventPreview = {
  title: string;
  imageUrl: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  sourceId: string;
  sourceUrl: string;
  existingEvents?: Draft[];
};

type EventPublishFlowResult = {
  created?: string[];
  skipped?: string[];
  review?: string[];
};

function socialDraftResult(data?: EventPublishFlowResult) {
  if (!Array.isArray(data?.created) || !Array.isArray(data?.skipped) ||
      !["x", "instagram"].every(platform => data.created!.includes(platform) || data.skipped!.includes(platform))) {
    throw new Error("SNS下書きの作成結果を確認できませんでした。");
  }
  return `作成 ${data.created.length}件・既存 ${data.skipped.length}件。${data.review?.length ? "既存の文面・画像に差分があります。編集済みの内容は残しています。" : ""} SNS欄で確認してください。自動投稿はしていません。`;
}

const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://www.bassic.jp/";
const dailySectionIds = new Set([
  "site-settings",
  "home",
  "hero-slides",
  "events",
  "menu",
  "drink-menu-sheets",
  "party-plans",
  "equipment-rental",
  "social-notices"
]);

const publicPagePaths: Partial<Record<SectionDefinition["id"], string>> = {
  "site-settings": "/access/",
  home: "/",
  "hero-slides": "/",
  events: "/events/",
  menu: "/menu/",
  "drink-menu-sheets": "/menu/",
  "party-plans": "/party/",
  "equipment-rental": "/party/",
  "social-notices": "/"
};

const publicPageLabels: Partial<Record<SectionDefinition["id"], string>> = {
  "site-settings": "Accessページ",
  home: "TOPページ",
  "hero-slides": "TOPページ",
  events: "Event Scheduleページ",
  menu: "Menuページ",
  "drink-menu-sheets": "Menuページ",
  "party-plans": "Partyページ",
  "equipment-rental": "Partyページ",
  "social-notices": "TOPページのSNS欄"
};

function getPublicPageUrl(section: SectionDefinition) {
  const path = publicPagePaths[section.id];

  if (!path) {
    return "";
  }

  return resolvePublicUrl(path, publicSiteUrl);
}

function getPublicPageLabel(section: SectionDefinition) {
  return publicPageLabels[section.id] || "公開ページ";
}

function getPostPublishSteps(section: SectionDefinition) {
  const commonSteps = ["スマホでも同じページを確認"];
  const sectionSteps: Partial<Record<SectionDefinition["id"], string[]>> = {
    "site-settings": ["TOP、Access、Menuで営業時間・喫煙・テーブル・チャージを確認", "Accessページで住所・電話・Google Mapを確認", "電話・地図・SNSボタンが正しく開くか確認"],
    home: ["TOPページの見出し・画像・案内カードを確認", "営業時間・喫煙・チャージの表示を確認"],
    "hero-slides": ["TOPページのメイン画像を確認", "スマホでロゴや見出しと画像が重なっていないか確認"],
    events: ["Event ScheduleページとGoogle Calendar欄を確認", "イベント日は日付・START・予約方法が読めるか確認"],
    menu: ["メニューページの画像・価格・チャージ表記を確認", "フード画像を押して拡大表示を確認"],
    "drink-menu-sheets": ["メニューページのDRINK&FOOD MENU画像を確認", "クリック前と拡大表示の両方で上下が切れていないか確認"],
    "party-plans": ["Partyページのプラン名・価格・説明を確認", "スマホで料金と条件が読めるか確認"],
    "equipment-rental": ["Partyページの機材レンタル欄とPDFリンクを確認", "詳細リンクからPDFが開くか確認"],
    "social-notices": ["TOPページのSNS欄を確認", "SNSカードのタイトル・説明・ボタンリンクを確認"]
  };

  return [...(sectionSteps[section.id] || ["公開ページで変更箇所を確認"]), ...commonSteps];
}

function isImageObject(value: unknown): value is { url?: string; alt?: string } {
  return typeof value === "object" && value !== null && "url" in value;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function countTextLength(value: unknown) {
  return getString(value).replace(/\s+/g, "").length;
}

function textIncludesAll(value: unknown, terms: string[]) {
  const text = getString(value).replace(/\s+/g, "");

  return terms.every((term) => text.includes(term.replace(/\s+/g, "")));
}

function getNumber(value: unknown) {
  return typeof value === "number" ? String(value) : getString(value);
}

function getOrderNumber(value: unknown) {
  const number = Number(getNumber(value));
  return Number.isFinite(number) ? number : 0;
}

function mergeDefaults(section: SectionDefinition, item?: Draft) {
  return {
    ...section.defaults,
    ...(item || {})
  };
}

function getItemTitle(section: SectionDefinition, item: Draft) {
  return getString(item[section.titleKey || "title"]) || getString(item.name) || "タイトル未入力";
}

function getSelectOptionLabel(section: SectionDefinition, key: string, value: unknown) {
  const stringValue = getString(value);
  const field = section.fields.find((candidate) => candidate.key === key);

  return field?.options?.find((option) => option.value === stringValue)?.label || stringValue;
}

function getItemMeta(section: SectionDefinition, item: Draft) {
  if (section.id === "events") {
    return [getString(item.date), getString(item.startTime), getString(item.price)].filter(Boolean).join(" / ");
  }

  if (section.id === "menu" || section.id === "party-plans") {
    return getString(item.price);
  }

  if (section.id === "hero-slides") {
    const pageLabel = getSelectOptionLabel(section, "page", item.page);
    return pageLabel ? `使うページ: ${pageLabel}` : "";
  }

  if (section.id === "drink-menu-sheets") {
    return `表示順 ${getNumber(item.displayOrder) || "未入力"}`;
  }

  if (section.id === "equipment-rental") {
    return getString(item.pdfUrl) ? "PDFリンクあり" : "PDFリンク未設定";
  }

  if (section.id === "social-notices") {
    const platformLabel = getSelectOptionLabel(section, "platform", item.platform);
    return platformLabel ? `SNS種別: ${platformLabel}` : "";
  }

  return getString(item.displayOrder) ? `表示順 ${getString(item.displayOrder)}` : "";
}

function isPublished(item: Draft) {
  return item.isPublished !== false;
}

function isValidManagedUrl(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/")) {
    return !value.startsWith("//");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidManagedImageUrl(value: string) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/assets/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidManagedPdfUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(resolvePublicUrl(value, publicSiteUrl));
    const isAllowedLocation = value.startsWith("/assets/pdf/") || url.protocol === "https:";
    return isAllowedLocation && url.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function isPreviewableManagedUrl(field: FieldDefinition, value: string) {
  if (!isValidManagedUrl(value)) {
    return false;
  }

  if (field.key === "pdfUrl") {
    return isValidManagedPdfUrl(value);
  }

  return true;
}

function isFacebookEventUrl(value: string) {
  return Boolean(getFacebookEventId(value));
}

function isFacebookUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "facebook.com" || host === "m.facebook.com" || host === "mbasic.facebook.com" || host === "fb.me";
  } catch {
    return false;
  }
}

function isInstagramUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "instagram.com";
  } catch {
    return false;
  }
}

function isXUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "x.com" || host === "twitter.com";
  } catch {
    return false;
  }
}

function isGoogleMapUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "google.com" || host === "maps.google.com" || host === "maps.app.goo.gl" || host === "goo.gl";
  } catch {
    return false;
  }
}

function getUrlPreviewLabel(field: FieldDefinition) {
  if (field.key === "googleMapsUrl" || field.key === "directionsUrl") {
    return "地図を開いて確認";
  }

  if (field.key === "pdfUrl") {
    return "PDFを開いて確認";
  }

  if (field.key === "instagramUrl" || field.key === "facebookUrl" || field.key === "xUrl" || field.key === "url") {
    return "SNSを開いて確認";
  }

  return "リンクを開いて確認";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function hasEnoughPhoneDigits(value: string) {
  return value.replace(/\D/g, "").length >= 9;
}

function getSocialUrlError(platform: string, url: string) {
  if (!url) {
    return "";
  }

  if (platform === "instagram" && !isInstagramUrl(url)) {
    return "Instagramのお知らせは instagram.com のURLを入力してください。";
  }

  if (platform === "facebook" && !isFacebookUrl(url)) {
    return "Facebookのお知らせは facebook.com のURLを入力してください。";
  }

  if (platform === "x" && !isXUrl(url)) {
    return "Xのお知らせは x.com または twitter.com のURLを入力してください。";
  }

  return "";
}

function detectSocialPlatformFromUrl(url: string) {
  if (!url) {
    return "";
  }

  if (isInstagramUrl(url)) {
    return "instagram";
  }

  if (isFacebookUrl(url)) {
    return "facebook";
  }

  if (isXUrl(url)) {
    return "x";
  }

  return "";
}

function getSiteSettingsUrlError(key: string, url: string) {
  if (!url) {
    return "";
  }

  if ((key === "googleMapsUrl" || key === "directionsUrl") && !isGoogleMapUrl(url)) {
    return "Google MapのURLを入力してください。";
  }

  if (key === "instagramUrl" && !isInstagramUrl(url)) {
    return "Instagram URLは instagram.com のURLを入力してください。";
  }

  if (key === "facebookUrl" && !isFacebookUrl(url)) {
    return "Facebook URLは facebook.com のURLを入力してください。";
  }

  if (key === "xUrl" && !isXUrl(url)) {
    return "X URLは x.com または twitter.com のURLを入力してください。";
  }

  return "";
}

function isValidEventTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function isValidScheduledAt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00+09:00` : trimmed;
  return !Number.isNaN(new Date(normalized).getTime());
}

function isValidWholeNumber(value: string) {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 0;
}

function hasPriceOrInquirySignal(value: string) {
  const normalized = value.trim().toLowerCase();
  return /\d/.test(normalized) || /(時価|要問合せ|要問い合わせ|お問い合わせ|問い合わせ|応相談|ask|market price)/i.test(normalized);
}

function getFacebookEventId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "facebook.com" && host !== "m.facebook.com" && host !== "mbasic.facebook.com" && host !== "fb.me") {
      return "";
    }

    const eventsPath = url.pathname.match(/\/events\/(.+)/)?.[1] || "";
    if (!eventsPath) {
      return "";
    }

    return [...eventsPath
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)]
      .reverse()
      .find((part) => /^\d{6,}$/.test(part)) || "";
  } catch {
    return "";
  }
}

function getImageUrl(value: unknown) {
  return isImageObject(value) ? value.url || "" : getString(value);
}

function fieldHasValue(field: FieldDefinition, value: unknown) {
  if (field.type === "image") {
    return Boolean(getImageUrl(value));
  }

  if (field.type === "checkbox") {
    return typeof value === "boolean";
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getPreviewText(field: FieldDefinition, value: unknown) {
  if (field.type === "checkbox") {
    return value ? "公開する" : "下書き";
  }

  if (field.type === "image") {
    return getImageUrl(value);
  }

  return String(value ?? "");
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetchWithTimeout(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  }, url.startsWith("/api/content/") && init?.method && init.method !== "GET" ? 45000 : 12000);
  const body = (await response.json().catch(() => ({ ok: false }))) as ApiResult<T>;

  if (!response.ok || !body.ok) {
    throw new Error(body.message || "通信に失敗しました。時間をおいて再度お試しください。");
  }

  return body;
}

function NoticeBox({ notice }: { notice: Notice }) {
  const Icon = notice.tone === "error" ? AlertCircle : notice.tone === "info" ? Info : CheckCircle2;
  const helper =
    notice.tone === "error"
      ? notice.requestedAt
        ? "保存した内容はそのままです。この表示を担当者に伝えてください。"
        : "直らない場合は、表示されたメッセージを保守担当者に伝えてください。"
      : notice.tone === "info"
        ? "変更した内容は、公開を確定するまでサイトに反映されません。"
        : "反映には数分かかります。少し待ってから公開サイトを開き、再読み込みして確認してください。";

  return (
    <div className={`notice ${notice.tone}`}>
      <Icon size={20} />
      <div>
        <span>{notice.message}</span>
        {notice.tone === "error" && !notice.message.includes("入力内容は残っています") ? <small>入力内容は残っています。</small> : null}
        <details className="field-help">
          <summary>詳しく見る</summary>
          {notice.tone !== "error" || notice.requestedAt ? <small>{helper}</small> : null}
          {notice.tone === "error" ? <small className="support-note">
            このメッセージと、操作した画面のスクリーンショットを保守担当者へ送ってください。
          </small> : null}
        </details>
        {notice.confirmationSteps?.length ? (
          <ul className="notice-checklist" aria-label="公開後の確認手順">
            {notice.confirmationSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="notice-actions">
        {notice.actionsUrl ? (
          <a href={notice.actionsUrl} target="_blank" rel="noreferrer">
            担当者向けの実行ログ
          </a>
        ) : null}
        {notice.tone !== "error" ? <a href={publicSiteUrl} target="_blank" rel="noreferrer">
          公開サイトを開く
        </a> : null}
      </div>
    </div>
  );
}

function formatDeployTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}


async function requestPublication(notice: Notice): Promise<Notice> {
  if (notice.calendarOnly) {
    const { data } = await requestJson<{ actionsUrl: string; requestedAt: string; requestId: string }>("/api/calendar-sync", {
      method: "POST", body: JSON.stringify({ eventId: notice.eventDelivery?.socialEventId })
    });
    if (!data?.requestId) throw new Error("カレンダーへの登録依頼を確認できませんでした。");
    return { ...notice, ...data, tone: "success", retryPublish: false };
  }
  const { data } = await requestJson<{ actionsUrl: string; requestedAt: string; requestId: string }>("/api/deploy", {
    method: "POST",
    body: "{}"
  });
  if (!data?.requestId) throw new Error("公開依頼を確認できませんでした。");
  return { ...notice, ...data, tone: "success", retryPublish: false };
}

function DeployStatusCard({ notice, onRetry, onOpenSocialDrafts }: { notice: Notice; onRetry: (notice: Notice) => void; onOpenSocialDrafts?: (sourceId: string) => void }) {
  const [status, setStatus] = useState<PublishStatus>({ state: notice.requestId ? "pending" : "failed" });
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);
  const [retryingSocial, setRetryingSocial] = useState(false);
  const socialRetryRef = useRef(false);
  const { requestId, requestedAt } = notice;
  const problemRef = useErrorFocus<HTMLElement>(status.state === "failed" || status.state === "unconfirmed" || retryError, status.state + String(retryError));

  useEffect(() => {
    if (!requestId || !requestedAt) {
      setStatus({ state: "failed" });
      return;
    }
    if (notice.calendarOnly) { setStatus({ state: "published" }); return; }
    setStatus({ state: "pending" });
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const query = new URLSearchParams({ id: requestId, requestedAt });
    const deadline = publicationDeadline(requestedAt);

    async function poll() {
      if (!canLookUpPublication(requestedAt!)) { setStatus({ state: "unconfirmed" }); return; }
      try {
        const result = await requestJson<PublishStatus>(`/api/deploy?${query}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (result.data) {
          setStatus(result.data);
          if (result.data.state !== "pending") return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (Date.now() >= deadline) {
        setStatus((current) => ({ ...current, state: "unconfirmed" }));
        return;
      }
      timer = setTimeout(poll, 30_000);
    }

    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [requestId, requestedAt, notice.calendarOnly]);

  const presentation = notice.calendarOnly ? { label: status.state === "failed" ? "カレンダーへの登録を依頼できませんでした" : "登録内容を保存しました", message: status.state === "failed" ? "内容は保存済みです。再試行してください。" : "Googleカレンダーの登録結果を下で確認できます。", tone: status.state === "failed" ? "error" : "info" } : {
    pending: { label: "公開サイトに反映中", message: "内容は保存済みです。反映まで数分かかります。この画面は閉じても大丈夫です。", tone: "info" },
    published: { label: "公開サイトに反映されました", message: "公開サイトを開き、変更したページを確認してください。", tone: "success" },
    failed: { label: "公開サイトへの反映に失敗しました", message: "内容は保存済みです。反映だけをやり直せます。", tone: "error" },
    unconfirmed: { label: "公開サイトへの反映を確認できませんでした", message: "内容は保存済みです。公開サイトを確認し、反映されていなければ担当者へ連絡してください。", tone: "info" }
  }[status.state];
  const timeLabel = formatDeployTime(notice.requestedAt);
  const actionsUrl = status.actionsUrl || notice.actionsUrl;
  const section = sections.find((item) => item.id === notice.sectionId);
  const pageUrl = !notice.calendarOnly && section && getPublicPageUrl(section);

  async function retry() {
    if (retrying || status.state !== "failed") return;
    setRetrying(true);
    setRetryError(false);
    try {
      onRetry(await requestPublication(notice));
    } catch {
      setRetryError(true);
    } finally {
      setRetrying(false);
    }
  }

  async function retrySocial() {
    if (socialRetryRef.current || !notice.eventDelivery?.socialEventId) return;
    socialRetryRef.current = true;
    setRetryingSocial(true);
    try {
      const { data } = await requestJson<EventPublishFlowResult>("/api/event-publish-flow", {
        method: "POST", body: JSON.stringify({ eventId: notice.eventDelivery.socialEventId, platforms: ["x", "instagram"] })
      });
      onRetry({ ...notice, eventDelivery: { ...notice.eventDelivery, social: socialDraftResult(data), socialRetryNeeded: false } });
    } catch (error) {
      onRetry({ ...notice, eventDelivery: { ...notice.eventDelivery, social: error instanceof Error ? error.message : "SNS下書きの結果を確認できませんでした。", socialRetryNeeded: true } });
    } finally {
      socialRetryRef.current = false;
      setRetryingSocial(false);
    }
  }

  return (
    <section ref={problemRef} tabIndex={-1} role={status.state === "failed" ? "alert" : undefined} className={`deploy-status ${presentation.tone}${notice.calendarOnly ? " event-registration-status" : ""}`} aria-label="最後の反映状況">
      <div>
        <strong>{notice.calendarOnly ? "イベント登録" : "最後の公開操作"}</strong>
        <span>{notice.sourceLabel || "管理画面から公開"}</span>
      </div>
      <div role="status">
        <strong>{presentation.label}</strong>
        <span>{timeLabel ? `${timeLabel} に依頼。` : ""}{presentation.message}</span>
      </div>
      {notice.eventDelivery ? (
        <dl>
          <dt>Googleカレンダー</dt><dd>{notice.eventDelivery.event ? <CalendarSyncStatus event={notice.eventDelivery.event} eventId={notice.eventDelivery.socialEventId} active={notice.calendarOnly || status.state === "published"} autoEligible={isFacebookEventUrl(notice.eventDelivery.event.sourceUrl || "")} /> : notice.eventDelivery.calendar}</dd>
          <dt>SNS下書き</dt><dd>{notice.eventDelivery.social}</dd>
        </dl>
      ) : null}
      <div className="deploy-status-actions">
        {notice.eventDelivery?.socialRetryNeeded && notice.eventDelivery.socialEventId ? (
          <button className="secondary-button" type="button" disabled={retryingSocial} onClick={() => void retrySocial()}>
            {retryingSocial ? "SNS下書きを確認中…" : "SNS下書きだけをやり直す"}
          </button>
        ) : null}
        {status.state === "failed" ? (
          <button className="secondary-button" type="button" disabled={retrying} onClick={() => void retry()}>
            {retrying ? "反映を依頼中…" : "反映だけをやり直す"}
          </button>
        ) : null}
        {!notice.calendarOnly ? <a href={pageUrl || publicSiteUrl} target="_blank" rel="noreferrer">
          {pageUrl ? "変更したページを開く" : "公開サイトを開く"}
        </a> : null}
        {actionsUrl ? notice.calendarOnly ? <details className="field-help"><summary>担当者向け</summary><a href={actionsUrl} target="_blank" rel="noreferrer">実行ログ</a></details> : <a href={actionsUrl} target="_blank" rel="noreferrer">担当者向けの実行ログ</a> : null}
      </div>
      {status.state === "published" && !notice.eventDelivery?.socialRetryNeeded && notice.eventDelivery?.socialSourceId ? <EventSocialActions sourceId={notice.eventDelivery.socialSourceId} revision={notice.eventDelivery.social} onEdit={onOpenSocialDrafts ? () => onOpenSocialDrafts(notice.eventDelivery!.socialSourceId!) : undefined} /> : null}
      {retryError ? <p role="alert">反映を依頼できませんでした。この表示を担当者に伝えてください。</p> : null}
      {!notice.calendarOnly && status.state === "published" && notice.confirmationSteps?.length ? (
        <details>
          <summary>表示の確認ポイント</summary>
          <ul className="notice-checklist">
            {notice.confirmationSteps.map((step) => <li key={step}>{step}</li>)}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function SetupStatus({ health }: { health?: HealthState }) {
  if (!health) {
    return null;
  }

  const groups = [
    { key: "login", label: "ログイン" },
    { key: "save", label: "保存" },
    { key: "publish", label: "公開反映" }
  ] as const;
  const publicUrlStatus = health.publicSiteUrl;
  const publicUrlCard = publicUrlStatus ? (
    <section className={`public-url-status ${publicUrlStatus.isProduction ? "ready" : "needs-check"}`}>
      <div>
        <strong>公開サイトURL</strong>
        <span>{publicUrlStatus.message}</span>
      </div>
      <a href={publicUrlStatus.url} target="_blank" rel="noreferrer">
        {publicUrlStatus.url}
        <ExternalLink size={14} />
      </a>
    </section>
  ) : null;

  if (health.ok) {
    return (
      <div className="setup-status ready">
        <CheckCircle2 size={18} />
        <div>
          <strong>本番設定はそろっています。</strong>
          <span>ログイン、保存、公開反映の準備ができています。</span>
          {publicUrlCard}
        </div>
      </div>
    );
  }

  return (
    <div className="setup-status warning">
      <AlertCircle size={18} />
      <div>
        <strong>設定が不足しています</strong>
        <span>保存や反映の前に、担当者側の初期設定が必要です。</span>
        {publicUrlCard}
        <div className="setup-groups">
          {groups.map((group) => {
            const missingItems = health.missing.filter((item) => item.requiredFor === group.key);

            return (
              <section className={missingItems.length ? "needs-work" : "is-ready"} key={group.key}>
                <strong>{group.label}</strong>
                {missingItems.length ? (
                  <ul>
                    {missingItems.map((item) => (
                      <li key={item.key}>
                        {item.label} <code>{item.key}</code>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>設定済み</span>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OpsStatusPanel({ status, onSelect, onRetry }: { status?: OpsStatus; onSelect: (id: string) => void; onRetry?: () => void }) {
  if (status?.loadError) return <section className="notice error" role="alert"><strong>確認項目を読み込めませんでした。</strong><p>入力内容は変わっていません。もう一度確認してください。</p><button type="button" className="secondary-button" onClick={onRetry}>もう一度確認</button></section>;
  if (!status?.alerts?.length) {
    return null;
  }

  const errors = status.alerts.filter((alert) => alert.severity === "error").length;
  const warnings = status.alerts.length - errors;

  return (
    <section className="ops-status-panel" aria-label="運用アラート">
      <div className="ops-status-heading">
        <div>
          <strong>要確認</strong>
        </div>
        <small>
          エラー {errors} / 注意 {warnings}
        </small>
      </div>
      <div className="ops-alert-list">
        {status.alerts.slice(0, 8).map((alert) => (
          <button className={`ops-alert ${alert.severity}`} type="button" key={alert.id} onClick={() => onSelect(alert.sectionId)}>
            {alert.severity === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
            <span>
              <strong>{alert.title}</strong>
              <small>{alert.detail}</small>
            </span>
          </button>
        ))}
      </div>
      {status.alerts.length > 8 ? <small className="ops-alert-more">ほか {status.alerts.length - 8} 件あります。</small> : null}
    </section>
  );
}

function LoginScreen({ onLogin, health }: { onLogin: () => void; health?: HealthState }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestJson("/api/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "ログインできませんでした。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={submit}>
        <p className="eyebrow">Bassic. 管理画面</p>
        <h1>更新用パスワード</h1>
        <p className="login-copy">お店の情報を更新する専用画面です。</p>
        <SetupStatus health={health} />
        <label>
          パスワード
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="共有パスワード"
            aria-label="共有パスワード"
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
          ログイン
        </button>
      </form>
    </main>
  );
}

function DashboardSectionGroup({
  title,
  description,
  sections: groupSections,
  onSelect,
  compact = false
}: {
  title: string;
  description: string;
  sections: SectionDefinition[];
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <section className={`dashboard-group${compact ? " compact" : ""}`}>
      <div className="dashboard-group-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="dashboard-grid">
        {groupSections.map((section) => {
          const Icon = section.icon;

          return (
            <button className="dashboard-tile" key={section.id} type="button" onClick={() => onSelect(section.id)}>
              <Icon size={30} />
              <strong>{section.shortTitle}</strong>
              <span>{section.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Field({
  field,
  value,
  error,
  onChange,
  hideLabel = false,
  imageUrlOnly = false
}: {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  hideLabel?: boolean;
  imageUrlOnly?: boolean;
}) {
  const common = {
    id: field.key,
    name: field.key,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${field.key}-error` : undefined
  };
  const urlValue = field.type === "url" ? getString(value).trim() : "";
  const canPreviewUrl = Boolean(urlValue) && isPreviewableManagedUrl(field, urlValue);

  if (field.type === "hidden") {
    return null;
  }

  return (
    <div className={`field field-${field.type}`}>
      <label htmlFor={field.key} className={hideLabel ? "sr-only" : undefined}>
        {field.label}
        {field.required ? <b>必須</b> : null}
      </label>
      {field.type === "textarea" ? (
        <textarea
          {...common}
          rows={field.rows || 4}
          value={getString(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      {field.key === "pdfUrl" ? <PdfField id={field.key} value={getString(value)} onChange={onChange} /> : null}
      {field.key !== "pdfUrl" && ["text", "url", "date", "number"].includes(field.type) ? (
        <input
          {...common}
          type={field.type === "number" ? "number" : field.type}
          value={field.type === "number" ? getNumber(value) : getString(value)}
          onChange={(event) => onChange(field.type === "number" ? Number(event.target.value || 0) : event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      {canPreviewUrl && field.key !== "pdfUrl" ? (
        <a className="field-link-check" href={urlValue} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          {getUrlPreviewLabel(field)}
        </a>
      ) : null}
      {field.type === "select" ? (
        <select {...common} value={getString(value)} onChange={(event) => onChange(event.target.value)}>
          {(field.options || []).map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      {field.type === "checkbox" ? (
        <span className="toggle-row">
          <input
            {...common}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          {Boolean(value) ? `${field.label} ON` : `${field.label} OFF`}
        </span>
      ) : null}
      {field.key === "isPublished" ? (
        <small className="field-publish-help">
          ON：掲載 ／ OFF：非公開
        </small>
      ) : null}
      {field.type === "image" ? <div id={field.key}><ImageField value={value} onChange={onChange} urlOnly={imageUrlOnly} /></div> : null}
      {field.hint ? <details className="field-help"><summary>入力のヒント</summary><p>{field.hint}</p></details> : null}
      {error ? <small id={`${field.key}-error`} className="form-error">{error}</small> : null}
    </div>
  );
}

function getFieldSummaryValue(section: SectionDefinition, field: FieldDefinition, value: unknown) {
  if (field.type === "checkbox") {
    return Boolean(value) ? "ON" : "OFF";
  }

  if (field.type === "image") {
    const imageUrl = getImageUrl(value);
    if (!imageUrl) {
      return "画像なし";
    }

    const imageName = imageUrl.split("/").filter(Boolean).pop() || imageUrl;
    return `画像あり: ${imageName}`;
  }

  if (field.type === "select") {
    return getSelectOptionLabel(section, field.key, value) || "未選択";
  }

  const text = field.type === "number" ? getNumber(value) : getString(value).trim();

  if (!text) {
    return "表示内容なし";
  }

  return field.type !== "textarea" && text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

function EditableFieldCard({ section, field, value, fallbackValue, error, onChange }: {section:SectionDefinition;field:FieldDefinition;value:unknown;fallbackValue?:unknown;error?:string;isEditing:boolean;onEdit:()=>void;onClose:()=>void;onChange:(value:unknown)=>void}) {
 const [changed,setChanged]=useState(false);
 if(field.type==='hidden')return null;
 const current=changed?value:fieldHasValue(field,value)?value:fallbackValue??value;
 return <section className={`editable-field-card editing${error?' has-error':''}`} aria-label={getFieldSummaryValue(section,field,current)}><div className="editable-field-heading"><span>{field.label}{field.required?<b>必須</b>:null}</span></div><Field field={field} value={current} error={error} imageUrlOnly={section.id === "events" || section.id === "social-notices"} hideLabel onChange={next=>{setChanged(true);onChange(next);}}/></section>;
}

function ImageField({ value, onChange, urlOnly = false }: { value: unknown; onChange: (value: unknown) => void; urlOnly?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const image = isImageObject(value) ? value : { url: getString(value) };
  const url = image.url || "";
  const latestImage = useRef(image);
  latestImage.current = image;
  const uploadRequest = useRef<AbortController | null>(null);
  useEffect(() => () => {
    uploadRequest.current?.abort();
    uploadRequest.current = null;
  }, []);
  const trimmedUrl = url.trim();
  const canPreviewImageUrl = Boolean(trimmedUrl) && isValidManagedImageUrl(trimmedUrl);

  function removeImage() {
    if (!window.confirm("この画像を外しますか？確定するまでは反映されません。")) {
      return;
    }

    onChange(undefined);
  }

  async function upload(file: File) {
    if (uploadRequest.current) return;
    const controller = new AbortController();
    uploadRequest.current = controller;
    const originalUrl = url;
    setUploading(true);
    setError("");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetchWithTimeout("/api/media", {
        method: "POST",
        body: formData,
        signal: controller.signal
      }, 30000);
      const result = (await response.json()) as ApiResult<{ url: string }>;

      if (!response.ok || !result.ok || !result.data?.url) {
        throw new Error(result.message || "画像をアップロードできませんでした。");
      }

      if (controller.signal.aborted) return;
      if ((latestImage.current.url || "") !== originalUrl) {
        setUploadMessage("アップロード中に画像URLが変更されたため、入力したURLを残しました。アップロード画像を使う場合は、もう一度選んでください。");
        return;
      }

      onChange({ url: result.data.url, alt: latestImage.current.alt || "" });
      setUploadMessage("画像をアップロードしました。まだ公開サイトには反映されていません。画像を開いて確認し、内容を確認してください。");
    } catch (uploadError) {
      if (controller.signal.aborted) return;
      setError(uploadError instanceof Error ? uploadError.message : "画像をアップロードできませんでした。");
    } finally {
      if (uploadRequest.current === controller) {
        uploadRequest.current = null;
        setUploading(false);
      }
    }
  }

  return (
    <div className="image-field">
      {url ? (
        <div className="image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {urlOnly ? <span className="image-url-ready">画像URLあり</span> : <AdminImage src={url} alt={image.alt || ""} />}
          <button type="button" aria-label="この画像を外す" onClick={removeImage}>
            <X size={16} />
            画像を外す
          </button>
        </div>
      ) : (
        <div className="image-empty">画像はまだ選ばれていません。</div>
      )}
      <div className="image-controls">
        <label>
          画像URL
          <input type="url" value={url} onChange={(event) => onChange({ ...image, url: event.target.value })} placeholder="https://..." />
          {canPreviewImageUrl ? (
            <a className="field-link-check" href={trimmedUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              画像を開いて確認
            </a>
          ) : null}
        </label>
        <label>
          画像の説明
          <input
            type="text"
            value={image.alt || ""}
            onChange={(event) => onChange({ ...image, alt: event.target.value })}
            placeholder="例: ライヴ会場のステージ"
          />
          <small className="field-hint">読み上げ用の短い説明</small>
        </label>
        <label className="upload-button">
          {uploading ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
          画像を選ぶ
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";

              if (file) {
                void upload(file);
              }
            }}
          />
        </label>
      </div>
      <details className="field-help"><summary>画像の選び方</summary><p>画像はアップロードするか、https:// または /assets/ から始まるURLを入れてください。公開前に「画像を開いて確認」で正しい画像を確認します。横長画像は1600px以上がおすすめです。</p></details>
      {uploadMessage ? <small className="form-success">{uploadMessage}</small> : null}
      {error ? <small className="form-error">{error}</small> : null}
    </div>
  );
}

function RequiredProgress({ section, draft }: { section: SectionDefinition; draft: Draft }) {
  const requiredFields = section.fields.filter((field) => field.required);

  if (!requiredFields.length) {
    return null;
  }

  const completed = requiredFields.filter((field) => fieldHasValue(field, draft[field.key])).length;
  const remaining = requiredFields.length - completed;
  const missingFields = requiredFields.filter((field) => !fieldHasValue(field, draft[field.key]));

  return (
    <div className={`required-progress ${remaining === 0 ? "complete" : ""}`}>
      <strong>必須 {completed}/{requiredFields.length} 入力済み</strong>
      <span>{remaining === 0 ? "必須項目はそろっています。公開前チェックへ進めます。" : `あと${remaining}件の必須項目を入れると、プレビュー確認へ進めます。`}</span>
      {missingFields.length ? (
        <small className="missing-required-links">
          未入力:
          {missingFields.map((field) => (
            <a key={field.key} href={`#${field.key}`}>
              {field.label}
            </a>
          ))}
        </small>
      ) : null}
      {remaining === 0 ? <small>次は画面下の「掲載前に確認」を押してください。</small> : null}
    </div>
  );
}

function CurrentEditSummary({
  section,
  draft,
  dirty,
  selectedId
}: {
  section: SectionDefinition;
  draft: Draft;
  dirty: boolean;
  selectedId: string;
}) {
  const isNewListItem = section.kind === "list" && selectedId === "new";
  const hasPublishToggle = section.fields.some((field) => field.key === "isPublished");
  const itemLabel = section.kind === "list" ? (isNewListItem ? "新しく追加する項目" : getItemTitle(section, draft)) : section.shortTitle;
  const publicPageLabel = getPublicPageLabel(section);
  const publicPageUrl = getPublicPageUrl(section);

  return (
    <div className="current-edit-summary" aria-label="現在編集中の内容">
      <div>
        <span>編集中</span>
        <strong>{itemLabel}</strong>
        {publicPageUrl ? (
          <a className="current-edit-page" href={publicPageUrl} target="_blank" rel="noreferrer">
            公開後に確認するページ: {publicPageLabel}
            <ExternalLink size={13} />
          </a>
        ) : (
          <small className="current-edit-page">公開後に確認するページ: {publicPageLabel}</small>
        )}
      </div>
      <div className="current-edit-badges">
        {dirty ? <small className="dirty-pill">未保存</small> : <small className="saved-pill">保存済み</small>}
        {hasPublishToggle ? (
          <div className="current-publish-state">
            <small className={isPublished(draft) ? "status-public" : "status-draft"}>
              {isPublished(draft) ? "公開するON" : "公開するOFF"}
            </small>
            <small>{isPublished(draft) ? "公開後はサイトに表示されます" : "まだサイトには出ません"}</small>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getPublishChecklistItems(section: SectionDefinition) {
  if (section.id === "site-settings") {
    return [
      "住所、電話、営業時間が最新になっている",
      "Google MapとSNSの確認リンクを開いた",
      "喫煙、テーブル・チャージの表記に間違いがない",
      "公開後にスマホでTOP、Access、Menuを確認する"
    ];
  }

  if (section.id === "events") {
    return [
      "イベント名、日付、STARTに間違いがない",
      "料金、予約方法、出演者を確認した",
      "FacebookイベントURLや画像は確認リンクで開けた",
      "公開後にスマホのEvent Scheduleを確認する"
    ];
  }

  if (section.id === "menu") {
    return ["フード名、料金、写真に間違いがない", "売り切れや季節メニューは下書きにした", "公開後にスマホのメニューページで確認する"];
  }

  if (section.id === "drink-menu-sheets") {
    return ["ドリンク表の画像が切れていない", "画像を開いて文字が読めるか確認した", "公開後にスマホで拡大表示も確認する"];
  }

  if (section.id === "party-plans") {
    return [
      "料金、人数、条件が古くない",
      "説明は12文字以上で、料金・人数・利用内容が分かる",
      "公開後にスマホのPartyページで確認する"
    ];
  }

  if (section.id === "equipment-rental") {
    return ["料金、条件が古くない", "PDFリンクを開いて確認した", "公開後にスマホのPartyページで確認する"];
  }

  if (section.id === "social-notices") {
    return [
      "タイトル6文字以上、説明10文字以上で内容が伝わる",
      "SNS種別に間違いがない",
      "選んだSNSとリンクURLの種類が合っている",
      "リンクを開いて正しい投稿やページを確認した",
      "公開後にスマホのTOPページでSNS欄を確認する"
    ];
  }

  if (section.id === "custom-sections") {
    return ["タイトル6文字以上、本文20文字以上で内容が伝わる", "URLや画像は確認リンクで開けた", "公開後にスマホでも表示を確認する"];
  }

  return ["内容、料金、日付に間違いがない", "URLや画像は確認リンクで開けた", "公開後にスマホでも表示を確認する"];
}

function getEditorFocusTips(section: SectionDefinition) {
  if (section.id === "site-settings") {
    return ["営業時間、喫煙、テーブル・チャージは来店判断に直結します。", "Google MapとSNS URLは、入力後に確認リンクを開いてください。"];
  }

  if (section.id === "home") {
    return ["初めて来る人が、店の雰囲気と入りやすさをすぐ分かる文章にします。", "長い文章はスマホで読みにくいため、1文を短めにします。"];
  }

  if (section.id === "events") {
    return ["公開する前に、イベント名、日付、STARTを必ず確認してください。", "FacebookイベントURLは、イベント一覧ではなく個別イベントページのURLを入れます。"];
  }

  if (section.id === "menu") {
    return ["フードを公開する時は、名前、料金、画像の3点をそろえます。", "売り切れや季節限定で一時的に隠す時は、公開するをOFFにします。"];
  }

  if (section.id === "drink-menu-sheets") {
    return ["ドリンク表は、クリック前と拡大表示の両方で文字が読める画像を使います。", "差し替え後は画像を開いて、上下が切れていないか確認してください。"];
  }

  if (section.id === "party-plans" || section.id === "equipment-rental") {
    return ["料金、人数、条件が古くないか確認します。", "PDFや問い合わせ先を入れた場合は、リンクを開いて確認してください。"];
  }

  if (section.id === "social-notices") {
    return ["Instagram、Facebook、Xの種類とリンクURLが合っているか確認します。", "自動タイムラインではなく、見てほしい投稿やページへのお知らせカードとして使います。"];
  }

  return ["公開する内容が、誰に何を伝えるものか分かる文章にします。", "URLや画像を入れた場合は、公開前に確認リンクを開きます。"];
}

function EditorFocusTips({ section }: { section: SectionDefinition }) {
  const tips = getEditorFocusTips(section);

  if (!tips.length) {
    return null;
  }

  return (
    <details className="edit-focus-tips" aria-label="編集前に見るポイント">
      <summary>先に見るポイント</summary>
      <ul>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </details>
  );
}

function isMobileAppearanceField(key: string) {
  return key === "mobileImage" || key === "mobilePosition" || key === "heroMobileTitle" || key.endsWith("MobilePosition");
}

function ActualDraftPreview({draft,section,onReady,pathOverride}:{draft:Draft;section:SectionDefinition;onReady:(ready:boolean)=>void;pathOverride?:string}) {
 const [document,setDocument]=useState<{html:string;url:string}>(),[error,setError]=useState('');
 const page=section.id==='hero-slides'?getString(draft.page):section.id==='page-copy'?getString(draft.page):'';
 const path=pathOverride||(page?({home:'/',events:'/events/',menu:'/menu/',party:'/party/',access:'/access/'} as Record<string,string>)[page]||'/':new URL(getPublicPageUrl(section)||publicSiteUrl).pathname);
 useEffect(()=>{const controller=new AbortController();onReady(false);void fetch('/api/visual-editor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path,sectionId:section.id,draft}),signal:controller.signal}).then(async response=>{const result=await response.json();if(!response.ok||!result.ok)throw Error(result.message||'プレビューを取得できませんでした。');if(!controller.signal.aborted){setDocument(result.data);onReady(true);}}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[path,section.id,draft,onReady]);
 return error?<p role="alert">{error} 入力内容は残っています。戻って再試行してください。</p>:document?<PublicPageCanvas path={path} title="変更後・未掲載" document={document} targets={[]} onSelect={()=>{}}/>:<p role="status">変更後のページを読み込み中</p>;
}

function EventRegistrationReview({ draft, onClose, onPublish }: { draft: Draft; onClose: () => void; onPublish: () => void }) {
  const date = getString(draft.date).slice(0,10);
  const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(date + "T00:00:00+09:00")) : date;
  const rows = [["イベント名", getString(draft.title)], ["日付", dateLabel], ["開始時刻", getString(draft.startTime)], ["開場", getString(draft.openTime)], ["終了時刻", getString(draft.endTime) || "未定（カレンダーは仮の2時間枠）"], ["出演者", getString(draft.performers)], ["料金", getString(draft.price)], ["予約", getString(draft.reservation)]];
  const image = getImageUrl(draft.image);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="イベントの登録内容を確認"><div className="preview-modal event-registration-review">
    <div className="modal-heading"><h2>この内容で登録します</h2><button className="icon-button" type="button" aria-label="閉じる" onClick={onClose}><X size={20}/></button></div>
    <p>Googleカレンダーに登録し、X・Instagram用の文面を用意します。</p>
    <dl className="preview-list">{rows.filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>イベント画像</dt><dd>{image ? <a href={resolvePublicUrl(image,publicSiteUrl)} target="_blank" rel="noreferrer">画像を開いて確認</a> : "画像なし"}</dd></div></dl>
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>戻って直す</button><button className="primary-button" type="button" onClick={onPublish}>この内容で登録</button></div>
  </div></div>;
}

function PreviewModal({
  draft,
  section,
  onClose,
  onPublish,
  pathOverride
}: {
  draft: Draft;
  section: SectionDefinition;
  previewContext?: Draft;
  onClose: () => void;
  onPublish: () => void;
  pathOverride?:string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [previewReady,setPreviewReady]=useState(false);
  const hasPublishToggle = section.fields.some((field) => field.key === "isPublished");
  const publishToggleOff = hasPublishToggle && !Boolean(draft.isPublished);
  const sectionPublicUrl = getPublicPageUrl(section);
  const publicPageLabel = getPublicPageLabel(section);
  const postPublishSteps = getPostPublishSteps(section);

  if (section.id === "events") return <EventRegistrationReview draft={draft} onClose={onClose} onPublish={onPublish} />;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="preview-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{section.title}</h2>
            <p>まず見た目を確認して、問題なければ公開します。</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <ActualDraftPreview draft={draft} section={section} onReady={setPreviewReady} pathOverride={pathOverride} />
        <details><summary>入力内容を確認</summary><dl className="preview-list">
          {section.fields.filter((field) => field.type !== "hidden").map((field) => {
            const value = draft[field.key];
            const text = getPreviewText(field, value);
            const imageUrl = field.type === "image" ? text : "";
            const linkUrl = field.type === "url" ? text : "";

            return (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  {imageUrl ? (
                    <span className="preview-image-value">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="" />
                      <span>{imageUrl}</span>
                    </span>
                  ) : linkUrl ? (
                    <a className="preview-link" href={linkUrl} target="_blank" rel="noreferrer">
                      {linkUrl}
                    </a>
                  ) : (
                    text || "未入力"
                  )}
                </dd>
              </div>
            );
          })}
        </dl></details>
        {publishToggleOff ? (
          <div className="preview-warning" role="status">
            <AlertCircle size={18} />
            <span>「公開する」がOFFです。このまま公開しても公開サイトには表示されません。サイトに出す場合は戻って「公開する」をONにしてください。</span>
          </div>
        ) : null}
        <div className="publish-checklist" aria-label="公開前の確認">
          <strong>公開前に確認</strong>
          <ul>
            {getPublishChecklistItems(section).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {sectionPublicUrl ? (
            <a className="preview-public-link" href={sectionPublicUrl} target="_blank" rel="noreferrer">
              確認するページを開く: {publicPageLabel}
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <div className="publish-checklist" aria-label="公開後の確認">
          <strong>公開後に見るところ</strong>
          <ul>
            {postPublishSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {sectionPublicUrl ? (
            <a className="preview-public-link post-publish-link" href={sectionPublicUrl} target="_blank" rel="noreferrer">
              公開後に開くページ: {publicPageLabel}
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
        <label className="publish-confirmation">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>入力内容、画像、リンク先、公開後の確認項目を見ました。</span>
        </label>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            戻って直す
          </button>
          <button className="primary-button" type="button" disabled={!confirmed || !previewReady} onClick={onPublish}>
            <CheckCircle2 size={18} />
            {publishToggleOff ? "保存して反映（この項目は非表示）" : "サイトに掲載"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorGuide({ section, dirty, selectedId }: { section: SectionDefinition; dirty: boolean; selectedId: string }) {
  const isNewListItem = section.kind === "list" && selectedId === "new";
  const sectionPublicUrl = getPublicPageUrl(section);
  const publicPageLabel = getPublicPageLabel(section);

  return (
    <section className="editor-guide" aria-label="編集の進め方">
      <div>
        <strong>1. 必要な欄だけ編集</strong>
        <span>{section.kind === "list" ? (isNewListItem ? "新しく追加する内容を入れます。" : "選んだ項目だけ直します。") : "編集ボタンから直します。"}</span>
      </div>
      <div>
        <strong>2. 見え方を確認</strong>
        <span>「掲載前に確認」でPC・スマホの表示を確認します。</span>
      </div>
      <div>
        <strong>3. 公開を確定</strong>
        <span>{dirty ? "変更はまだ公開されていません。移動すると入力内容が消えます。" : "確認画面で確定するまで、公開サイトは変わりません。"}</span>
      </div>
      {sectionPublicUrl ? (
        <div className="public-page-guide">
          <strong>公開ページ</strong>
          <span>{publicPageLabel}を確認できます。</span>
          <a href={sectionPublicUrl} target="_blank" rel="noreferrer">
            公開ページを開く
            <ExternalLink size={14} />
          </a>
        </div>
      ) : null}
    </section>
  );
}


function ValidationSummary({ errors, section, onSelect }: { errors: Record<string, string>; section: SectionDefinition; onSelect: (key: string) => void }) {
  const entries = Object.entries(errors);

  if (!entries.length) {
    return null;
  }

  return (
    <section className="validation-summary" aria-label="直す項目">
      <AlertCircle size={18} />
      <div>
        <strong>要確認：{entries.length}項目</strong>
        <ul>
          {entries.map(([key, message]) => {
            const label = section.fields.find((field) => field.key === key)?.label || key;

            return (
              <li key={key}>
                <a href={`#${key}`} onClick={(event) => { event.preventDefault(); onSelect(key); }}>{label}</a>
                <small>{message}</small>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function SocialNoticeUrlGuide({ draft }: { draft: Draft }) {
  const platform = getString(draft.platform) || "instagram";
  const currentUrl = getString(draft.url).trim();
  const currentUrlError = getSocialUrlError(platform, currentUrl);
  const guides: Record<string, { label: string; example: string; note: string; titleExample: string; descriptionExample: string }> = {
    instagram: {
      label: "Instagram",
      example: "https://www.instagram.com/bassic_official/",
      note: "プロフィールURLか、見せたい投稿を開いた時のURLを入れます。",
      titleExample: "Instagramで店内写真を更新中",
      descriptionExample: "イベント告知、料理、店内の雰囲気は公式Instagramで確認できます。"
    },
    facebook: {
      label: "Facebook",
      example: "https://www.facebook.com/bar.Bassic/",
      note: "Facebookページか、見せたい投稿・イベントを開いた時のURLを入れます。",
      titleExample: "Facebookでイベント投稿を確認",
      descriptionExample: "ライヴ、DJ、イベント告知などをFacebookでも更新しています。"
    },
    x: {
      label: "X",
      example: "https://x.com/bar_Bassic",
      note: "Xアカウントか、見せたい投稿を開いた時のURLを入れます。",
      titleExample: "Xでイベント告知・営業情報を確認",
      descriptionExample: "当日の営業情報やイベント告知はXでも確認できます。"
    }
  };
  const guide = guides[platform] || guides.instagram;

  return (
    <section className="social-notice-url-guide" aria-label="SNSお知らせURLの入力例">
      <Info size={18} />
      <div>
        <strong>{guide.label}のURLを入力してください</strong>
        <span>URLを貼るとSNS種別を自動で合わせます。</span>
        <span>{guide.note}</span>
        <code>{guide.example}</code>
        <div className="social-notice-writing-example" aria-label="TOPページに表示される文言例">
          <b>TOPページに出る文言例</b>
          <span>タイトル: {guide.titleExample}</span>
          <span>説明: {guide.descriptionExample}</span>
        </div>
        {currentUrl ? (
          <small className={currentUrlError ? "form-error" : "form-success"}>
            {currentUrlError || "選んだSNSとURLの種類は合っています。公開前に「SNSを開いて確認」でリンク先を見てください。"}
          </small>
        ) : (
          <small>リンクURLを入れると、SNSの種類が合っているかここに表示します。タイトルと説明はTOPページのカードにそのまま出ます。</small>
        )}
      </div>
    </section>
  );
}

function FacebookEventImportPanel({ draft, onApply, sourceField, children }: {
  draft: Draft;
  onApply: (values: Draft, existing?: Draft) => void;
  sourceField: ReactNode;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<FacebookEventPreview | null>(null);
  const sourceUrl = getString(draft.sourceUrl).trim();
  const importSourceRef = useRef(sourceUrl);
  importSourceRef.current = sourceUrl;
  const importBusyRef = useRef(false);
  useEffect(() => {
    if (!preview || getFacebookEventId(preview.sourceUrl) !== getFacebookEventId(sourceUrl)) {
      setPreview(null);
      setMessage("");
    }
    // Canonicalizing the same Facebook ID must preserve the import result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);
  const isFacebookEvent = isFacebookEventUrl(sourceUrl);
  const missingRequired = [["イベント名", getString(draft.title)], ["日付", getString(draft.date)], ["開始時刻", isValidEventTime(getString(draft.startTime)) ? "valid" : ""]].filter(([, value]) => !value).map(([label]) => label);
  const currentMessage = preview && !preview.existingEvents?.length ? missingRequired.length ? `未入力：${missingRequired.join("・")}` : "内容を確認して登録できます。" : message;
  async function importEvent() {
    if (importBusyRef.current) return;
    importBusyRef.current = true;
    const requestedSource = sourceUrl;
    setLoading(true);
    setMessage("");
    setPreview(null);

    try {
      const result = await requestJson<FacebookEventPreview>("/api/facebook-event-preview", {
        method: "POST",
        body: JSON.stringify({ url: sourceUrl })
      });
      const data = result.data;
      if (importSourceRef.current !== requestedSource) return;

      if (!data) {
        throw new Error("読み取れませんでした。");
      }

      const nextValues: Draft = {
        sourceId: data.sourceId,
        sourceType: "facebook",
        sourceUrl: data.sourceUrl || sourceUrl
      };

      if (data.title) {
        nextValues.title = data.title;
      }

      if (data.date) {
        nextValues.date = data.date;
      }

      if (data.startTime && isValidEventTime(data.startTime)) nextValues.startTime = data.startTime;

      if (data.endTime && isValidEventTime(data.endTime)) nextValues.endTime = data.endTime;

      if (data.imageUrl) {
        nextValues.image = { url: data.imageUrl, alt: data.title || "Facebookイベント画像" };
      }

      setPreview(data);
      const existing = data.existingEvents || [];
      if (!existing.length) onApply(nextValues);
      const missing = [["イベント名", data.title], ["日付", data.date], ["START", data.startTime], ["画像", data.imageUrl]]
        .filter(([, value]) => !value).map(([label]) => label);
      setMessage(existing.length > 1 ? "同じFacebookイベントが複数登録されています。保守担当者に確認してください。"
        : missing.length ? `取得できなかった項目は ${missing.join("・")} です。この枠内で入力してください。`
        : "読み取りました。公開前にイベント名・日付・START・画像を確認してください。");
    } catch (error) {
      if (importSourceRef.current !== requestedSource) return;
      setMessage(error instanceof Error ? error.message : "Facebookから読み取れませんでした。手入力してください。");
    } finally {
      importBusyRef.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="facebook-import-panel event-edit-panel" aria-label="Facebookイベント取り込み">
      <section aria-label="1 FacebookのURLを貼る">
        <h2 className="event-entry-heading">イベント内容</h2>
        {sourceField}
        <button className="secondary-button" type="button" disabled={!isFacebookEvent || loading} onClick={() => void importEvent()}>
          {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          Facebookから読み取る
        </button>
        <small>URLがなくても、この下から手入力できます。</small>
      </section>
      {currentMessage ? <p role="status" className="import-message">{currentMessage}</p> : null}
      {preview?.existingEvents?.length === 1 ? <div className="existing-event-choice">
        <strong>登録済み：{getString(preview.existingEvents[0].title)}</strong>
        <button type="button" className="secondary-button" onClick={() => onApply({
          sourceId: preview.sourceId, sourceType: "facebook", sourceUrl: preview.sourceUrl,
          ...(preview.title ? { title: preview.title } : {}),
          ...(preview.date ? { date: preview.date } : {}),
          ...(preview.startTime && isValidEventTime(preview.startTime) ? { startTime: preview.startTime } : {}),
          ...(preview.endTime && isValidEventTime(preview.endTime) ? { endTime: preview.endTime } : {}),
          ...(preview.imageUrl ? { image: { url: preview.imageUrl, alt: preview.title || "Facebookイベント画像" } } : {})
        }, preview.existingEvents![0])}>登録済みのイベントを編集</button>
      </div> : null}
      <p className="event-edit-caption">この枠内で確認・修正してください。開始時刻は必須です。</p>
      {children}
    </section>
  );
}

function buildSocialDraftPreview(preview: FacebookEventPreview, platform: "instagram" | "x") {
  const dateLine = preview.date || preview.startTime ? `${preview.date}${preview.startTime ? ` START ${preview.startTime}` : ""}` : "";

  if (platform === "x") {
    return ["Bassic. Event", preview.title, dateLine, preview.sourceUrl, "#Bassic #福岡 #天神 #親不孝通り"]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "public bar Bassic. event information",
    preview.title,
    dateLine,
    preview.description,
    preview.sourceUrl ? `詳細: ${preview.sourceUrl}` : "",
    "#Bassic #福岡 #天神 #親不孝通り"
  ]
    .filter(Boolean)
    .join("\n\n");
}

function FacebookEventSocialDraftPanel() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<FacebookEventPreview | null>(null);
  const [message, setMessage] = useState("");
  const trimmedUrl = url.trim();
  const isValidFacebookEvent = isFacebookEventUrl(trimmedUrl);
  const canCreateDrafts = Boolean(preview?.title && preview.date && preview.startTime && preview.sourceUrl);
  const instagramNeedsImage = Boolean(preview && !preview.imageUrl);

  async function loadPreview() {
    setLoading(true);
    setMessage("");
    setPreview(null);

    try {
      const result = await requestJson<FacebookEventPreview>("/api/facebook-event-preview", {
        method: "POST",
        body: JSON.stringify({ url: trimmedUrl })
      });

      if (!result.data) {
        throw new Error("Facebookイベントを読み取れませんでした。");
      }

      setPreview(result.data);
      setMessage("Facebookイベントを読み取りました。内容を確認して、X / Instagramの下書きを作成できます。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Facebookイベントを読み取れませんでした。");
    } finally {
      setLoading(false);
    }
  }

  async function createDrafts() {
    if (!preview) {
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const result = await requestJson<EventPublishFlowResult>("/api/event-publish-flow", {
        method: "POST",
        body: JSON.stringify({
          allowDraftCreation: true,
          platforms: ["instagram", "x"],
          event: {
            title: preview.title,
            date: preview.date,
            startTime: preview.startTime,
            endTime: preview.endTime,
            sourceUrl: preview.sourceUrl,
            sourceId: preview.sourceId,
            sourceType: "facebook",
            image: preview.imageUrl ? { url: preview.imageUrl, alt: preview.title || "Facebook event image" } : undefined,
            performers: preview.description
          }
        })
      });
      const created = result.data?.created || [];
      const skipped = result.data?.skipped || [];
      const createdLabel = created.length ? `作成: ${created.join(", ")}` : "新しく作成された下書きはありません";
      const skippedLabel = skipped.length ? ` / 既存: ${skipped.join(", ")}` : "";
      const review = result.data?.review?.length ? " 既存の文面や画像に差分があります。SNS欄で確認してください。" : "";
      setMessage(`${createdLabel}${skippedLabel}。SNS欄で内容を確認してから投稿してください。${review}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SNS下書きの作成に失敗しました。");
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="sns-draft-panel" aria-label="FacebookイベントからSNS下書きを作る">
      <div className="sns-draft-heading">
        <div>
          <span>SNS Draft</span>
          <strong>FacebookイベントからX / Instagram下書きを作る</strong>
          <p>Facebookイベントページを読み取り、SNS投稿用の文章と画像リンクを下書きとして保存します。投稿前にSNS欄で確認できます。</p>
        </div>
      </div>
      <div className="sns-draft-form">
        <label>
          FacebookイベントURL
          <input
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.facebook.com/events/1234567890/"
          />
        </label>
        <button className="secondary-button" type="button" disabled={!isValidFacebookEvent || loading} onClick={() => void loadPreview()}>
          {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          読み取る
        </button>
      </div>
      {trimmedUrl && !isValidFacebookEvent ? (
        <small className="form-error">個別のFacebookイベントURLを入力してください。</small>
      ) : null}
      {message ? <small className={preview ? "form-success" : "form-error"}>{message}</small> : null}
      {preview ? (
        <div className="sns-draft-preview">
          <div className="sns-draft-event">
            {preview.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.imageUrl} alt={preview.title || "Facebook event image"} />
            ) : (
              <div className="sns-draft-image-missing">画像なし</div>
            )}
            <div>
              <strong>{preview.title || "タイトル未取得"}</strong>
              <span>{preview.date ? `${preview.date}${preview.startTime ? ` START ${preview.startTime}` : ""}` : "日付・STARTを確認してください"}</span>
              <small>{preview.sourceUrl}</small>
            </div>
          </div>
          {instagramNeedsImage ? (
            <div className="facebook-import-date-warning" role="status">
              <AlertCircle size={16} />
              <span>Instagram下書きは作成できますが、投稿には画像URLが必要です。SNS欄で画像を追加してください。</span>
            </div>
          ) : null}
          <div className="sns-draft-copy-grid">
            <div>
              <strong>X下書き</strong>
              <pre>{buildSocialDraftPreview(preview, "x")}</pre>
            </div>
            <div>
              <strong>Instagram下書き</strong>
              <pre>{buildSocialDraftPreview(preview, "instagram")}</pre>
            </div>
          </div>
          <div className="sns-draft-actions">
            <button className="primary-button" type="button" disabled={!canCreateDrafts || creating} onClick={() => void createDrafts()}>
              {creating ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              X / Instagram下書きを作成
            </button>
            {!canCreateDrafts ? <small>下書き作成にはタイトル・日付・STARTが必要です。</small> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getHeroSlidePageLabel(page: string) {
  const labels: Record<string, string> = {
    home: "TOP",
    events: "イベント",
    menu: "メニュー",
    party: "Party",
    access: "Access"
  };

  return labels[page] || page || "ページ";
}

function confirmLeavingEditor(dirty: boolean, busy: boolean) {
  if (busy) return false;
  return !dirty || window.confirm(
    "保存していない変更があります。移動すると入力内容が消えます。残したい場合は「キャンセル」して、内容を確認して確定してください。"
  );
}

function SectionEditor({
  sectionId,
  initialDraft,
  homeGroup,
  fieldKeys,
  itemId,
  editLabel,
  previewContext,
  sourcePage,
  eventEntry = false,
  relatedEventId,
  onOpenSocialDrafts,
  onBack,
  onEditorState,
  onDeployNotice
}: {
  sectionId: string;
  initialDraft?: Draft;
  homeGroup?: keyof typeof homeFieldGroups;
  fieldKeys?: readonly string[];
  itemId?: string;
  editLabel?: string;
  previewContext?: Draft;
  sourcePage?: string;
  eventEntry?: boolean;
  relatedEventId?: string;
  onOpenSocialDrafts: (sourceId: string) => void;
  onBack: () => void;
  onEditorState: (state: { dirty: boolean; busy: boolean }) => void;
  onDeployNotice: (notice: Notice) => void;
}) {
  const section = useMemo(() => getSection(sectionId), [sectionId]);
  const initialDraftKey = useMemo(() => JSON.stringify(initialDraft || {}), [initialDraft]);
  const scopedListPage =
    section.kind === "list" && ["hero-slides", "custom-sections", "page-copy", "page-sections"].includes(section.id)
      ? getString(initialDraft?.page).trim()
      : "";
  const initialMergedDraft = useMemo(() => mergeDefaults(section, initialDraft), [section, initialDraftKey]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [items, setItems] = useState<Array<Draft & { id?: string }>>([]);
  const [selectedId, setSelectedId] = useState<string>("object");
  const [draft, setDraft] = useState<Draft>(initialMergedDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const feedbackRef = useErrorFocus<HTMLDivElement>(notice?.tone === "error", notice);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [eventPeriod,setEventPeriod]=useState("upcoming");
  const [itemStatusFilter, setItemStatusFilter] = useState<"all" | "public" | "draft">("all");
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const loadTokenRef = useRef(0);
  const userInteractedRef = useRef(false);
  const draftBaseRef = useRef("");
  const saveInFlightRef = useRef(false);
  const isMaintenanceSection = !dailySectionIds.has(section.id);
  const isNewListItem = section.kind === "list" && selectedId === "new";
  const listCreateLabel = section.createLabel || `${section.shortTitle}を追加`;
  function matchesRelatedEvent(item: Draft) {
    return !relatedEventId || getString(item.sourceEventId) === relatedEventId ||
      getFacebookEventId(getString(item.sourceEventUrl) || getString(item.url)) === relatedEventId;
  }

  const visibleItems = useMemo(() => {
    if (!scopedListPage) {
      return items.filter(matchesRelatedEvent);
    }

    return items.filter((item) => getString(item.page).trim() === scopedListPage);
  }, [items, scopedListPage, relatedEventId]);
  const publishedCount = useMemo(() => visibleItems.filter((item) => isPublished(item)).length, [visibleItems]);
  const draftCount = visibleItems.length - publishedCount;
  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();

    return visibleItems.filter((item) => {
      if(section.id==='events'&&eventPeriod!=='all'){const day=getString(item.date).slice(0,10);const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(eventPeriod==='upcoming'&&day&&day<today)return false;if(eventPeriod==='past'&&(!day||day>=today))return false;}

      const statusMatches =
        itemStatusFilter === "all" || (itemStatusFilter === "public" ? isPublished(item) : !isPublished(item));
      const searchableText = [getItemTitle(section, item), getItemMeta(section, item)].join(" ").toLowerCase();
      const textMatches = !query || searchableText.includes(query);

      return statusMatches && textMatches;
    });
  }, [itemSearch, itemStatusFilter, visibleItems, section, eventPeriod]);
  const editableFields = useMemo(() => {
    if (section.id === "social-notices" && relatedEventId) return section.fields.filter(field => ["postText", "image"].includes(field.key) || editingFields.has(field.key));
    if (fieldKeys) return section.fields.filter((field) => fieldKeys.includes(field.key) || editingFields.has(field.key));
    if (section.id === "hero-slides" && scopedListPage !== "home") {
      return section.fields.filter((field) => !["page", "mobileImage", "mobilePosition"].includes(field.key) || (!scopedListPage && field.key === "page") || editingFields.has(field.key));
    }
    if (section.id === "home" && homeGroup) {
      return section.fields.filter((field) => homeFieldGroups[homeGroup].some((key) => key === field.key) || editingFields.has(field.key));
    }
    if (scopedListPage) {
      return section.fields.filter((field) => field.key !== "page" || editingFields.has(field.key));
    }

    return section.fields;
  }, [section, scopedListPage, homeGroup, fieldKeys, editingFields, relatedEventId]);
  const fieldDefaults = currentFieldDefaults(section.id, draft, previewContext);
  const previewDraft = { ...draft };
  for (const field of editableFields) {
    if (!fieldHasValue(field, previewDraft[field.key]) && fieldDefaults[field.key] != null) {
      previewDraft[field.key] = fieldDefaults[field.key];
    }
  }

  function withRequiredDefaults(value: Draft): Draft {
    if (section.id !== "site-settings" && section.id !== "equipment-rental") return value;
    const result = { ...value };
    for (const field of section.fields) {
      if (field.required && !fieldHasValue(field, result[field.key]) && fieldDefaults[field.key] != null) {
        result[field.key] = fieldDefaults[field.key];
      }
    }
    return result;
  }

  function confirmDiscardChanges() {
    return confirmLeavingEditor(dirty, saving || deploying);
  }

  useEffect(() => {
    onEditorState({ dirty, busy: saving || deploying });
  }, [dirty, saving, deploying, onEditorState]);

  function draftStorageKey(id: string) {
    return `bassic-admin-draft-v1:${section.id}:${scopedListPage}:${id}`;
  }

  function draftBase(original: Draft) {
    return JSON.stringify(section.fields.map(({ key }) => original[key] ?? null));
  }

  function showStoredDraft(_id: string, original: Draft) {
    setDraft(original);
    setLastSavedAt("");
    draftBaseRef.current = draftBase(original);

  }

  async function load() {
    const loadToken = loadTokenRef.current + 1;
    loadTokenRef.current = loadToken;
    userInteractedRef.current = false;
    setLoading(true);
    setLoadFailed(false);
    setNotice(null);
    if (section.kind === "list") {
      setSelectedId("new");
      setDraft(initialMergedDraft);
    }

    try {
      const result = await requestJson<ListResponse | Draft>(`/api/content/${section.id}`);
      const data = result.data;

      if (loadToken !== loadTokenRef.current || userInteractedRef.current) {
        return;
      }

      if (section.kind === "list") {
        const contents = Array.isArray((data as ListResponse)?.contents) ? ((data as ListResponse).contents as Array<Draft & { id?: string }>) : [];
        setItems(contents);
        setItemSearch("");
        setItemStatusFilter("all");
        const scopedContents = scopedListPage
          ? contents.filter((item) => getString(item.page).trim() === scopedListPage)
          : contents.filter(matchesRelatedEvent);
        const sortedScopedContents = [...scopedContents].sort((a, b) => getOrderNumber(a.displayOrder) - getOrderNumber(b.displayOrder));
        const firstItem = itemId ? sortedScopedContents.find((item) => item.id === itemId) : sortedScopedContents[0];
        if (firstItem) {
          setSelectedId(firstItem.id || "");
          showStoredDraft(firstItem.id || "", mergeDefaults(section, firstItem));
        } else {
          setSelectedId("new");
          showStoredDraft("new", initialMergedDraft);
        }
      } else {
        showStoredDraft("object", mergeDefaults(section, { ...(data as Draft), ...(initialDraft || {}) }));
      }
      setEditingFields(new Set(eventEntry ? ["sourceUrl"] : []));
      setDirty(false);
    } catch (loadError) {
      if (loadToken !== loadTokenRef.current || userInteractedRef.current) {
        return;
      }

      setLoadFailed(true);
      setNotice({
        tone: "error",
        message: loadError instanceof Error ? loadError.message : "読み込みできませんでした。時間をおいて再度お試しください。"
      });
    } finally {
      if (loadToken === loadTokenRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id, initialDraftKey, itemId]);

  useEffect(() => {
    if (loading || loadFailed || !eventEntry) return;
    const input = document.getElementById("sourceUrl");
    if (input instanceof HTMLInputElement) {
      input.focus({ preventScroll: true });
      input.scrollIntoView({ block: "center" });
    }
  }, [loading, loadFailed, eventEntry]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty && !saving && !deploying) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, saving, deploying]);

  function updateField(key: string, value: unknown) {
    userInteractedRef.current = true;
    setDraft((current) => {
      if (section.id === "social-notices" && key === "url") {
        const detectedPlatform = detectSocialPlatformFromUrl(getString(value).trim());

        return {
          ...current,
          ...(detectedPlatform ? { platform: detectedPlatform } : {}),
          [key]: value
        };
      }

      return {
        ...current,
        [key]: value
      };
    });
    setDirty(true);
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      if (section.id === "social-notices" && key === "url") {
        delete next.platform;
      }
      return next;
    });
  }

  useEffect(() => {
    if (section.id !== "events" || !notice?.validation) return;
    const remaining = validate(withRequiredDefaults(draft));
    if (!Object.keys(remaining).length) setNotice(null);
    // Recheck existing errors after typing or importing; do not focus on each keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function applyImportedFacebookEvent(values: Draft, existing?: Draft) {
    if (existing) {
      const id = getString(existing.id);
      if (!id || (selectedId !== id && !confirmDiscardChanges())) return;
      if (selectedId !== id) {
        setSelectedId(id);
        setItems((current) => current.some((item) => item.id === id) ? current : [...current, { ...existing, id }]);
        showStoredDraft(id, mergeDefaults(section, existing));
      }
    } else if (selectedId !== "new") {
      if (!confirmDiscardChanges()) return;
      setSelectedId("new");
      setDraft(initialMergedDraft);
      setLastSavedAt("");
      draftBaseRef.current = draftBase(initialMergedDraft);
    }
    userInteractedRef.current = true;
    setDraft((current) => ({
      ...current,
      ...values
    }));
    setDirty(true);
    setErrors((current) => {
      const next = { ...current };
      Object.keys(values).forEach((key) => delete next[key]);
      return next;
    });
  }

  function getValidationNoticeMessage(nextErrors: Record<string, string>, fallback: string) {
    if (section.id === "events") return "下の枠内の入力欄を確認してください。";
    const labels = Object.keys(nextErrors)
      .map((key) => section.fields.find((field) => field.key === key)?.label || key)
      .slice(0, 5);

    if (!labels.length) {
      return fallback;
    }

    const suffix = Object.keys(nextErrors).length > labels.length ? " ほか" : "";
    return `${fallback} 直す項目: ${labels.join("、")}${suffix}`;
  }

  function validate(nextDraft: Draft) {
    const nextErrors: Record<string, string> = {};

    for (const field of section.fields) {
      const value = nextDraft[field.key];
      const emptyValue = !fieldHasValue(field, value);

      if (field.required && emptyValue) {
        nextErrors[field.key] = `${field.label}を入力してください。`;
        continue;
      }

      if (!emptyValue && field.type === "url" && !isValidManagedUrl(getString(value).trim())) {
        nextErrors[field.key] = `${field.label}は https:// または / から始まるURLを入力してください。`;
      }

      if (!nextErrors[field.key] && !emptyValue && field.key === "pdfUrl" && !isValidManagedPdfUrl(getString(value).trim())) {
        nextErrors[field.key] = `${field.label}は https://...pdf または /assets/pdf/...pdf のURLを入力してください。`;
      }

      if (!emptyValue && field.type === "number" && !isValidWholeNumber(getString(value))) {
        nextErrors[field.key] = `${field.label}は0以上の半角整数で入力してください。小数やマイナスは使えません。`;
      }

      if (!emptyValue && field.type === "image" && !isValidManagedImageUrl(getImageUrl(value).trim())) {
        nextErrors[field.key] = `${field.label}のURLは https:// または /assets/ から始まるURLを入力してください。`;
      }
    }

    if (section.id === "site-settings") {
      const phone = getString(nextDraft.phone).trim();
      const email = getString(nextDraft.email).trim();

      if (phone && !hasEnoughPhoneDigits(phone)) {
        nextErrors.phone = "電話番号は数字を9桁以上含めて入力してください。";
      }

      if (email && !isValidEmail(email)) {
        nextErrors.email = "メールアドレスは example@bassic.jp の形で入力してください。";
      }

      if (!textIncludesAll(nextDraft.hoursLabel, ["20:00", "1:30", "2:00", "22:30", "イベント"])) {
        nextErrors.hoursLabel =
          "通常営業時間には、20:00 OPEN / L.O. 1:30 / 2:00 CLOSE、イベントがある日は22:30から通常営業、※イベントにより異なる場合もございます、を含めてください。";
      }

      if (countTextLength(nextDraft.smokingLabel) < 8) {
        nextErrors.smokingLabel = "喫煙については、店内喫煙OK、禁煙、イベント中は禁煙など、来店前に分かる表記で入力してください。";
      }

      if (!nextErrors.smokingLabel && !textIncludesAll(nextDraft.smokingLabel, ["店内喫煙OK", "未成年", "イベント中", "禁煙"])) {
        nextErrors.smokingLabel =
          "喫煙については、店内喫煙OK、未成年の入店不可、イベント中は禁煙になる場合があることを含めてください。";
      }

      const chargeLabel = getString(nextDraft.chargeLabel).trim();
      if (chargeLabel && !hasPriceOrInquirySignal(chargeLabel)) {
        nextErrors.chargeLabel = "テーブル・チャージは 500円 / お一人様 のように料金が分かる表記にしてください。";
      }

      for (const key of ["googleMapsUrl", "directionsUrl", "instagramUrl", "facebookUrl", "xUrl"]) {
        const urlError = getSiteSettingsUrlError(key, getString(nextDraft[key]).trim());
        if (urlError) {
          nextErrors[key] = urlError;
        }
      }
    }

    const sourceType = getString(nextDraft.sourceType);
    const sourceUrl = getString(nextDraft.sourceUrl).trim();
    if (section.id === "events" && sourceUrl && (sourceType === "facebook" || isFacebookUrl(sourceUrl)) && !isFacebookEventUrl(sourceUrl)) {
      nextErrors.sourceUrl = "FacebookイベントURLは、イベント一覧ではなく個別イベントページのURLを入力してください。";
    }

    if (section.id === "events") {
      if (nextDraft.isPublished && countTextLength(nextDraft.title) < 4) {
        nextErrors.title = "公開する前に、イベント名を4文字以上で入力してください。";
      }

      if (nextDraft.isPublished && !getString(nextDraft.startTime).trim()) {
        nextErrors.startTime = "イベントを公開する前にSTARTを入力してください。";
      }

      const reservationText = getString(nextDraft.reservation).trim();
      if (nextDraft.isPublished && !reservationText && !sourceUrl) {
        nextErrors.reservation = "イベントを公開する前に、予約方法か詳細URLを入力してください。";
      }

      for (const key of ["openTime", "startTime", "endTime"]) {
        const value = getString(nextDraft[key]).trim();
        if (value && !isValidEventTime(value)) {
          nextErrors[key] = "時間は 19:00 のように半角数字と : で入力してください。OPENやSTARTの文字は不要です。";
        }
      }
    }

    if (section.id === "events" && nextDraft.isPublished && (sourceType === "facebook" || isFacebookEventUrl(sourceUrl))) {
      if (!getString(nextDraft.date).trim()) {
        nextErrors.date = "Facebookイベントを公開する前に日付を入力してください。";
      }
    }

    if (section.id === "social-notices") {
      const platform = getString(nextDraft.platform);
      const socialUrl = getString(nextDraft.url).trim();
      const isGeneratedEventQueue = Boolean(getString(nextDraft.sourceEventUrl));
      const socialUrlError = isGeneratedEventQueue ? "" : getSocialUrlError(platform, socialUrl);
      const allowedPlatforms = ["instagram", "facebook", "x"];
      if (nextDraft.isPublished && !allowedPlatforms.includes(platform)) {
        nextErrors.platform = "公開する前に、SNS種別をInstagram、Facebook、Xから選んでください。";
      }

      if (socialUrlError) {
        nextErrors.url = socialUrlError;
      }

      if (getString(nextDraft.deliveryStatus) === "approved") {
        if (countTextLength(nextDraft.postText) < 10) {
          nextErrors.postText = "SNS投稿を承認する前に、投稿文を10文字以上で入力してください。";
        }

        if (!isValidScheduledAt(getString(nextDraft.scheduledAt))) {
          nextErrors.scheduledAt = "予約投稿日時は 2026-07-01T18:00 のように入力してください。";
        }

        if (getString(nextDraft.externalPostId).trim()) {
          nextErrors.deliveryStatus = "投稿済みIDがあるお知らせは再承認できません。再投稿する場合は新しいお知らせを作ってください。";
        }
      }

      if (nextDraft.isPublished) {
        if (countTextLength(nextDraft.title) < 6) {
          nextErrors.title = "公開する前に、タイトルを6文字以上で入力してください。";
        }

        if (countTextLength(nextDraft.description) < 10) {
          nextErrors.description = "公開する前に、説明を10文字以上で入力してください。";
        }
      }
    }

    if (section.id === "menu" && nextDraft.isPublished) {
      const price = getString(nextDraft.price).trim();

      if (!price) {
        nextErrors.price = "フードを公開する前に料金を入力してください。";
      } else if (!hasPriceOrInquirySignal(price)) {
        nextErrors.price = "料金は 1,200円、時価、お問い合わせ のように来店前に意味が分かる表記にしてください。";
      }

      if (!getImageUrl(nextDraft.image).trim()) {
        nextErrors.image = "フードを公開する前に画像を入れてください。";
      }
    }

    if (section.id === "drink-menu-sheets" && nextDraft.isPublished && !getImageUrl(nextDraft.image).trim()) {
      nextErrors.image = "ドリンクメニューを公開する前に画像を入れてください。";
    }

    if (section.id === "party-plans" && nextDraft.isPublished) {
      const price = getString(nextDraft.price).trim();

      if (!price) {
        nextErrors.price = "公開する前に、料金を入力してください。";
      } else if (!hasPriceOrInquirySignal(price)) {
        nextErrors.price = "料金は 4,000円〜 / 1名、応相談、お問い合わせ のように意味が分かる表記にしてください。";
      }

      if (countTextLength(nextDraft.title) < 4) {
        nextErrors.title = "公開する前に、プラン名を4文字以上で入力してください。";
      }

      if (countTextLength(nextDraft.body) < 12) {
        nextErrors.body = "公開する前に、説明を12文字以上で入力してください。";
      }
    }

    if (section.id === "equipment-rental") {
      if (countTextLength(nextDraft.title) < 6) {
        nextErrors.title = "機材レンタルの見出しは6文字以上で入力してください。";
      }

      if (countTextLength(nextDraft.body) < 20) {
        nextErrors.body = "機材レンタルの説明は20文字以上で、利用内容や注意点が分かる文章にしてください。";
      }
    }

    if (section.id === "custom-sections" && nextDraft.isPublished) {
      if (countTextLength(nextDraft.title) < 6) {
        nextErrors.title = "公開する前に、タイトルを6文字以上で入力してください。";
      }

      if (countTextLength(nextDraft.body) < 20) {
        nextErrors.body = "公開する前に、本文を20文字以上で入力してください。";
      }

      const linkLabel = getString(nextDraft.linkLabel).trim();
      const linkUrl = getString(nextDraft.linkUrl).trim();
      if (linkUrl && !linkLabel) {
        nextErrors.linkLabel = "リンクURLを使う場合は、リンクボタン名も入力してください。";
      }

      if (linkLabel && !linkUrl) {
        nextErrors.linkUrl = "リンクボタン名を使う場合は、リンクURLも入力してください。";
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  }

  function openPreview() {
    if(section.id==='social-notices'){void save();return;}
    userInteractedRef.current = true;
    const nextDraft = eventEntry ? { ...draft, isPublished: true } : draft;
    if (eventEntry) {
      setDraft(nextDraft);
      setDirty(true);
    }
    const nextErrors = validate(withRequiredDefaults(nextDraft));

    if (Object.keys(nextErrors).length) {
      setShowPreview(false);
      setEditingFields(current => new Set([...current, ...Object.keys(nextErrors)]));
      setNotice({ tone: "error", validation: true, message: getValidationNoticeMessage(nextErrors, "入力内容を直してから確認してください。") });
      return;
    }

    setNotice(null);
    setShowPreview(true);
  }

  async function save() {
    if (saveInFlightRef.current || loading || loadFailed) return;
    const nextDraft: Draft = withRequiredDefaults({
      ...draft,
      ...(scopedListPage ? { page: scopedListPage } : {})
    });
    const sourceUrl = getString(nextDraft.sourceUrl).trim();
    const preparedDraft: Draft =
      section.id === "events" && isFacebookEventUrl(sourceUrl)
        ? {
            ...nextDraft,
            sourceType: "facebook"
          }
        : nextDraft;

    if (section.id === "social-notices" && getString(preparedDraft.deliveryStatus) === "approved" && !getString(preparedDraft.approvedAt)) {
      preparedDraft.approvedAt = new Date().toISOString();
      preparedDraft.lastPublishError = "";
    }

    if(section.id==='social-notices'){preparedDraft.deliveryStatus='draft';preparedDraft.isPublished=false;preparedDraft.scheduledAt='';}
    const nextErrors = validate(preparedDraft);
    if (Object.keys(nextErrors).length) {
      setEditingFields(current => new Set([...current, ...Object.keys(nextErrors)]));
      setNotice({ tone: "error", validation: true, message: getValidationNoticeMessage(nextErrors, "入力内容を直してください。") });
      return;
    }

    saveInFlightRef.current = true;
    setSaving(true);
    setNotice(null);

    try {
      const isFallbackListItem = section.kind === "list" && preparedDraft.__isFallback === true;
      const isExistingListItem = section.kind === "list" && selectedId && selectedId !== "new" && !isFallbackListItem;
      const url = isExistingListItem ? `/api/content/${section.id}/${selectedId}` : `/api/content/${section.id}`;
      const result = await requestJson<Draft>(url, {
        method: isExistingListItem ? "PATCH" : "POST",
        body: JSON.stringify(preparedDraft)
      });
      const savedData = { ...preparedDraft, ...result.data } as Draft & { id?: string };
      const savedDraft = mergeDefaults(section, savedData);
      setDraft(savedDraft);
      draftBaseRef.current = draftBase(savedDraft);
      setDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));

      if (section.kind === "list") {
        const id = savedData.id || selectedId;
        setSelectedId(id || "new");
        setItems((current) => {
          const withoutOld = current.filter((item) => item.id !== id && item.id !== selectedId);
          return id ? [{ ...savedData, id }, ...withoutOld] : current;
        });
      }

      try {
        window.localStorage.removeItem(draftStorageKey(selectedId));
      } catch {
        // The CMS write succeeded even if the browser cannot clear its copy.
      }

      const facebookId = getFacebookEventId(getString(savedData.sourceUrl));
      if(section.id==='social-notices'){window.dispatchEvent(new Event('bassic-social-draft-saved'));setNotice({tone:'success',message:'SNS用の下書きを保存しました。投稿文をコピーして各SNSで投稿してください。'});return;}
      const eventDelivery: Notice["eventDelivery"] = section.id === "events" ? {
        socialEventId: preparedDraft.isPublished ? getString(savedData.id) : undefined,
        socialSourceId: facebookId || getString(savedData.sourceId) || getString(savedData.id),
        calendar: preparedDraft.isPublished
          ? "自動同期は未接続です。Googleカレンダー側で保存してください。"
          : "サイトを非公開にしても、カレンダーの予定は残ります。Googleカレンダー側でも変更してください。",
        social: preparedDraft.isPublished ? "下書きの作成結果は未確認です。" : "非公開のため投稿下書きの作成対象外です。",
        event: preparedDraft.isPublished ? {
          id: facebookId || getString(savedData.id), title: getString(savedData.title), date: getString(savedData.date).slice(0, 10), startTime: getString(savedData.startTime),
          syncKey: facebookId ? `facebook-${facebookId}` : getString(savedData.sourceId) ? `source-${getString(savedData.sourceId)}` : getString(savedData.sourceUrl).trim().replace(/\/$/, "") || getString(savedData.id),
          endTime: getString(savedData.endTime), openTime: getString(savedData.openTime), sourceUrl: getString(savedData.sourceUrl),
          imageUrl: getImageUrl(savedData.image) ? resolvePublicUrl(getImageUrl(savedData.image), publicSiteUrl) : "",
          performers: getString(savedData.performers), price: getString(savedData.price), reservation: getString(savedData.reservation)
        } : undefined
      } : undefined;
      setDeploying(true);
      setNotice({ tone: "info", message: section.id === "events" ? "カレンダーへの登録を依頼しています。" : "保存しました。サイトへの反映を依頼しています。" });

      const publishNotice: Notice = {
        tone: "error",
        message: "内容は保存済みです。公開サイトへの反映だけをやり直せます。",
        retryPublish: true,
        calendarOnly: section.id === "events" && Boolean(preparedDraft.isPublished),
        eventDelivery,
        sectionId: section.id,
        requestedAt: new Date().toISOString(),
        sourceLabel: section.id === "events" ? "Googleカレンダーへの登録" : `${section.shortTitle}を公開`,
        confirmationSteps: getPostPublishSteps(section)
      };
      const publishing = requestPublication(publishNotice).catch(() => publishNotice);
      if (eventDelivery && preparedDraft.isPublished) {
        try {
          const flowResult = await requestJson<EventPublishFlowResult>("/api/event-publish-flow", {
            method: "POST",
            body: JSON.stringify({ event: { ...preparedDraft, ...savedData }, platforms: ["x", "instagram"] })
          });
          eventDelivery.social = socialDraftResult(flowResult.data);
        } catch {
          eventDelivery.social = "下書きの作成結果を確認できませんでした。SNS欄で確認してください。";
          eventDelivery.socialRetryNeeded = true;
        }
      }

      const deployNotice = await publishing;
      setNotice(deployNotice);
      onDeployNotice(deployNotice);
    } catch (saveError) {
      setNotice({
        tone: "error",
        message:
          saveError instanceof Error
            ? saveError.message
            : "保存できませんでした。時間をおいて再度お試しください。直らない場合は担当者へこの画面の内容を伝えてください。"
      });
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
      setDeploying(false);
      setShowPreview(false);
    }
  }

  function startNewItem() {
    if (!confirmDiscardChanges()) {
      return;
    }

    userInteractedRef.current = true;
    setSelectedId("new");
    setErrors({});
    setNotice(null);
    showStoredDraft("new", initialMergedDraft);
    setDirty(false);
    setEditingFields(new Set());
  }

  function openField(fieldKey: string) {
    setEditingFields((current) => {
      const next = new Set(current);
      next.add(fieldKey);
      return next;
    });
  }

  function closeField(fieldKey: string) {
    setEditingFields((current) => {
      const next = new Set(current);
      next.delete(fieldKey);
      return next;
    });
  }

  function getOrderedSlidesForCurrentPage() {
    const currentPage = getString(draft.page).trim() || "home";
    return items
      .filter((item) => getString(item.page).trim() === currentPage)
      .sort((a, b) => getOrderNumber(a.displayOrder) - getOrderNumber(b.displayOrder));
  }

  async function patchListItem(id: string, payload: Draft) {
    return requestJson<Draft>(`/api/content/${section.id}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  async function deleteSelectedItem() {
    if (section.kind !== "list" || selectedId === "new") {
      return;
    }

    if (draft.__isFallback === true) {
      setNotice({
        tone: "info",
        message: "初期表示用の仮データは削除できません。新しく保存した項目から削除できます。"
      });
      return;
    }

    const itemTitle = getItemTitle(section, draft);
    const confirmed = window.confirm(
      `「${itemTitle}」を完全に削除します。元に戻せません。表示だけ止めたい場合は「公開OFF」で保存してください。削除しますか？`
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setNotice({ tone: "info", message: "項目を削除しています。" });

    try {
      await requestJson<{ id: string }>(`/api/content/${section.id}/${selectedId}`, {
        method: "DELETE"
      });
      if (section.id === "events") window.dispatchEvent(new CustomEvent("bassic-event-removed", { detail: selectedId }));
      if (section.id === "social-notices") window.dispatchEvent(new Event("bassic-social-draft-saved"));
      const remainingItems = items.filter((item) => item.id !== selectedId);
      const remainingVisibleItems = scopedListPage
        ? remainingItems.filter((item) => getString(item.page).trim() === scopedListPage)
        : remainingItems;
      const nextItem = remainingVisibleItems[0];

      setItems(remainingItems);
      setErrors({});
      setEditingFields(new Set());
      setDirty(false);
      setLastSavedAt("");

      if (nextItem?.id) {
        setSelectedId(nextItem.id);
        setDraft(mergeDefaults(section, nextItem));
      } else {
        setSelectedId("new");
        setDraft(initialMergedDraft);
      }

      setNotice({ tone: "success", message: "項目を削除しました。公開サイトへ反映する場合は、必要に応じて「掲載前に確認」を押してください。" });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "削除できませんでした。"
      });
    } finally {
      setSaving(false);
    }
  }

  async function createSlideNear(direction: "before" | "after") {
    if (section.id !== "hero-slides") {
      return;
    }

    if (dirty && !confirmDiscardChanges()) {
      return;
    }

    const orderedSlides = getOrderedSlidesForCurrentPage();
    const selectedIndex = orderedSlides.findIndex((item) => item.id === selectedId);
    const baseIndex = selectedIndex >= 0 ? selectedIndex : orderedSlides.length - 1;
    const insertIndex = direction === "before" ? Math.max(baseIndex, 0) : Math.max(baseIndex + 1, 0);
    const currentPage = getString(draft.page).trim() || getString(orderedSlides[0]?.page).trim() || "home";

    setSaving(true);
    setNotice({ tone: "info", message: "新しい画像枠を追加しています。" });

    try {
      const slidesToShift = orderedSlides.slice(insertIndex).filter((item) => item.id);
      await Promise.all(
        slidesToShift.map((item, index) =>
          patchListItem(item.id || "", {
            ...item,
            displayOrder: insertIndex + index + 2
          })
        )
      );

      const result = await requestJson<Draft>("/api/content/hero-slides", {
        method: "POST",
        body: JSON.stringify({
          page: currentPage,
          title: `${getHeroSlidePageLabel(currentPage)} 新しい画像`,
          image: undefined,
          displayOrder: insertIndex + 1,
          isPublished: false
        })
      });
      const created = mergeDefaults(section, result.data || {});
      const createdId = getString((result.data as Draft | undefined)?.id).trim();

      setItems((current) =>
        [...current.map((item) => {
          if (!item.id || !slidesToShift.some((shifted) => shifted.id === item.id)) {
            return item;
          }

          const shiftedIndex = slidesToShift.findIndex((shifted) => shifted.id === item.id);
          return { ...item, displayOrder: insertIndex + shiftedIndex + 2 };
        }), { ...created, id: createdId }]
          .filter((item) => item.id)
          .sort((a, b) => getString(a.page).localeCompare(getString(b.page)) || getOrderNumber(a.displayOrder) - getOrderNumber(b.displayOrder))
      );
      setSelectedId(createdId || "new");
      setDraft({ ...created, id: createdId });
      setEditingFields(new Set(["image", "title"]));
      setDirty(false);
      setNotice({ tone: "success", message: "新しい画像枠を追加しました。画像を入れて保存してください。" });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? `${error.message} 画像枠を追加できませんでした。` : "画像枠を追加できませんでした。"
      });
    } finally {
      setSaving(false);
    }
  }

  async function moveSelectedSlide(direction: -1 | 1) {
    if (section.id !== "hero-slides" || selectedId === "new") {
      return;
    }

    if (dirty && !confirmDiscardChanges()) {
      return;
    }

    const orderedSlides = getOrderedSlidesForCurrentPage();
    const currentIndex = orderedSlides.findIndex((item) => item.id === selectedId);
    const nextIndex = currentIndex + direction;
    const currentSlide = orderedSlides[currentIndex];
    const targetSlide = orderedSlides[nextIndex];

    if (!currentSlide?.id || !targetSlide?.id) {
      setNotice({ tone: "info", message: "これ以上は移動できません。" });
      return;
    }

    const currentOrder = getOrderNumber(currentSlide.displayOrder);
    const targetOrder = getOrderNumber(targetSlide.displayOrder);

    setSaving(true);
    setNotice({ tone: "info", message: "画像の並び順を変更しています。" });

    try {
      await Promise.all([
        patchListItem(currentSlide.id, { ...currentSlide, displayOrder: targetOrder }),
        patchListItem(targetSlide.id, { ...targetSlide, displayOrder: currentOrder })
      ]);

      setItems((current) =>
        current.map((item) => {
          if (item.id === currentSlide.id) {
            return { ...item, displayOrder: targetOrder };
          }
          if (item.id === targetSlide.id) {
            return { ...item, displayOrder: currentOrder };
          }
          return item;
        })
      );
      setDraft((current) => ({ ...current, displayOrder: targetOrder }));
      setDirty(false);
      setNotice({ tone: "success", message: "画像の並び順を変更しました。公開サイトへ反映する時は掲載前に確認を押してください。" });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? `${error.message} 並び順を変更できませんでした。` : "並び順を変更できませんでした。"
      });
    } finally {
      setSaving(false);
    }
  }
  async function hideSelectedSlide() {
    if (section.id !== "hero-slides" || selectedId === "new") {
      return;
    }

    if (!window.confirm("この画像をスライドショーから外しますか？公開サイトへ反映する時は最後に「掲載前に確認」を押してください。")) {
      return;
    }

    setSaving(true);
    setNotice({ tone: "info", message: "画像をスライドショーから外しています。" });

    try {
      await patchListItem(selectedId, { ...draft, isPublished: false });
      setItems((current) => current.map((item) => (item.id === selectedId ? { ...item, isPublished: false } : item)));
      setDraft((current) => ({ ...current, isPublished: false }));
      setDirty(false);
      setNotice({ tone: "success", message: "この画像を公開OFFにしました。必要なら別の画像を選んでください。" });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? `${error.message} 画像を外せませんでした。` : "画像を外せませんでした。"
      });
    } finally {
      setSaving(false);
    }
  }

  function renderEditableField(field: FieldDefinition) {
    return (
      <EditableFieldCard
        section={section}
        field={field}
        value={draft[field.key]}
        fallbackValue={fieldDefaults[field.key]}
        error={errors[field.key]}
        key={`${selectedId}:${field.key}`}
        isEditing={editingFields.has(field.key)}
        onEdit={() => openField(field.key)}
        onClose={() => closeField(field.key)}
        onChange={(value) => updateField(field.key, value)}
      />
    );
  }

  function renderSaveActions() {
    return (
            <div className="form-actions">
              <button className="primary-button" type="button" disabled={saving || deploying} onClick={openPreview}>
                {deploying ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                {section.id === "social-notices" ? "SNS下書きを保存" : section.id === "events" ? "登録内容を確認" : "掲載前に確認"}
              </button>
              {section.id === "events" && !getString(draft.endTime) ? <small className="action-note">終了時刻：未定（カレンダーは仮の2時間枠）</small> : null}
              <small className="action-note">{section.id === "social-notices" ? "下書きの保存だけではSNSに投稿されません。" : section.id === "events" ? "確認画面からGoogleカレンダーに登録します。SNSは下書きまで。" : "確認画面で確定するまで公開されません。"}</small>
            </div>
    );
  }

  function revealErrorField(key: string) {
    setEditingFields(current => new Set([...current, key]));
    requestAnimationFrame(() => {
      const target = document.getElementById(key);
      if (!target) return;
      let parent = target.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      const input = target.matches("input, textarea, select") ? target : target.querySelector<HTMLElement>("input, textarea, select");
      input?.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }

  return (
    <div className="editor">
      {notice ? <div ref={feedbackRef} tabIndex={-1} className="editor-feedback" role={notice.tone === "error" ? "alert" : undefined} aria-label="操作結果">
        {(notice.requestId || notice.retryPublish) ? (
          <DeployStatusCard key={notice.requestId || notice.requestedAt} notice={notice} onOpenSocialDrafts={onOpenSocialDrafts} onRetry={(next) => { setNotice(next); onDeployNotice(next); }} />
        ) : <NoticeBox notice={notice} />}
        <ValidationSummary errors={errors} section={section} onSelect={revealErrorField} />
      </div> : null}
      <div className="editor-topbar">
        <button
          className="text-button"
          type="button"
          onClick={() => {
            if (confirmDiscardChanges()) {
              onBack();
            }
          }}
        >
          <ArrowLeft size={18} />
          {sourcePage ? `${sourcePage}へ戻る` : "戻る"}
        </button>
        <div className="topbar-actions">
          {dirty ? (
            <span className="dirty-pill">未保存の変更あり</span>
          ) : isNewListItem ? (
            <span className="new-pill">新規作成中</span>
          ) : (
            <span className="saved-pill">保存済み</span>
          )}
          {lastSavedAt ? <span className="saved-time">最終保存 {lastSavedAt}</span> : null}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              if (confirmDiscardChanges()) {
                void load();
              }
            }}
          >
            <RefreshCw size={18} />
            再読み込み
          </button>
        </div>
      </div>

      <div className="page-heading">
        <div>
          <p className="eyebrow">{section.shortTitle}</p>
          <h1>{editLabel?.split(" → ").at(-1) || section.title}</h1>
        </div>
        {section.kind === "list" && !eventEntry && !relatedEventId ? (
          <button className="secondary-button" type="button" onClick={startNewItem}>
            <Plus size={18} />
            {listCreateLabel}
          </button>
        ) : null}
      </div>

      {isMaintenanceSection ? (
        <div className="maintenance-warning">
          <AlertCircle size={18} />
          <span>ここは保守向け設定です。ページ構成や表示順に影響するため、分からない場合は保存せずに戻ってください。</span>
        </div>
      ) : null}

      <details className="editor-help">
        <summary>編集・保存の手順を見る</summary>
        <p>{section.description}</p>
        <p>{section.helperText}</p>
        <EditorGuide section={section} dirty={dirty} selectedId={selectedId} />
      </details>

      {loading ? (
        <div className="loading-panel">
          <Loader2 className="spin" size={28} />
          読み込み中
        </div>
      ) : loadFailed ? (
        <section className="load-failure" role="alert">
          <strong>現在の内容を読み込めませんでした</strong>
          <p>現在の内容を確認できないため、編集と保存はできません。通信を確認して、もう一度読み込んでください。</p>
          <button type="button" className="secondary-button" onClick={() => void load()}>もう一度読み込む</button>
        </section>
      ) : (
        <div className="editor-layout">
          {section.kind === "list" && !eventEntry ? (
            <aside className="item-list">
              <strong className="item-list-heading">現在登録されている内容</strong>
              {!relatedEventId ? <button className={selectedId === "new" ? "selected" : ""} type="button" onClick={startNewItem}>
                <Plus size={18} />
                {listCreateLabel}
              </button> : null}
              <div className="item-list-tools" aria-label="一覧の絞り込み">{section.id==="events"?<label>開催日<select value={eventPeriod} onChange={e=>setEventPeriod(e.target.value)}><option value="upcoming">開催予定</option><option value="past">過去のイベント</option><option value="all">すべて</option></select></label>:null}
                <div className="item-counts">
                  <span>全部 {visibleItems.length}</span>
                  <span>公開 {publishedCount}</span>
                  <span>下書き {draftCount}</span>
                </div>
                <label>
                  探す
                  <input
                    type="search"
                    value={itemSearch}
                    onChange={(event) => setItemSearch(event.target.value)}
                    placeholder="名前・日付・料金などで検索"
                  />
                  <small className="item-search-hint">一覧に出ている補足情報も検索できます。</small>
                </label>
                <div className="status-filter" role="group" aria-label="公開状態で絞り込み">
                  <button className={itemStatusFilter === "all" ? "selected" : ""} type="button" onClick={() => setItemStatusFilter("all")}>
                    全部
                  </button>
                  <button className={itemStatusFilter === "public" ? "selected" : ""} type="button" onClick={() => setItemStatusFilter("public")}>
                    公開
                  </button>
                  <button className={itemStatusFilter === "draft" ? "selected" : ""} type="button" onClick={() => setItemStatusFilter("draft")}>
                    下書き
                  </button>
                </div>
                <small className="item-filter-result">表示 {filteredItems.length}件 / 全{visibleItems.length}件</small>
              </div>
              {visibleItems.length ? (
                filteredItems.length ? (
                  filteredItems.map((item) => {
                    const itemMeta = getItemMeta(section, item);

                    return (
                      <button
                        className={selectedId === item.id ? "selected" : ""}
                        key={item.id || JSON.stringify(item)}
                        type="button"
                        onClick={() => {
                          if (!confirmDiscardChanges()) {
                            return;
                          }

                          userInteractedRef.current = true;
                          setSelectedId(item.id || "");
                          setErrors({});
                          setNotice(null);
                          showStoredDraft(item.id || "", mergeDefaults(section, item));
                          setDirty(false);
                        }}
                      >
                        {["hero-slides","events","menu"].includes(section.id) && getImageUrl(item.image) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="item-list-thumb" src={getImageUrl(item.image)} alt="" />
                        ) : null}
                        <span className="item-list-title">{getItemTitle(section, item)}</span>
                        <small className={isPublished(item) ? "status-public" : "status-draft"}>
                          {isPublished(item) ? "公開" : "下書き"}
                        </small>
                        {itemMeta ? <small className="item-list-meta">{itemMeta}</small> : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="empty-list">条件に合う項目がありません。検索文字か公開状態を変えてください。</div>
                )
              ) : (
                <div className="empty-list">まだ登録がありません。上の「{listCreateLabel}」から作れます。</div>
              )}
            </aside>
          ) : null}

          <form
            className="edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              openPreview();
            }}
          >
            {eventEntry ? (
              <section className="event-entry-guide" aria-label="イベント追加の流れ">
                <ol><li>Facebookから取り込む</li><li>内容を確認して登録</li><li>SNSで使う</li></ol>
                <p>SNSは文面を確認して各サービスで投稿</p>
              </section>
            ) : null}
            {!eventEntry && !relatedEventId && !(editLabel && section.kind === "object") ? <CurrentEditSummary section={section} draft={draft} dirty={dirty} selectedId={selectedId} /> : null}
            {!eventEntry && !relatedEventId && section.id !== "events" ? <RequiredProgress section={section} draft={draft} /> : null}
            {!eventEntry && !relatedEventId && section.id !== "events" ? <EditorFocusTips section={section} /> : null}
            {section.id === "hero-slides" ? (
              <section className="slide-tools" aria-label="スライドショーの画像操作">
                <div>
                  <strong>スライドショーの並びを編集</strong>
                  <span>選択中の画像を基準に、前後へ追加・並び替え・公開OFFができます。</span>
                </div>
                <div className="slide-tool-actions">
                  <button className="secondary-button compact" type="button" disabled={saving || selectedId === "new"} onClick={() => void createSlideNear("before")}>
                    <Plus size={16} />
                    この前に追加
                  </button>
                  <button className="secondary-button compact" type="button" disabled={saving || selectedId === "new"} onClick={() => void createSlideNear("after")}>
                    <Plus size={16} />
                    この後ろに追加
                  </button>
                  <button className="secondary-button compact" type="button" disabled={saving || selectedId === "new"} onClick={() => void moveSelectedSlide(-1)}>
                    <ArrowUp size={16} />
                    前へ
                  </button>
                  <button className="secondary-button compact" type="button" disabled={saving || selectedId === "new"} onClick={() => void moveSelectedSlide(1)}>
                    <ArrowDown size={16} />
                    後ろへ
                  </button>
                  <button className="secondary-button compact danger" type="button" disabled={saving || selectedId === "new"} onClick={() => void hideSelectedSlide()}>
                    <Trash2 size={16} />
                    スライドから外す
                  </button>
                </div>
                <small>完全削除ではなく公開OFFにするので、間違えて外しても戻せます。</small>
              </section>
            ) : null}
            {section.id === "events" ? <FacebookEventImportPanel draft={draft} onApply={applyImportedFacebookEvent} sourceField={renderEditableField(section.fields.find(field => field.key === "sourceUrl")!)}>
              <div className="event-core-fields">
                {["title", "date", "startTime", "image"].map(key => renderEditableField({ ...section.fields.find(field => field.key === key)!, ...(key === "startTime" ? { label: "開始時刻（START）", required: true, placeholder: "未入力（例：19:00）" } : {}) }))}
              </div>
              <details className="event-extra-fields">
                <summary>詳細を追加（開場・終了・出演者・料金・予約）</summary>
                {["openTime", "endTime", "performers", "price", "reservation"].map(key => renderEditableField(section.fields.find(field => field.key === key)!))}
              </details>
              {!eventEntry ? renderEditableField(section.fields.find(field => field.key === "isPublished")!) : null}
              {renderSaveActions()}
            </FacebookEventImportPanel> : null}
            {section.id === "social-notices" && !relatedEventId ? <SocialNoticeUrlGuide draft={draft} /> : null}
            <div className="editable-field-list">
              {editableFields.filter((field) => section.id !== "events" && !isMobileAppearanceField(field.key) && (!eventEntry || !["sourceUrl", "isPublished"].includes(field.key))).map(renderEditableField)}
              {editableFields.some((field) => isMobileAppearanceField(field.key)) ? (
                <details className="page-option-group">
                  <summary className="mobile-appearance-summary">スマホでの見え方</summary>
                  <div className="page-option-details">
                    {editableFields.filter((field) => isMobileAppearanceField(field.key)).map(renderEditableField)}
                  </div>
                </details>
              ) : null}
            </div>
            {section.id === "social-notices" && ["x", "instagram"].includes(getString(draft.platform)) ? (
              <SnsPostingPanel key={selectedId + ":" + getString(draft.platform)} platform={getString(draft.platform)} text={getString(draft.postText)} imageUrl={getImageUrl(draft.image) && isValidManagedImageUrl(getImageUrl(draft.image)) ? resolvePublicUrl(getImageUrl(draft.image), publicSiteUrl) : ""} />
            ) : null}
            {section.kind === "list" && selectedId !== "new" ? (
              <div className="destructive-actions">
                <button className="secondary-button danger" type="button" disabled={saving || deploying} onClick={() => void deleteSelectedItem()}>
                  <Trash2 size={18} />
                  この項目を削除
                </button>
                <small>表示だけ止めたい場合は、公開をOFFにして「掲載前に確認」へ進んでください。</small>
              </div>
            ) : null}
            {section.id !== "events" ? renderSaveActions() : null}
          </form>
        </div>
      )}

      {showPreview ? (
        <PreviewModal pathOverride={sourcePage?adminPages.find(page=>page.page===sourcePage)?.publicPath:undefined} draft={previewDraft} previewContext={previewContext} section={{ ...section, fields: editableFields }} onClose={() => setShowPreview(false)} onPublish={() => void save()} />
      ) : null}
    </div>
  );
}

type PageOverview = {
  home: Draft;
  "site-settings": Draft;
  "hero-slides": Draft[];
  "page-sections": Draft[];
  "page-copy": Draft[];
  "custom-sections": Draft[];
};

const emptyOverview: PageOverview = {
  home: {}, "site-settings": {}, "hero-slides": [], "page-sections": [], "page-copy": [], "custom-sections": []
};

function overviewImage(value: unknown, fallback = "") {
  const url = getImageUrl(value) || fallback;
  return url && isValidManagedImageUrl(url) ? resolvePublicUrl(url, publicSiteUrl) : "";
}

function ActionThumbnail({ url }: { url: string }) {
  return <AdminImage className="page-overview-image" src={url} compact />;
}

function topPageActions(home: Draft): PageAdminAction[] {
  function fields(group: string, label: string, description: string, fieldKeys: readonly string[]): PageAdminAction {
    return { group, label, description, sectionId: "home", fieldKeys };
  }
  function select(prefix: string) {
    return getSection("home").fields.map((field) => field.key).filter((key) => key.startsWith(prefix));
  }

  return [
    fields("ヘッダー", "ロゴ・背景", "ページ上部に表示する画像", ["headerLogo", "headerBackground"]),
    fields("ヘッダー", "メニュー名", "ヘッダーの各ページへのリンク文言", select("headerNav")),
    { label: "スライド写真", group: "メインビジュアル", description: "共通写真、スマホ用写真、表示順", sectionId: "hero-slides", initialDraft: { page: "home" } },
    fields("メインビジュアル", "見出し・説明文", "メイン画像に重なる見出しと本文", ["heroEyebrow", "homeHeroTitle", "homeHeroLead", "heroMobileTitle"]),
    fields("メインビジュアル", "重ねるロゴ", "メイン画像に重ねる店のロゴ", ["heroLogo"]),
    fields("メインビジュアル", "地図・電話・予約ボタン", "地図・電話・予約のボタン", ["heroMapLabel", "heroCallLabel", "heroReserveLabel"]),
    fields("初めての方へ", "見出し・説明文", "紹介カードの上に出る文章", ["firstVisitEyebrow", "firstVisitTitle", "firstVisitDescription"]),
    ...firstVisitSection.features.map((feature, index) => {
      const prefix = "firstVisitCard" + (index + 1);
      return {
        ...fields("初めての方へ", "紹介カード" + (index + 1), getString(home[prefix + "Title"]) || feature.title, select(prefix)),
        thumbnail: overviewImage(home[prefix + "Image"], editableMedia.atmosphereImages[index].src)
      };
    }),
    fields("来店前の基本情報", "見出し・説明文", "基本情報カードの上に出る文章", ["visitInfoTitle", "visitInfoLead"]),
    ...visitInfoItems.map((item, index) => fields("来店前の基本情報", item.title + "カード", getString(home["visitInfoCard" + (index + 1) + "Title"]) || item.title, select("visitInfoCard" + (index + 1)))),
    fields("お店の紹介", "見出し・説明文", "紹介カードの上に出る文章", ["localSearchEyebrow", "localSearchTitle", "localSearchLead"]),
    ...localSearchSection.cards.map((item, index) => fields("お店の紹介", "紹介カード" + (index + 1), getString(home["localSearchCard" + (index + 1) + "Title"]) || item.title, select("localSearchCard" + (index + 1)))),
    fields("SNS欄", "見出し・説明文", "SNS欄の上に出る文章", ["socialEyebrow", "socialTitleLine1", "socialTitleLine2", "socialLead"]),
    ...["Instagram", "Facebook", "X"].flatMap<PageAdminAction>((name) => [
      fields("SNS欄", name + "の表示", "表示名・アカウントID", ["social" + name + "Label", "social" + name + "Account"]),
      { label: name + "のリンク先", group: "SNS欄", description: "公式アカウントのURL", sectionId: "site-settings", fieldKeys: [name.toLowerCase() + "Url"] }
    ]),
    fields("アクセス", "行き方案内・ボタン", "TOPの案内文やボタン", select("homeAccess")),
    { label: "店舗情報・リンク", group: "アクセス", description: "住所・電話・営業時間・地図リンク。ほかのページにも反映されます。", sectionId: "site-settings" },
    fields("フッター", "背景", "ページ最下部の背景画像", ["footerBackground"]),
    fields("フッター", "店名・著作権", "ページ最下部の文章", ["footerStoreName", "footerCopyright"]),
    fields("スマホ下部の固定ボタン", "固定ボタン", "スマホの画面下に常に表示。文言と表示するボタンを選べます。", select("mobile"))
  ];
}

type LayoutRow = { key: string; order: number; hidden?: boolean; heading?: string; image?: string };

function latestPageCopy(page: string, overview: PageOverview) {
  return overview["page-copy"].filter((copy) => copy.page === page && copy.isPublished !== false)
    .sort((a, b) => (a.displayOrder == null ? 9999 : getOrderNumber(a.displayOrder)) - (b.displayOrder == null ? 9999 : getOrderNumber(b.displayOrder))).at(-1) || {};
}

function currentHomeSlide(overview: PageOverview) {
  return overview["hero-slides"].filter((item) => item.page === "home" && item.isPublished !== false && getImageUrl(item.image))
    .sort((a, b) => (a.displayOrder == null ? 9999 : getOrderNumber(a.displayOrder)) - (b.displayOrder == null ? 9999 : getOrderNumber(b.displayOrder)))[0];
}

function overviewLayout(page: string, overview: PageOverview): Record<string, LayoutRow> {
  const bySection = new Map<string, Draft>();
  for (const entry of overview["page-sections"]) {
    const key = getString(entry.sectionKey || entry.section);
    if (entry.page === page && !bySection.has(key)) bySection.set(key, entry);
  }
  const row = (key: string, order: number, heading?: string, image?: string): LayoutRow => {
    const entry = bySection.get(key);
    return { key, order: entry?.displayOrder != null ? getOrderNumber(entry.displayOrder) : order, hidden: entry?.isPublished === false, heading, image };
  };
  const home = overview.home;
  const copy = latestPageCopy(page, overview);
  const slide = overview["hero-slides"].filter((item) => item.page === page && item.isPublished !== false && getImageUrl(item.image))
    .sort((a, b) => getOrderNumber(a.displayOrder) - getOrderNumber(b.displayOrder))[0];
  const heroes = { events: pageHeroes.events, menu: pageHeroes.menu, party: pageHeroes.party, access: pageHeroes.access };
  const hero: PageHeroContent | undefined = heroes[page as keyof typeof heroes];
  const heroFallback = page === "home" ? editableMedia.homeHeroImage.src : hero?.slides?.[0]?.src || hero?.image;
  const heroHeading = page === "home" ? getString(home.homeHeroTitle || copy.heroTitle) || fallbackContents.home.heroTitle : getString(copy.heroTitle) || hero?.title;
  const heroRow = row("hero", 1, heroHeading, overviewImage(slide?.image, heroFallback));
  if (page === "home") {
    return {
      "ヘッダー": { key: "header", order: -Infinity, heading: "ページ上部のロゴとメニュー", image: overviewImage(home.headerLogo, "/assets/brand/b-logo-mark2.png") },
      "メインビジュアル": heroRow,
      "初めての方へ": row("firstVisit", 2, getString(home.firstVisitTitle) || firstVisitSection.title, overviewImage(home.firstVisitCard1Image, editableMedia.atmosphereImages[0].src)),
      "来店前の基本情報": row("visitInfo", 3, getString(home.visitInfoTitle) || "初めての来店前に、知っておくと安心なこと。"),
      "お店の紹介": row("localSearch", 4, getString(home.localSearchTitle) || localSearchSection.title),
      "SNS欄": row("social", 5, getString(home.socialTitleLine1 || copy.socialTitleLine1) || socialUpdatesCopy.titleLines[0]),
      "アクセス": row("access", 6, getString(home.homeAccessTitle) || "天神駅から徒歩約4分。Google Mapから迷わず来店。"),
      "フッター": { key: "footer", order: Infinity, heading: getString(home.footerStoreName) || "public bar Bassic.", image: overviewImage(home.footerBackground, "/assets/brand/topbar.jpg") },
      "スマホ下部の固定ボタン": { key: "mobile", order: Infinity, heading: "スマホの画面下に常に表示" }
    };
  }
  const grouped = (entries: LayoutRow[]) => {
    const shown = entries.filter((entry) => !entry.hidden);
    return shown.length ? Math.min(...shown.map((entry) => entry.order)) : Math.min(...entries.map((entry) => entry.order));
  };
  const drink = row("drinkSheets", 2, getString(copy.drinkLead));
  const food = row("foodMenu", 3, getString(copy.foodLead));
  const plans = row("plans", 2);
  const rental = row("equipmentRental", 3, getString(copy.rentalLead));
  const info = row("accessInfo", 2);
  const map = row("googleMap", 3);
  return {
    "メインビジュアル": heroRow,
    "開催イベント": row("event-list", 2),
    "カレンダー": row("calendar", 3, getString(copy.calendarNote)),
    "ドリンク表": { ...drink, order: grouped([drink, food]) },
    "フードメニュー・料金": { ...food, order: grouped([drink, food]) },
    "貸切プラン": { ...plans, order: grouped([plans, rental, row("useCases", 4)]) },
    "機材レンタル・PDF": { ...rental, order: grouped([plans, rental, row("useCases", 4)]) },
    "住所・電話・Google Map・営業時間": { ...info, hidden: info.hidden && map.hidden, order: grouped([info, map]) }
  };
}

function PageBasedDashboard({
  onSelect,
  selectedPage,
  expandedGroup,
  onGroupChange,
  lastDeploy,
  onDeployNotice,
  health,
  opsStatus,
  onRefreshOps,
  editor,
  activeEditLabel,
  onOpenSocialDrafts,
  onEditorState
}: {
  onSelect: (nextSection: ActiveSectionState) => void;
  selectedPage: string;
  expandedGroup: string | null;
  onGroupChange: (group: string | null) => void;
  lastDeploy?: Notice;
  onDeployNotice: (notice: Notice) => void;
  health?: HealthState;
  opsStatus?: OpsStatus;
  onRefreshOps: () => void;
  editor?: ReactNode;
  activeEditLabel?: string;
  onOpenSocialDrafts: (sourceId: string) => void;
  onEditorState: (state: {dirty:boolean;busy:boolean}) => void;
}) {
  const activePage = adminPages.find((page) => page.page === selectedPage) || adminPages[0];
  const maintenanceSections = sections.filter((section) => !dailySectionIds.has(section.id));
  const hasSetupProblem = health ? !health.ok : false;
  const pageDraftMap: Record<string, string> = {
    TOP: "home",
    "EVENT SCHEDULE": "events",
    MENU: "menu",
    "PARTY & RENTAL": "party",
    ACCESS: "access"
  };
  const [overview, setOverview] = useState<PageOverview>(emptyOverview);
  const [overviewError, setOverviewError] = useState(false);
  const editing = Boolean(editor);
  const calendarEditor = activeEditLabel?.startsWith("イベント追加") || activeEditLabel === "店休日を追加";
  const editingArea = useRef<HTMLDivElement>(null);
  const detailsArea = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedPage !== "DETAILS" || editing || !detailsArea.current) return;
    detailsArea.current.focus({ preventScroll: true });
    detailsArea.current.scrollIntoView({ block: "start" });
  }, [selectedPage, editing]);
  useEffect(() => {
    if (!editing || !editingArea.current) return;
    const area = editingArea.current;
    area.focus({ preventScroll: true });
    area.scrollIntoView({ block: "start", inline: "nearest" });
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    const endpoints = ["home", "site-settings", "hero-slides", "page-sections", "page-copy", "custom-sections"] as const;
    void Promise.allSettled(endpoints.map(async (id) => {
      const { data } = await requestJson<ListResponse | Draft>("/api/content/" + id);
      return [id, id === "home" || id === "site-settings" ? data || {} : (data as ListResponse)?.contents || []] as const;
    })).then((results) => {
      if (cancelled) return;
      const fulfilled = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      setOverview({ ...emptyOverview, ...Object.fromEntries(fulfilled) });
      setOverviewError(fulfilled.length !== endpoints.length);
    });
    return () => { cancelled = true; };
  }, [editing]);
  const pageKey = pageDraftMap[activePage.page];
  const layout = overviewLayout(pageKey, overview);
  const activeActions = activePage.page === "TOP" ? topPageActions(overview.home) : activePage.actions;
  const actionGroups = new Map<string, { layout: LayoutRow; actions: PageAdminAction[] }>();
  for (const action of activeActions) {
    const group = action.group || action.label;
    const entry = actionGroups.get(group);
    if (entry) entry.actions.push(action);
    else actionGroups.set(group, { layout: layout[group] || { key: group, order: Infinity }, actions: [action] });
  }
  if (pageKey) {
    for (const item of overview["custom-sections"]) {
      const id = getString(item.id);
      if (item.page !== pageKey || !id) continue;
      const key = "custom-" + id;
      const title = getString(item.title) || "タイトル未設定";
      actionGroups.set(key, {
        layout: { key, order: item.displayOrder == null ? 9000 : getOrderNumber(item.displayOrder), hidden: item.isPublished === false || !getString(item.title) || !getString(item.body), heading: title, image: overviewImage(item.image) },
        actions: [{ label: "追加した案内を編集する", description: title, sectionId: "custom-sections", initialDraft: { page: pageKey }, itemId: id }]
      });
    }
  }
  const orderedGroups = [...actionGroups].sort((a, b) => a[1].layout.order - b[1].layout.order);

  function selectAction(action: PageAdminAction, group: string) {
    onSelect({
      id: action.sectionId,
      initialDraft: action.initialDraft,
      fieldKeys: action.fieldKeys,
      homeGroup: action.homeGroup,
      itemId: action.itemId,
      sourcePage: activePage.page,
      editLabel: actionPath(action, group),
      previewContext: pageKey === "home" ? { ...overview.home, settings: overview["site-settings"], slide: currentHomeSlide(overview), copy: latestPageCopy("home", overview) } : undefined
    });
  }

  function actionPath(action: PageAdminAction, group: string) {
    const sectionLabel = actionGroups.get(group)?.layout.key.startsWith("custom-")
      ? actionGroups.get(group)?.layout.heading || "追加の案内"
      : group;
    return [activePage.title, sectionLabel, ...(sectionLabel === action.label ? [] : [action.label])].join(" → ");
  }

  const selection = expandedGroup ? actionGroups.get(expandedGroup) : undefined;
  const [actionData, setActionData] = useState<Record<string, Draft>>({});
  const extraEndpoints = [...new Set(selection?.actions.map((action) => action.sectionId))]
    .filter((id) => !["home", "site-settings", "page-copy", "hero-slides", "custom-sections"].includes(id))
    .join(",");
  useEffect(() => {
    if (!extraEndpoints) return;
    const controller = new AbortController();
    void Promise.allSettled(extraEndpoints.split(",").map(async (id) => {
      const { data } = await requestJson<ListResponse | Draft>("/api/content/" + id, { signal: controller.signal });
      const items = (data as ListResponse)?.contents;
      const current = Array.isArray(items)
        ? items.find((item) => item.isPublished !== false) || {}
        : data || {};
      return [id, current] as const;
    })).then((results) => {
      if (controller.signal.aborted) return;
      setActionData((current) => ({
        ...current,
        ...Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []))
      }));
    });
    return () => controller.abort();
  }, [extraEndpoints, lastDeploy?.requestedAt]);
  const relatedSections = new Set(selection?.actions.map((action) => action.sectionId) || []);
  if (activePage.page === "EVENT SCHEDULE") {
    relatedSections.add("events");
    relatedSections.add("social-notices");
  }
  if (activePage.page === "ACCESS") relatedSections.add("site-settings");
  const relevantStatus = opsStatus ? { ...opsStatus, alerts: opsStatus.alerts.filter((alert) => relatedSections.has(alert.sectionId)) } : undefined;

  function renderActions(actions: PageAdminAction[], group: string) {
    return (
      <div className="page-option-details">
        {actions.map((action) => {
          const context = { copy: latestPageCopy(pageKey, overview), settings: overview["site-settings"] };
          const slide = overview["hero-slides"].filter((item) => item.page === pageKey && item.isPublished !== false && getImageUrl(item.image))
            .sort((a, b) => getOrderNumber(a.displayOrder) - getOrderNumber(b.displayOrder))[0];
          const data = action.sectionId === "home" ? overview.home
            : action.sectionId === "site-settings" ? overview["site-settings"]
            : action.sectionId === "page-copy" ? context.copy
            : action.sectionId === "hero-slides" ? slide || {}
            : action.itemId ? overview["custom-sections"].find((item) => item.id === action.itemId) || {}
            : actionData[action.sectionId] || {};
          const fields = getSection(action.sectionId).fields.filter((field) => !action.fieldKeys || action.fieldKeys.includes(field.key));
          const defaults = currentFieldDefaults(action.sectionId, { ...action.initialDraft, ...data }, context);
          const values = fields.map((field) => ({ field, value: fieldHasValue(field, data[field.key]) ? data[field.key] : defaults[field.key] }));
          const title = values.find(({ field, value }) => /(?:Title|Name|Account|^address|^onlineStoreUrl)$/i.test(field.key) && getString(value).trim());
          const lead = values.find(({ field, value }) => /(?:Lead|Description|Text|Note|Copyright|hoursLabel|^body)$/i.test(field.key) && getString(value).trim());
          const labels = values.filter(({ field }) => /Label$/.test(field.key)).map(({ value }) => getString(value).trim()).filter(Boolean);
          const excerpt = getString(lead?.value) || labels.slice(0, 3).join(" ／ ");
          const thumbnail = values.map(({ field, value }) => field.type === "image" ? overviewImage(value) : "").find(Boolean)
            || action.thumbnail || (action.sectionId === "hero-slides" ? overviewImage(selection?.layout.image) : "");
          const path = actionPath(action, group);
          return (
            <article className="action-preview-row" key={action.label}>
              <button className="action-preview-button" type="button" aria-pressed={activeEditLabel === path} onClick={() => selectAction(action, group)}>
                {thumbnail ? <ActionThumbnail key={thumbnail} url={thumbnail} /> : null}
                <span className="action-preview-copy">
                  <strong>{action.label}</strong>
                  <small className="action-preview-caption">現在</small>
                  {title ? <span className="action-preview-current">{getString(title.value)}</span> : null}
                  <span className="action-preview-excerpt">{excerpt || (!title ? action.description : "")}</span>
                  {action.sectionId === "site-settings" ? <small>他のページにも反映</small> : null}
                </span>
                <span className="action-preview-choice"><Pencil size={15} /> 編集する</span>
              </button>
            </article>
          );
        })}
        {activePage.page === "EVENT SCHEDULE" && group === "SNS投稿の下書き" ? <FacebookEventSocialDraftPanel /> : null}
      </div>
    );
  }

  if (selectedPage === "DETAILS") {
    return (
      <div className="dashboard" ref={detailsArea} tabIndex={-1} aria-label="詳細設定">
        {editor ? <div ref={editingArea} tabIndex={-1} className="visual-editor-form" aria-label="編集中の項目">{editor}</div> : <>
          <div className="page-heading"><h1>詳細設定</h1><p>保守・ページ構成</p></div>
          {hasSetupProblem ? <SetupStatus health={health} /> : null}
          <OperationsHealthPanel />
          <OpsStatusPanel status={opsStatus} onRetry={onRefreshOps} onSelect={(id) => onSelect({ id })} />
          <DashboardSectionGroup title="ページ構成" description="" sections={maintenanceSections} onSelect={(id) => onSelect({ id })} compact />
        </>}
      </div>
    );
  }

  if (!editor) return <>
    {lastDeploy?.sectionId === "events" && Date.parse(lastDeploy.requestedAt || "") > Date.now() - 86400000 ? <details className="last-event-publication">
      <summary>前回のイベント掲載を確認：{lastDeploy.eventDelivery?.event?.title || lastDeploy.sourceLabel}</summary>
      <DeployStatusCard key={lastDeploy.requestId || lastDeploy.requestedAt} notice={lastDeploy} onRetry={onDeployNotice} onOpenSocialDrafts={onOpenSocialDrafts} />
    </details> : null}
    <VisualPageEditor page={selectedPage} onLegacySelect={value=>onSelect({...value,sourcePage:selectedPage})} onState={onEditorState} />
  </>;

  return (
    <div className="dashboard">
      <div className="page-heading workspace-heading">
        <div>
          <p className="eyebrow">{activePage.title}</p>
          <p className="workspace-location" aria-label="現在の編集場所">{activeEditLabel || activePage.title}</p>
        </div>
        <a className="secondary-button site-link-button" href={publicSiteUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          公開サイトを開く
        </a>
      </div>

      {!calendarEditor ? <ol className="workspace-steps" aria-label="操作の流れ">
        <li><span>1</span>ページ</li>
        <li><span>2</span>編集箇所</li>
        <li aria-current="step"><span>3</span>編集・掲載</li>
      </ol> : null}

      <div className={`visual-editor-workspace${calendarEditor ? " event-entry-workspace" : ""}`}>
        <div className="visual-editor-center">
          {editor ? <div ref={editingArea} tabIndex={-1} className="visual-editor-form" aria-label="編集中の項目">{editor}</div> : null}
        </div>
        {!calendarEditor ? <aside className="visual-editor-sidebar" aria-label="選択箇所の編集">
            <OpsStatusPanel status={relevantStatus} onRetry={onRefreshOps} onSelect={(id) => onSelect({ id })} />
            <section className="page-section-picker" aria-label={activePage.page + "の編集セクション"}>
              <div className="page-section-heading">
                <div>
                  <strong>{selection ? selection.layout.key.startsWith("custom-") ? selection.layout.heading : expandedGroup : "編集する場所を選ぶ"}</strong>
                  <p>{selection ? "" : "写真・文章を選択"}</p>
                </div>
                <a className="public-page-link" href={resolvePublicUrl(activePage.publicPath, publicSiteUrl)} target="_blank" rel="noreferrer" aria-label={activePage.publicLabel}>
                  <ExternalLink size={14} />
                </a>
              </div>
              {selection && expandedGroup ? renderActions(selection.actions, expandedGroup) : null}
              {overviewError ? <p role="status">一部の編集データを取得できませんでした。</p> : null}
              <details className="visual-editor-section-list">
                <summary>編集箇所一覧</summary>
                <div className="page-section-list">
                  {orderedGroups.map(([group, { layout: row }]) => (
                    <button key={group} type="button" className="page-option-toggle"
                      aria-expanded={expandedGroup === group} onClick={() => onGroupChange(group)}>
                      <span className="page-overview-label">
                        <strong>{row.key.startsWith("custom-") ? row.heading : group}</strong>
                        {row.hidden ? <small className="page-overview-hidden">公開ページでは非表示</small> : null}
                      </span>
                    </button>
                  ))}
                </div>
              </details>
              {pageKey ? (
                <button type="button" className="secondary-button compact" onClick={() => selectAction({
                  label: "案内・告知を追加する", description: "", sectionId: "custom-sections", initialDraft: { page: pageKey }, itemId: "new"
                }, "追加の案内")}>案内・告知を追加する</button>
              ) : null}
            </section>
        </aside> : null}
      </div>

      {hasSetupProblem ? <SetupStatus health={health} /> : null}
    </div>
  );
}

export default function AdminClient() {
  const [editorState, setEditorState] = useState({ dirty: false, busy: false });
  const editorStateRef=useRef(editorState);
  const rememberEditorState=useCallback((value:{dirty:boolean;busy:boolean})=>{editorStateRef.current=value;setEditorState(value);},[]);
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSectionState | null>(null);
  const [dashboardPage, setDashboardPage] = useState(adminPages[0].page);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [lastDeploy, setLastDeploy] = useState<Notice | undefined>();
  useEffect(() => {
    const removed = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== lastDeploy?.eventDelivery?.socialEventId) return;
      setLastDeploy(undefined);
      try { window.localStorage.removeItem("bassic-admin-last-deploy"); } catch { /* The visible result is still cleared. */ }
    };
    window.addEventListener("bassic-event-removed", removed);
    return () => window.removeEventListener("bassic-event-removed", removed);
  }, [lastDeploy]);
  const [sessionError, setSessionError] = useState("");
  const [health, setHealth] = useState<HealthState | undefined>();
  const [opsStatus, setOpsStatus] = useState<OpsStatus | undefined>();

  async function loadOpsStatus() {
    setOpsStatus(undefined);
    try {
      const response = await fetchWithTimeout("/api/ops-status", { cache: "no-store" }, 10000);
      const result = (await response.json().catch(() => null)) as ApiResult<OpsStatus> | null;
      setOpsStatus(response.ok && result?.ok && Array.isArray(result.data?.alerts) ? result.data : { generatedAt: new Date().toISOString(), alerts: [], loadError: true });
    } catch {
      setOpsStatus({ generatedAt: new Date().toISOString(), alerts: [], loadError: true });
    }
  }

  async function checkSession() {
    setChecking(true);
    setSessionError("");
    try {
      const sessionResponse = await fetchWithTimeout("/api/session", { cache: "no-store" }, 8000);
      const result = (await sessionResponse.json()) as { authenticated?: boolean };
      const isAuthenticated = Boolean(result.authenticated);

      setAuthenticated(isAuthenticated);
      if (isAuthenticated) {
        const healthResponse = await fetchWithTimeout("/api/health", { cache: "no-store" }, 8000);
        if (!healthResponse.ok) {
          throw new Error("Could not load authenticated health status.");
        }
        setHealth((await healthResponse.json()) as HealthState);
        await loadOpsStatus();
      } else {
        setHealth(undefined);
        setOpsStatus(undefined);
      }
    } catch {
      setSessionError("管理画面の設定を確認しています。再読み込みしても直らない場合は担当者に連絡してください。");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkSession();
    try {
      const savedDeployNotice = window.localStorage.getItem("bassic-admin-last-deploy");
      if (savedDeployNotice) {
        const parsed = JSON.parse(savedDeployNotice) as Partial<Notice> | null;
        const delivery = parsed?.eventDelivery;
        const event = delivery?.event;
        const safeStrings = ["actionsUrl", "requestId", "sectionId", "requestedAt", "sourceLabel"] as const;
        if (parsed && ["success", "error", "info"].includes(parsed.tone || "") && typeof parsed.message === "string" &&
            safeStrings.every(key => parsed[key] === undefined || typeof parsed[key] === "string") &&
            (parsed.confirmationSteps === undefined || (Array.isArray(parsed.confirmationSteps) && parsed.confirmationSteps.every(step => typeof step === "string"))) &&
            (!delivery || (typeof delivery.calendar === "string" && typeof delivery.social === "string" &&
              (!event || ([event.id, event.title, event.date, event.startTime].every(value => typeof value === "string") &&
                [event.endTime, event.sourceUrl, event.imageUrl, event.performers, event.price, event.reservation, event.openTime, event.syncKey].every(value => value === undefined || typeof value === "string")))))) {
          setLastDeploy(parsed as Notice);
        }
      }
    } catch {
      // Browser storage may be disabled or contain an incomplete old value.
      // Authentication and current CMS data do not depend on that optional copy.
    }
  }, []);

  useEffect(() => {
    if (authenticated && !activeSection) {
      void loadOpsStatus();
    }
  }, [authenticated, activeSection]);

  async function logout() {
    if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
    await fetch("/api/logout", { method: "POST" });
    setAuthenticated(false);
    setActiveSection(null);
    setHealth(undefined);
    setOpsStatus(undefined);
  }

  function rememberDeployNotice(notice: Notice) {
    setLastDeploy(notice);
    try {
      window.localStorage.setItem("bassic-admin-last-deploy", JSON.stringify(notice));
    } catch {
      // The request succeeded even when browser storage is unavailable.
    }
  }

  function openRelatedSocialDrafts(sourceId: string) {
    if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
    setDashboardPage("EVENT SCHEDULE");
    setExpandedGroup("SNS投稿の下書き");
    setActiveSection({ id: "social-notices", relatedEventId: sourceId, editLabel: "イベント追加 → SNS用の文面を使う", sourcePage: "EVENT SCHEDULE" });
  }

  if (checking) {
    return (
      <main className="loading-shell">
        <Loader2 className="spin" size={32} />
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">Bassic. 管理画面</p>
          <h1>読み込みできません</h1>
          <p className="form-error">{sessionError}</p>
          <button className="primary-button" type="button" onClick={() => void checkSession()}>
            <RefreshCw size={18} />
            再読み込み
          </button>
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => void checkSession()} health={health} />;
  }

  return (
    <main className="admin-shell">
      <header className="app-header">
        <button className="brand-button" type="button" disabled={editorState.busy} onClick={() => {
          if (!activeSection || confirmLeavingEditor(editorState.dirty, editorState.busy)) setActiveSection(null);
        }}>
          Bassic.
        </button>
        <button className="text-button" type="button" disabled={editorState.busy} onClick={() => void logout()}>
          <LogOut size={18} />
          ログアウト
        </button>
      </header>
      <div className="admin-workspace">
        <nav className="admin-page-nav" aria-label="編集するページ">
          <p>ページを選ぶ</p>
          <div className="admin-page-nav-list">
            {adminPages.map((page) => (
              <button
                key={page.page}
                type="button"
                aria-current={dashboardPage === page.page ? "page" : undefined}
                disabled={editorState.busy}
                onClick={() => {
                  if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
                  setActiveSection(null);
                  if (page.page !== dashboardPage) setExpandedGroup(null);
                  setDashboardPage(page.page);
                }}
              >
                {page.title}
              </button>
            ))}
          </div>
          <div className="admin-shortcuts">
            <p>Googleカレンダーの更新</p>
            <button className="event-add-button" type="button" disabled={editorState.busy} onClick={() => {
              if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
              setDashboardPage("EVENT SCHEDULE");
              setExpandedGroup("開催イベント");
              setActiveSection({ id: "events", itemId: "new", eventEntry: true, initialDraft: { isPublished: false }, editLabel: "イベント追加", sourcePage: "EVENT SCHEDULE" });
            }}><Plus size={18} /> イベントを追加</button>
            <button className="secondary-button closed-day-add-button" type="button" disabled={editorState.busy} onClick={() => {
              if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
              setDashboardPage("EVENT SCHEDULE");
              setExpandedGroup(null);
              setActiveSection({ id: "closed-days", editLabel: "店休日を追加", sourcePage: "EVENT SCHEDULE" });
            }}><Plus size={18} /> 店休日を追加</button>
          </div>
          <div className="admin-shortcuts">
            <a className="analytics-link" href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer" aria-label="アクセス解析（別タブで開く）">
              アクセス解析 <ExternalLink size={16} aria-hidden="true" />
            </a>
            <button type="button" aria-current={dashboardPage === "DETAILS" ? "page" : undefined} disabled={editorState.busy} onClick={() => {
              if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
              setActiveSection(null);
              setExpandedGroup(null);
              setDashboardPage("DETAILS");
            }}>詳細設定</button>
            {opsStatus?.loadError ? <small>確認項目を読み込めませんでした</small> : opsStatus?.alerts.length ? <small>要確認 {opsStatus.alerts.length}件</small> : null}
          </div>
        </nav>
        <div className="admin-workspace-content">
          <PageBasedDashboard
            onSelect={(next) => {
              if (!confirmLeavingEditor(editorStateRef.current.dirty, editorStateRef.current.busy)) return;
              setActiveSection(next);
            }}
            selectedPage={dashboardPage}
            expandedGroup={expandedGroup}
            onGroupChange={(group) => {
              if (!confirmLeavingEditor(editorState.dirty, editorState.busy)) return;
              setActiveSection(null);
              setExpandedGroup(group);
            }}
            lastDeploy={lastDeploy}
            onDeployNotice={rememberDeployNotice}
            onOpenSocialDrafts={openRelatedSocialDrafts}
            onEditorState={rememberEditorState}
            health={health}
            opsStatus={opsStatus}
            onRefreshOps={() => void loadOpsStatus()}
            activeEditLabel={activeSection?.editLabel}
            editor={activeSection?.id === "closed-days" ? (
              <ClosedDayForm onBack={() => {
                if (confirmLeavingEditor(editorState.dirty, editorState.busy)) setActiveSection(null);
              }} onEditorState={rememberEditorState} />
            ) : activeSection ? (
              <SectionEditor
                key={JSON.stringify(activeSection)}
                sectionId={activeSection.id}
                initialDraft={activeSection.initialDraft}
                homeGroup={activeSection.homeGroup}
                fieldKeys={activeSection.fieldKeys}
                itemId={activeSection.itemId}
                editLabel={activeSection.editLabel}
                previewContext={activeSection.previewContext}
                sourcePage={activeSection.sourcePage}
                eventEntry={activeSection.eventEntry}
                relatedEventId={activeSection.relatedEventId}
                onOpenSocialDrafts={openRelatedSocialDrafts}
                onBack={() => setActiveSection(null)}
                onEditorState={rememberEditorState}
                onDeployNotice={rememberDeployNotice}
              />
            ) : undefined}
          />
        </div>
      </div>
    </main>
  );
}
