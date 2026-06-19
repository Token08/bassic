"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  ExternalLink,
  Info,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Upload,
  X
} from "lucide-react";
import { getSection, sections, type FieldDefinition, type SectionDefinition } from "@/lib/admin-schema";

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
  actionsUrl?: string;
  requestedAt?: string;
  sourceLabel?: string;
};

type HealthCheck = {
  key: string;
  label: string;
  present: boolean;
  requiredFor: "login" | "save" | "publish";
};

type HealthState = {
  ok: boolean;
  checks: HealthCheck[];
  missing: HealthCheck[];
};

type SnsStatus = {
  instagramUrlSet: boolean;
  facebookUrlSet: boolean;
  xUrlSet: boolean;
  instagramWidgetSet: boolean;
  publishedCount: number;
  draftCount: number;
  latestUpdatedAt?: string;
  staticFeedAvailable: boolean;
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
};

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

function getPublicPageUrl(section: SectionDefinition) {
  const path = publicPagePaths[section.id];

  if (!path) {
    return "";
  }

  return new URL(path, publicSiteUrl).toString();
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

function getNumber(value: unknown) {
  return typeof value === "number" ? String(value) : getString(value);
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

function isValidWholeNumber(value: string) {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) && Number(trimmed) >= 0;
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
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
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
      ? "入力内容は画面に残っています。赤い表示を確認して、直してからもう一度押してください。"
      : notice.tone === "info"
        ? "このまま画面を閉じずに、少し待ってください。"
        : "反映には1〜3分ほどかかることがあります。少し待ってから公開サイトを開き、再読み込みして確認してください。";

  return (
    <div className={`notice ${notice.tone}`}>
      <Icon size={20} />
      <div>
        <span>{notice.message}</span>
        <small>{helper}</small>
      </div>
      <div className="notice-actions">
        {notice.actionsUrl ? (
          <a href={notice.actionsUrl} target="_blank" rel="noreferrer">
            反映状況を見る
          </a>
        ) : null}
        <a href={publicSiteUrl} target="_blank" rel="noreferrer">
          公開サイトを開く
        </a>
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

function DeployStatusCard({ notice }: { notice?: Notice }) {
  if (!notice) {
    return null;
  }

  const label = notice.tone === "success" ? "反映中" : notice.tone === "error" ? "反映に確認が必要" : "処理中";
  const timeLabel = formatDeployTime(notice.requestedAt);

  return (
    <section className={`deploy-status ${notice.tone}`} aria-label="最後の反映状況">
      <div>
        <strong>最後の公開操作</strong>
        <span>{notice.sourceLabel || "管理画面から公開"}</span>
      </div>
      <div>
        <strong>{label}</strong>
        <span>{timeLabel ? `${timeLabel} に実行。1〜3分後に公開サイトを再読み込みして確認してください。` : "時刻は未取得です。公開サイトを再読み込みして確認してください。"}</span>
      </div>
      <div className="deploy-status-actions">
        {notice.actionsUrl ? (
          <a href={notice.actionsUrl} target="_blank" rel="noreferrer">
            反映状況を見る
          </a>
        ) : null}
        <a href={publicSiteUrl} target="_blank" rel="noreferrer">
          公開サイトを開く
        </a>
      </div>
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

  if (health.ok) {
    return (
      <div className="setup-status ready">
        <CheckCircle2 size={18} />
        <div>
          <strong>本番設定はそろっています。</strong>
          <span>ログイン、保存、公開反映の準備ができています。</span>
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

function SnsStatusCard() {
  const [status, setStatus] = useState<SnsStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    requestJson<SnsStatus>("/api/social-status")
      .then((response) => {
        if (mounted) {
          setStatus(response.data || null);
        }
      })
      .catch((statusError) => {
        if (mounted) {
          setError(statusError instanceof Error ? statusError.message : "SNS状況を確認できませんでした。");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="sns-status-card warning">
        <div>
          <strong>SNS状況</strong>
          <span>{error}</span>
        </div>
      </section>
    );
  }

  if (!status) {
    return (
      <section className="sns-status-card">
        <Loader2 className="spin" size={18} />
        <span>SNS状況を確認しています</span>
      </section>
    );
  }

  const latest = status.latestUpdatedAt ? formatDeployTime(status.latestUpdatedAt) : "未取得";
  const checks = [
    { label: "Instagram URL", ok: status.instagramUrlSet },
    { label: "Facebook URL", ok: status.facebookUrlSet },
    { label: "X URL", ok: status.xUrlSet },
    { label: "Instagram一覧表示", ok: status.instagramWidgetSet },
    { label: "外部取得データ", ok: status.staticFeedAvailable }
  ];

  return (
    <section className="sns-status-card">
      <div className="sns-status-heading">
        <strong>SNS状況</strong>
        <span>公開 {status.publishedCount}件 / 下書き {status.draftCount}件 / 最終更新 {latest}</span>
      </div>
      <div className="sns-status-grid">
        {checks.map((item) => (
          <span className={item.ok ? "is-ready" : "needs-work"} key={item.label}>
            {item.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {item.label}
          </span>
        ))}
      </div>
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

function Dashboard({ onSelect, lastDeploy, health }: { onSelect: (id: string) => void; lastDeploy?: Notice; health?: HealthState }) {
  const dailySections = sections.filter((section) => dailySectionIds.has(section.id));
  const maintenanceSections = sections.filter((section) => !dailySectionIds.has(section.id));

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Bassic. Admin</p>
          <h1>更新する場所を選ぶ</h1>
          <p>大きなボタンから選んで、入力、確認、公開の順に進めます。</p>
        </div>
        <a className="secondary-button site-link-button" href={publicSiteUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          公開サイトを開く
        </a>
      </div>

      <section className="guide-strip" aria-label="操作の流れ">
        <div>
          <strong>1. 選ぶ</strong>
          <span>更新したい場所を押す</span>
        </div>
        <div>
          <strong>2. 入力</strong>
          <span>必須だけ埋めればOK</span>
        </div>
        <div>
          <strong>3. 確認</strong>
          <span>プレビューで見直す</span>
        </div>
        <div>
          <strong>4. 反映</strong>
          <span>プレビューして公開</span>
        </div>
      </section>

      <section className="client-help-strip" aria-label="お店側向けの注意">
        <div>
          <Info size={18} />
          <strong>反映には1〜3分かかります</strong>
          <span>公開後すぐに変わらない時は、少し待ってから公開サイトを再読み込みしてください。</span>
        </div>
        <div>
          <Save size={18} />
          <strong>下書きはサイトに出ません</strong>
          <span>公開したい時は「プレビューして公開」を押し、公開サイトで確認します。</span>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <strong>困った時は引き渡しメモへ</strong>
          <span>連絡先、管理画面URL、ログイン方法は引き渡しメモにまとめます。</span>
        </div>
      </section>

      <SetupStatus health={health} />
      <DeployStatusCard notice={lastDeploy} />
      {lastDeploy ? <NoticeBox notice={lastDeploy} /> : null}
      <SnsStatusCard />

      <DashboardSectionGroup
        title="よく使う更新"
        description="お店側が普段触る場所です。イベント、画像、メニュー、SNSお知らせなどを更新できます。"
        sections={dailySections}
        onSelect={onSelect}
      />

      <DashboardSectionGroup
        title="保守向け設定"
        description="ページ構成や表示順を変える項目です。迷った時は保守担当者に相談してください。"
        sections={maintenanceSections}
        onSelect={onSelect}
        compact
      />
    </div>
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
  onChange
}: {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const common = {
    id: field.key,
    name: field.key
  };
  const urlValue = field.type === "url" ? getString(value).trim() : "";
  const canPreviewUrl = Boolean(urlValue) && isValidManagedUrl(urlValue);

  if (field.type === "hidden") {
    return null;
  }

  return (
    <label className={`field field-${field.type}`} htmlFor={field.key}>
      <span>
        {field.label}
        {field.required ? <b>必須</b> : null}
      </span>
      {field.type === "textarea" ? (
        <textarea
          {...common}
          rows={field.rows || 4}
          value={getString(value)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      {["text", "url", "date", "number"].includes(field.type) ? (
        <input
          {...common}
          type={field.type === "number" ? "number" : field.type}
          value={field.type === "number" ? getNumber(value) : getString(value)}
          onChange={(event) => onChange(field.type === "number" ? Number(event.target.value || 0) : event.target.value)}
          placeholder={field.placeholder}
        />
      ) : null}
      {canPreviewUrl ? (
        <a className="field-link-check" href={urlValue} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          リンクを開いて確認
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
      {field.type === "image" ? <ImageField value={value} onChange={onChange} /> : null}
      {field.hint ? <small className="field-hint">{field.hint}</small> : null}
      {error ? <small className="form-error">{error}</small> : null}
    </label>
  );
}

function ImageField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const image = isImageObject(value) ? value : { url: getString(value) };
  const url = image.url || "";
  const trimmedUrl = url.trim();
  const canPreviewImageUrl = Boolean(trimmedUrl) && isValidManagedUrl(trimmedUrl);

  function removeImage() {
    if (!window.confirm("この画像を外しますか？下書き保存または公開するまではサイトには反映されません。")) {
      return;
    }

    onChange(undefined);
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/media", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as ApiResult<{ url: string }>;

      if (!response.ok || !result.ok || !result.data?.url) {
        throw new Error(result.message || "画像をアップロードできませんでした。");
      }

      onChange({ url: result.data.url, alt: image.alt || "" });
      setUploadMessage("画像をアップロードしました。まだ公開サイトには反映されていません。画像を開いて確認し、下書き保存またはプレビューして公開してください。");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "画像をアップロードできませんでした。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-field">
      {url ? (
        <div className="image-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={image.alt || ""} />
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

              if (file) {
                void upload(file);
              }
            }}
          />
        </label>
      </div>
      <p className="field-hint">画像はアップロードするか、https:// または /assets/ から始まるURLを入れてください。公開前に「画像を開いて確認」で正しい画像を確認します。横長画像は1600px以上がおすすめです。</p>
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
  const missingLabels = requiredFields.filter((field) => !fieldHasValue(field, draft[field.key])).map((field) => field.label);

  return (
    <div className={`required-progress ${remaining === 0 ? "complete" : ""}`}>
      <strong>必須 {completed}/{requiredFields.length} 入力済み</strong>
      <span>{remaining === 0 ? "必須項目はそろっています。公開前チェックへ進めます。" : `あと${remaining}件の必須項目を入れると、プレビュー確認へ進めます。`}</span>
      {missingLabels.length ? <small>未入力: {missingLabels.join("、")}</small> : null}
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

  return (
    <div className="current-edit-summary" aria-label="現在編集中の内容">
      <div>
        <span>編集中</span>
        <strong>{itemLabel}</strong>
      </div>
      <div className="current-edit-badges">
        {dirty ? <small className="dirty-pill">未保存</small> : <small className="saved-pill">保存済み</small>}
        {hasPublishToggle ? (
          <small className={isPublished(draft) ? "status-public" : "status-draft"}>
            {isPublished(draft) ? "公開するON" : "公開するOFF"}
          </small>
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
      "公開後にスマホでTOPとAccessを確認する"
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
    <section className="edit-focus-tips" aria-label="編集前に見るポイント">
      <strong>先に見るポイント</strong>
      <ul>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </section>
  );
}

function PreviewModal({
  draft,
  section,
  onClose,
  onPublish
}: {
  draft: Draft;
  section: SectionDefinition;
  onClose: () => void;
  onPublish: () => void;
}) {
  const hasPublishToggle = section.fields.some((field) => field.key === "isPublished");
  const publishToggleOff = hasPublishToggle && !Boolean(draft.isPublished);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="preview-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{section.title}</h2>
            <p>公開前に、入力内容・リンク先・画像を確認してください。公開後はPCだけでなくスマホでも見てください。</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <dl className="preview-list">
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
        </dl>
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
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            戻って直す
          </button>
          <button className="primary-button" type="button" onClick={onPublish}>
            <CheckCircle2 size={18} />
            {publishToggleOff ? "保存して反映（この項目は非表示）" : "この内容で公開"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorGuide({ section, dirty, selectedId }: { section: SectionDefinition; dirty: boolean; selectedId: string }) {
  const isNewListItem = section.kind === "list" && selectedId === "new";
  const sectionPublicUrl = getPublicPageUrl(section);

  return (
    <section className="editor-guide" aria-label="編集の進め方">
      <div>
        <strong>{section.kind === "list" ? (isNewListItem ? "新規作成中" : "選択中の項目を編集") : "このページを編集"}</strong>
        <span>{dirty ? "入力中です。移動前に保存してください。" : "保存済みです。必要なところだけ直せます。"}</span>
      </div>
      <div>
        <strong>下書き保存</strong>
        <span>サイトには出さず、入力内容だけ残します。途中保存や後で確認したい時に使います。</span>
      </div>
      <div>
        <strong>プレビューして公開</strong>
        <span>「公開する」がONの項目を、内容確認のあと公開サイトへ反映します。</span>
      </div>
      {sectionPublicUrl ? (
        <div className="public-page-guide">
          <strong>確認するページ</strong>
          <span>公開後はこのページを開き、再読み込みします。最後にスマホでも表示を確認します。</span>
          <a href={sectionPublicUrl} target="_blank" rel="noreferrer">
            公開ページを開く
            <ExternalLink size={14} />
          </a>
        </div>
      ) : null}
    </section>
  );
}

function SaveChoiceGuide() {
  return (
    <div className="save-choice-guide" aria-label="保存方法の違い">
      <div>
        <strong>下書き保存</strong>
        <span>サイトには出さず、入力内容だけ残します。途中保存や後で確認したい時に使います。</span>
      </div>
      <div>
        <strong>プレビューして公開</strong>
        <span>「公開する」がONの項目を、確認画面を見てから公開サイトへ反映します。</span>
      </div>
    </div>
  );
}

function SocialNoticeUrlGuide({ draft }: { draft: Draft }) {
  const platform = getString(draft.platform) || "instagram";
  const currentUrl = getString(draft.url).trim();
  const currentUrlError = getSocialUrlError(platform, currentUrl);
  const guides: Record<string, { label: string; example: string; note: string }> = {
    instagram: {
      label: "Instagram",
      example: "https://www.instagram.com/bassic_official/",
      note: "プロフィールURLか、見せたい投稿を開いた時のURLを入れます。"
    },
    facebook: {
      label: "Facebook",
      example: "https://www.facebook.com/bar.Bassic/",
      note: "Facebookページか、見せたい投稿・イベントを開いた時のURLを入れます。"
    },
    x: {
      label: "X",
      example: "https://x.com/bar_Bassic",
      note: "Xアカウントか、見せたい投稿を開いた時のURLを入れます。"
    }
  };
  const guide = guides[platform] || guides.instagram;

  return (
    <section className="social-notice-url-guide" aria-label="SNSお知らせURLの入力例">
      <Info size={18} />
      <div>
        <strong>{guide.label}のURLを入力してください</strong>
        <span>{guide.note}</span>
        <code>{guide.example}</code>
        {currentUrl ? (
          <small className={currentUrlError ? "form-error" : "form-success"}>
            {currentUrlError || "選んだSNSとURLの種類は合っています。"}
          </small>
        ) : (
          <small>リンクURLを入れると、SNSの種類が合っているかここに表示します。</small>
        )}
      </div>
    </section>
  );
}

function FacebookEventImportPanel({
  draft,
  onApply
}: {
  draft: Draft;
  onApply: (values: Draft) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<FacebookEventPreview | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const sourceUrl = getString(draft.sourceUrl).trim();
  const isFacebookEvent = isFacebookEventUrl(sourceUrl);
  const previewHasInvalidTime = Boolean(
    preview && ((preview.startTime && !isValidEventTime(preview.startTime)) || (preview.endTime && !isValidEventTime(preview.endTime)))
  );
  const previewNeedsDateInput = Boolean(preview && (!(preview.date && preview.startTime) || previewHasInvalidTime));
  const previewChecks = preview
    ? [
        { label: "タイトル", ok: Boolean(preview.title), text: preview.title || "手入力してください" },
        {
          label: "日付・START",
          ok: Boolean(preview.date && preview.startTime && !previewHasInvalidTime),
          text: preview.date
            ? `${preview.date}${preview.startTime ? ` ${preview.startTime}` : ""}${preview.endTime ? `-${preview.endTime}` : ""}`
            : "日付とSTARTは入力欄で確認してください。ENDがある場合も19:00形式で確認してください"
        },
        { label: "画像", ok: Boolean(preview.imageUrl), text: preview.imageUrl ? "取得済み" : "画像が必要な場合は手入力してください" },
        { label: "FacebookイベントURL", ok: Boolean(preview.sourceUrl), text: preview.sourceUrl || sourceUrl }
      ]
    : [];
  const currentTitle = getString(draft.title).trim();
  const currentDate = getString(draft.date).trim();
  const currentStartTime = getString(draft.startTime).trim();
  const currentEndTime = getString(draft.endTime).trim();
  const currentImageUrl = getImageUrl(draft.image);
  const calendarRequestMissingLabels = preview
    ? [
        !currentTitle && !preview.title ? "イベント名" : "",
        !currentDate && !preview.date ? "日付" : "",
        !currentStartTime && !preview.startTime ? "START" : "",
        !sourceUrl && !preview.sourceUrl ? "FacebookイベントURL" : "",
        !currentImageUrl && !preview.imageUrl ? "画像URL" : ""
      ].filter(Boolean)
    : [];
  const calendarRequestBlockingLabels = preview
    ? [
        !currentTitle && !preview.title ? "イベント名" : "",
        !currentDate && !preview.date ? "日付" : "",
        !currentStartTime && !preview.startTime ? "START" : ""
      ].filter(Boolean)
    : [];
  const calendarRequestText = preview
    ? [
        "Google Calendarにも反映してください。",
        `イベント名: ${currentTitle || preview.title || "未入力"}`,
        `日付: ${currentDate || preview.date || "未入力"}`,
        `START: ${currentStartTime || preview.startTime || "未入力"}`,
        `END: ${currentEndTime || preview.endTime || "未入力"}`,
        `FacebookイベントURL: ${sourceUrl || preview.sourceUrl || "未入力"}`,
        `画像URL: ${currentImageUrl || preview.imageUrl || "未入力"}`
      ].join("\n")
    : "";
  const calendarRequestHasMissingFields = calendarRequestMissingLabels.length > 0;
  const calendarRequestCannotCopy = calendarRequestBlockingLabels.length > 0;

  useEffect(() => {
    if (copyMessage) {
      setCopyMessage("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarRequestText]);

  async function importEvent() {
    setLoading(true);
    setMessage("");
    setCopyMessage("");
    setPreview(null);

    try {
      const result = await requestJson<FacebookEventPreview>("/api/facebook-event-preview", {
        method: "POST",
        body: JSON.stringify({ url: sourceUrl })
      });
      const data = result.data;

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

      if (data.startTime) {
        nextValues.startTime = isValidEventTime(data.startTime) ? data.startTime : "";
      }

      if (data.endTime) {
        nextValues.endTime = isValidEventTime(data.endTime) ? data.endTime : "";
      }

      if (data.imageUrl) {
        nextValues.image = { url: data.imageUrl, alt: data.title || "Facebookイベント画像" };
      }

      onApply(nextValues);
      setPreview(data);
      setMessage(
        data.date && data.startTime
          ? "読み取りました。タイトル、日付、START、画像を確認してください。"
          : "タイトルと画像を読み取りました。日付とSTARTは手入力で確認してください。"
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Facebookから読み取れませんでした。手入力してください。");
    } finally {
      setLoading(false);
    }
  }

  async function copyCalendarRequest() {
    if (!calendarRequestText) {
      return;
    }

    if (calendarRequestCannotCopy) {
      setCopyMessage(`コピー前に ${calendarRequestBlockingLabels.join("、")} を入力してください。`);
      return;
    }

    try {
      await navigator.clipboard.writeText(calendarRequestText);
      setCopyMessage("コピーしました。担当者へのメッセージに貼り付けてください。");
    } catch {
      setCopyMessage("コピーできませんでした。下のメモを選択してコピーしてください。");
    }
  }

  return (
    <section className="facebook-import-panel" aria-label="Facebookイベント取り込み">
      <div className="facebook-import-heading">
        <div>
          <strong>Facebookイベントを取り込む</strong>
          <span>詳細URLにFacebookイベントURLを入れてから押すと、タイトル、画像、日付、STARTを読み取ります。</span>
          <span>公開前に「日付」と「START」が入っているか必ず確認してください。</span>
          <span>Google Calendarへ載せたい場合は、イベント公開後に「イベント名」「日付」「START」と一緒に保守担当者へ反映依頼してください。</span>
        </div>
        <button className="secondary-button" type="button" disabled={!isFacebookEvent || loading} onClick={() => void importEvent()}>
          {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          Facebookから読み取る
        </button>
      </div>
      {!isFacebookEvent ? (
        <small>
          {sourceUrl
            ? "Facebookのイベント一覧ではなく、個別イベントページのURLを入力してください。例: https://www.facebook.com/events/1234567890/"
            : "先に「FacebookイベントURL・詳細URL」へ FacebookイベントURL を入力してください。"}
        </small>
      ) : null}
      {message ? <small className={preview && !previewNeedsDateInput ? "import-success" : "import-warning"}>{message}</small> : null}
      {preview ? (
        <div className="facebook-import-preview">
          {preview.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.imageUrl} alt={preview.title || "Facebookイベント画像"} />
          ) : null}
          <div>
            <strong>{preview.title || "タイトル未取得"}</strong>
            <span>
              {preview.date
                ? `${preview.date}${preview.startTime ? ` ${preview.startTime}` : ""}${preview.endTime ? `-${preview.endTime}` : ""}`
                : "日付とSTARTは入力欄で確認してください"}
            </span>
            {previewNeedsDateInput ? (
              <div className="facebook-import-date-warning" role="status">
                <AlertCircle size={16} />
                <span>日付またはSTARTが自動取得できませんでした。START/ENDは「19:00」の形で手入力してください。</span>
              </div>
            ) : null}
            <ul className="facebook-import-checklist" aria-label="読み取り結果の確認">
              {previewChecks.map((check) => (
                <li key={check.label} className={check.ok ? "ok" : "needs-check"}>
                  {check.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>
                    <strong>{check.label}</strong>
                    {check.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="facebook-calendar-request" aria-label="Google Calendar反映依頼メモ">
              <div className="facebook-calendar-request-heading">
                <strong>Google Calendar反映依頼メモ</strong>
                <button type="button" disabled={calendarRequestCannotCopy} onClick={() => void copyCalendarRequest()}>
                  <Copy size={16} />
                  コピーする
                </button>
              </div>
              <span>下の内容を担当者へ送ると、カレンダー反映の確認がスムーズです。</span>
              {calendarRequestHasMissingFields ? (
                <small className="request-warning">
                  未入力があります。コピーする前に、{calendarRequestMissingLabels.join("、")} を確認してください。
                </small>
              ) : null}
              {copyMessage ? <small>{copyMessage}</small> : null}
              <textarea
                readOnly
                value={calendarRequestText}
                rows={7}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SectionEditor({
  sectionId,
  onBack,
  onDeployNotice
}: {
  sectionId: string;
  onBack: () => void;
  onDeployNotice: (notice: Notice) => void;
}) {
  const section = useMemo(() => getSection(sectionId), [sectionId]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [items, setItems] = useState<Array<Draft & { id?: string }>>([]);
  const [selectedId, setSelectedId] = useState<string>("object");
  const [draft, setDraft] = useState<Draft>(mergeDefaults(section));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemStatusFilter, setItemStatusFilter] = useState<"all" | "public" | "draft">("all");
  const loadTokenRef = useRef(0);
  const userInteractedRef = useRef(false);
  const isMaintenanceSection = !dailySectionIds.has(section.id);
  const isNewListItem = section.kind === "list" && selectedId === "new";

  const publishedCount = useMemo(() => items.filter((item) => isPublished(item)).length, [items]);
  const draftCount = items.length - publishedCount;
  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();

    return items.filter((item) => {
      const statusMatches =
        itemStatusFilter === "all" || (itemStatusFilter === "public" ? isPublished(item) : !isPublished(item));
      const textMatches = !query || getItemTitle(section, item).toLowerCase().includes(query);

      return statusMatches && textMatches;
    });
  }, [itemSearch, itemStatusFilter, items, section]);

  function confirmDiscardChanges() {
    if (!dirty) {
      return true;
    }

    return window.confirm("保存していない変更があります。移動すると入力内容が消えます。続けますか？");
  }

  async function load() {
    const loadToken = loadTokenRef.current + 1;
    loadTokenRef.current = loadToken;
    userInteractedRef.current = false;
    setLoading(true);
    setNotice(null);
    if (section.kind === "list") {
      setSelectedId("new");
      setDraft(mergeDefaults(section));
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
        if (contents.length) {
          setSelectedId(contents[0].id || "");
          setDraft(mergeDefaults(section, contents[0]));
        } else {
          setSelectedId("new");
          setDraft(mergeDefaults(section));
        }
      } else {
        setDraft(mergeDefaults(section, data as Draft));
      }
      setDirty(false);
      setLastSavedAt("");
    } catch (loadError) {
      if (loadToken !== loadTokenRef.current || userInteractedRef.current) {
        return;
      }

      setNotice({
        tone: "error",
        message: loadError instanceof Error ? loadError.message : "読み込みできませんでした。時間をおいて再度お試しください。"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function updateField(key: string, value: unknown) {
    userInteractedRef.current = true;
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
    setDirty(true);
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function applyImportedFacebookEvent(values: Draft) {
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

      if (!emptyValue && field.type === "number" && !isValidWholeNumber(getString(value))) {
        nextErrors[field.key] = `${field.label}は0以上の半角整数で入力してください。小数やマイナスは使えません。`;
      }

      if (!emptyValue && field.type === "image" && !isValidManagedUrl(getImageUrl(value).trim())) {
        nextErrors[field.key] = `${field.label}のURLは https:// または / から始まるURLを入力してください。`;
      }
    }

    if (section.id === "site-settings") {
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

      if (!getString(nextDraft.startTime).trim()) {
        nextErrors.startTime = "Facebookイベントを公開する前にSTARTを入力してください。";
      }
    }

    if (section.id === "social-notices") {
      const platform = getString(nextDraft.platform);
      const socialUrl = getString(nextDraft.url).trim();
      const socialUrlError = getSocialUrlError(platform, socialUrl);
      if (socialUrlError) {
        nextErrors.url = socialUrlError;
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
      if (!getString(nextDraft.price).trim()) {
        nextErrors.price = "フードを公開する前に料金を入力してください。";
      }

      if (!getImageUrl(nextDraft.image).trim()) {
        nextErrors.image = "フードを公開する前に画像を入れてください。";
      }
    }

    if (section.id === "party-plans" && nextDraft.isPublished) {
      if (countTextLength(nextDraft.title) < 4) {
        nextErrors.title = "公開する前に、プラン名を4文字以上で入力してください。";
      }

      if (countTextLength(nextDraft.body) < 12) {
        nextErrors.body = "公開する前に、説明を12文字以上で入力してください。";
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
    return Object.keys(nextErrors).length === 0;
  }

  function openPreview() {
    userInteractedRef.current = true;
    const valid = validate(draft);

    if (!valid) {
      setShowPreview(false);
      setNotice({ tone: "error", message: "必須項目を入力してから確認してください。" });
      return;
    }

    setNotice(null);
    setShowPreview(true);
  }

  async function save(mode: "draft" | "publish") {
    const nextDraft: Draft = {
      ...draft,
      ...(section.fields.some((field) => field.key === "isPublished") ? { isPublished: mode === "publish" } : {})
    };
    const sourceUrl = getString(nextDraft.sourceUrl).trim();
    const preparedDraft =
      section.id === "events" && isFacebookEventUrl(sourceUrl)
        ? {
            ...nextDraft,
            sourceType: "facebook"
          }
        : nextDraft;

    if (!validate(preparedDraft)) {
      setNotice({ tone: "error", message: "必須項目を入力してください。" });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const isExistingListItem = section.kind === "list" && selectedId && selectedId !== "new";
      const url = isExistingListItem ? `/api/content/${section.id}/${selectedId}` : `/api/content/${section.id}`;
      const result = await requestJson<Draft>(url, {
        method: isExistingListItem ? "PATCH" : "POST",
        body: JSON.stringify(preparedDraft)
      });
      const savedData = (result.data || preparedDraft) as Draft & { id?: string };
      setDraft(mergeDefaults(section, savedData));
      setDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));

      if (section.kind === "list") {
        const id = savedData.id || selectedId;
        setSelectedId(id || "new");
        setItems((current) => {
          const withoutOld = current.filter((item) => item.id !== id);
          return id ? [{ ...savedData, id }, ...withoutOld] : current;
        });
      }

      if (mode === "draft") {
        setNotice({ tone: "success", message: "下書き保存しました。公開するまでサイトには出ません。" });
        return;
      }

      setDeploying(true);
      setNotice({ tone: "info", message: "保存しました。サイトへ反映しています。1〜3分ほどお待ちください。" });

      try {
        const deployResult = await requestJson<{ actionsUrl: string; requestedAt: string }>("/api/deploy", {
          method: "POST",
          body: JSON.stringify({})
        });
        const deployNotice = {
          tone: "success" as const,
          message: "公開しました。1〜3分ほど待ってから公開サイトを再読み込みして確認してください。",
          actionsUrl: deployResult.data?.actionsUrl,
          requestedAt: deployResult.data?.requestedAt || new Date().toISOString(),
          sourceLabel: `${section.shortTitle}を公開`
        };
        setNotice(deployNotice);
        onDeployNotice(deployNotice);
      } catch (deployError) {
        const deployNotice = {
          tone: "error" as const,
          message:
            deployError instanceof Error
              ? `${deployError.message} 保存は済んでいます。担当者へ「反映だけ失敗」と伝えてください。`
              : "保存は済んでいますが、公開サイトへの反映だけ失敗しました。担当者へ「反映だけ失敗」と伝えてください。",
          requestedAt: new Date().toISOString(),
          sourceLabel: `${section.shortTitle}を公開`
        };
        setNotice(deployNotice);
        onDeployNotice(deployNotice);
      }
    } catch (saveError) {
      setNotice({
        tone: "error",
        message:
          saveError instanceof Error
            ? `${saveError.message} もう一度試しても直らない場合は、担当者へこの画面の内容を伝えてください。`
            : "保存できませんでした。時間をおいて再度お試しください。直らない場合は担当者へこの画面の内容を伝えてください。"
      });
    } finally {
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
    setDraft(mergeDefaults(section));
    setErrors({});
    setNotice(null);
    setDirty(false);
  }

  return (
    <div className="editor">
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
          戻る
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
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
        {section.kind === "list" ? (
          <button className="secondary-button" type="button" onClick={startNewItem}>
            <Plus size={18} />
            {section.createLabel || "追加"}
          </button>
        ) : null}
      </div>

      <div className="helper-panel">
        <Info size={18} />
        <span>{section.helperText}</span>
      </div>
      {isMaintenanceSection ? (
        <div className="maintenance-warning">
          <AlertCircle size={18} />
          <span>ここは保守向け設定です。ページ構成や表示順に影響するため、分からない場合は保存せずに戻ってください。</span>
        </div>
      ) : null}

      {notice ? <NoticeBox notice={notice} /> : null}
      <EditorGuide section={section} dirty={dirty} selectedId={selectedId} />

      {loading ? (
        <div className="loading-panel">
          <Loader2 className="spin" size={28} />
          読み込み中
        </div>
      ) : (
        <div className="editor-layout">
          {section.kind === "list" ? (
            <aside className="item-list">
              <button className={selectedId === "new" ? "selected" : ""} type="button" onClick={startNewItem}>
                <Plus size={18} />
                新しく追加
              </button>
              <div className="item-list-tools" aria-label="一覧の絞り込み">
                <div className="item-counts">
                  <span>全部 {items.length}</span>
                  <span>公開 {publishedCount}</span>
                  <span>下書き {draftCount}</span>
                </div>
                <label>
                  探す
                  <input
                    type="search"
                    value={itemSearch}
                    onChange={(event) => setItemSearch(event.target.value)}
                    placeholder={`${section.shortTitle}を検索`}
                  />
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
              </div>
              {items.length ? (
                filteredItems.length ? (
                  filteredItems.map((item) => (
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
                        setDraft(mergeDefaults(section, item));
                        setErrors({});
                        setNotice(null);
                        setDirty(false);
                        setLastSavedAt("");
                      }}
                    >
                      <span>{getItemTitle(section, item)}</span>
                      <small className={isPublished(item) ? "status-public" : "status-draft"}>
                        {isPublished(item) ? "公開" : "下書き"}
                      </small>
                    </button>
                  ))
                ) : (
                  <div className="empty-list">条件に合う項目がありません。検索文字か公開状態を変えてください。</div>
                )
              ) : (
                <div className="empty-list">まだ登録がありません。上の「新しく追加」から作れます。</div>
              )}
            </aside>
          ) : null}

          <form
            className="edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              void save("draft");
            }}
          >
            <CurrentEditSummary section={section} draft={draft} dirty={dirty} selectedId={selectedId} />
            <RequiredProgress section={section} draft={draft} />
            <EditorFocusTips section={section} />
            {section.id === "events" ? <FacebookEventImportPanel draft={draft} onApply={applyImportedFacebookEvent} /> : null}
            {section.id === "social-notices" ? <SocialNoticeUrlGuide draft={draft} /> : null}
            {section.fields.map((field) => (
              <Field
                field={field}
                value={draft[field.key]}
                error={errors[field.key]}
                key={field.key}
                onChange={(value) => updateField(field.key, value)}
              />
            ))}
            <SaveChoiceGuide />
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={openPreview}>
                <Eye size={18} />
                プレビュー確認
              </button>
              <button className="secondary-button" type="button" disabled={saving || deploying} onClick={() => void save("draft")}>
                {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                下書き保存
              </button>
              <button className="primary-button" type="button" disabled={saving || deploying} onClick={openPreview}>
                {deploying ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                プレビューして公開
              </button>
              <small className="action-note">このボタンを押すと、まず確認画面が開きます。</small>
            </div>
          </form>
        </div>
      )}

      {showPreview ? (
        <PreviewModal draft={draft} section={section} onClose={() => setShowPreview(false)} onPublish={() => void save("publish")} />
      ) : null}
    </div>
  );
}

export default function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [lastDeploy, setLastDeploy] = useState<Notice | undefined>();
  const [sessionError, setSessionError] = useState("");
  const [health, setHealth] = useState<HealthState | undefined>();

  async function checkSession() {
    setChecking(true);
    setSessionError("");
    try {
      const [sessionResponse, healthResponse] = await Promise.all([
        fetch("/api/session", { cache: "no-store" }),
        fetch("/api/health", { cache: "no-store" })
      ]);
      const result = (await sessionResponse.json()) as { authenticated?: boolean };
      const healthResult = (await healthResponse.json()) as HealthState;

      setAuthenticated(Boolean(result.authenticated));
      setHealth(healthResult);
    } catch {
      setSessionError("管理画面の設定を確認しています。再読み込みしても直らない場合は担当者に連絡してください。");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkSession();
    const savedDeployNotice = window.localStorage.getItem("bassic-admin-last-deploy");
    if (savedDeployNotice) {
      try {
        setLastDeploy(JSON.parse(savedDeployNotice) as Notice);
      } catch {
        window.localStorage.removeItem("bassic-admin-last-deploy");
      }
    }
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setAuthenticated(false);
    setActiveSection(null);
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
    return <LoginScreen onLogin={() => setAuthenticated(true)} health={health} />;
  }

  return (
    <main className="admin-shell">
      <header className="app-header">
        <button className="brand-button" type="button" onClick={() => setActiveSection(null)}>
          Bassic.
        </button>
        <button className="text-button" type="button" onClick={() => void logout()}>
          <LogOut size={18} />
          ログアウト
        </button>
      </header>
      {activeSection ? (
        <SectionEditor
          sectionId={activeSection}
          onBack={() => setActiveSection(null)}
          onDeployNotice={(notice) => {
            setLastDeploy(notice);
            window.localStorage.setItem("bassic-admin-last-deploy", JSON.stringify(notice));
          }}
        />
      ) : (
        <Dashboard onSelect={setActiveSection} lastDeploy={lastDeploy} health={health} />
      )}
    </main>
  );
}
