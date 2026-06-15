"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
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
};

function isImageObject(value: unknown): value is { url?: string; alt?: string } {
  return typeof value === "object" && value !== null && "url" in value;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
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
    throw new Error(body.message || "通信に失敗しました。");
  }

  return body;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
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
        <label>
          パスワード
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="共有パスワード"
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

function Dashboard({ onSelect, lastDeploy }: { onSelect: (id: string) => void; lastDeploy?: Notice }) {
  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Bassic. Admin</p>
          <h1>更新する場所を選ぶ</h1>
        </div>
      </div>
      {lastDeploy ? (
        <div className={`notice ${lastDeploy.tone}`}>
          <CheckCircle2 size={20} />
          <span>{lastDeploy.message}</span>
          {lastDeploy.actionsUrl ? (
            <a href={lastDeploy.actionsUrl} target="_blank" rel="noreferrer">
              反映状況を見る
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="dashboard-grid">
        {sections.map((section) => {
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
    </div>
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
          公開する
        </span>
      ) : null}
      {field.type === "image" ? <ImageField value={value} onChange={onChange} /> : null}
      {error ? <small className="form-error">{error}</small> : null}
    </label>
  );
}

function ImageField({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const image = isImageObject(value) ? value : { url: getString(value) };
  const url = image.url || "";

  async function upload(file: File) {
    setUploading(true);
    setError("");

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
          <button type="button" onClick={() => onChange(undefined)}>
            <X size={16} />
            削除
          </button>
        </div>
      ) : null}
      <div className="image-controls">
        <input type="url" value={url} onChange={(event) => onChange({ ...image, url: event.target.value })} placeholder="画像URL" />
        <input
          type="text"
          value={image.alt || ""}
          onChange={(event) => onChange({ ...image, alt: event.target.value })}
          placeholder="画像の説明"
        />
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
      <p className="field-hint">横長画像は1600px以上、メニュー表は文字が読める明るい画像がおすすめです。</p>
      {error ? <small className="form-error">{error}</small> : null}
    </div>
  );
}

function PreviewModal({ draft, section, onClose }: { draft: Draft; section: SectionDefinition; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="preview-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>{section.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        <dl className="preview-list">
          {section.fields.map((field) => {
            const value = draft[field.key];
            const text = isImageObject(value) ? value.url : field.type === "checkbox" ? (value ? "公開する" : "下書き") : String(value ?? "");

            return (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>{text || "未入力"}</dd>
              </div>
            );
          })}
        </dl>
        <button className="primary-button" type="button" onClick={onClose}>
          <CheckCircle2 size={18} />
          確認しました
        </button>
      </div>
    </div>
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

  async function load() {
    setLoading(true);
    setNotice(null);

    try {
      const result = await requestJson<ListResponse | Draft>(`/api/content/${section.id}`);
      const data = result.data;

      if (section.kind === "list") {
        const contents = Array.isArray((data as ListResponse)?.contents) ? ((data as ListResponse).contents as Array<Draft & { id?: string }>) : [];
        setItems(contents);
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
    } catch (loadError) {
      setNotice({
        tone: "error",
        message: loadError instanceof Error ? loadError.message : "読み込みできませんでした。"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  function updateField(key: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      [key]: value
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(nextDraft: Draft) {
    const nextErrors: Record<string, string> = {};

    for (const field of section.fields) {
      if (!field.required) {
        continue;
      }

      const value = nextDraft[field.key];
      const emptyImage = field.type === "image" && !isImageObject(value) && !value;
      const emptyValue = value === undefined || value === null || value === "";

      if (emptyImage || emptyValue) {
        nextErrors[field.key] = `${field.label}を入力してください。`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function save(mode: "draft" | "publish") {
    const nextDraft = {
      ...draft,
      ...(section.fields.some((field) => field.key === "isPublished") ? { isPublished: mode === "publish" } : {})
    };

    if (!validate(nextDraft)) {
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
        body: JSON.stringify(nextDraft)
      });
      const savedData = (result.data || nextDraft) as Draft & { id?: string };
      setDraft(mergeDefaults(section, savedData));

      if (section.kind === "list") {
        const id = savedData.id || selectedId;
        setSelectedId(id || "new");
        setItems((current) => {
          const withoutOld = current.filter((item) => item.id !== id);
          return id ? [{ ...savedData, id }, ...withoutOld] : current;
        });
      }

      if (mode === "draft") {
        setNotice({ tone: "success", message: "下書き保存しました。" });
        return;
      }

      setDeploying(true);
      setNotice({ tone: "info", message: "保存しました。サイトへ反映しています。" });

      try {
        const deployResult = await requestJson<{ actionsUrl: string; requestedAt: string }>("/api/deploy", {
          method: "POST",
          body: JSON.stringify({})
        });
        const deployNotice = {
          tone: "success" as const,
          message: "公開しました。サイト反映中です。",
          actionsUrl: deployResult.data?.actionsUrl
        };
        setNotice(deployNotice);
        onDeployNotice(deployNotice);
      } catch (deployError) {
        const deployNotice = {
          tone: "error" as const,
          message: deployError instanceof Error ? deployError.message : "保存済み、反映だけ失敗しました。"
        };
        setNotice(deployNotice);
        onDeployNotice(deployNotice);
      }
    } catch (saveError) {
      setNotice({
        tone: "error",
        message: saveError instanceof Error ? saveError.message : "保存できませんでした。時間を置いて再試行してください。"
      });
    } finally {
      setSaving(false);
      setDeploying(false);
    }
  }

  const titleKey = section.titleKey || "title";

  return (
    <div className="editor">
      <div className="editor-topbar">
        <button className="text-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          戻る
        </button>
        <button className="text-button" type="button" onClick={() => void load()}>
          <RefreshCw size={18} />
          再読み込み
        </button>
      </div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{section.shortTitle}</p>
          <h1>{section.title}</h1>
          <p>{section.description}</p>
        </div>
        {section.kind === "list" ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setSelectedId("new");
              setDraft(mergeDefaults(section));
              setErrors({});
              setNotice(null);
            }}
          >
            <Plus size={18} />
            {section.createLabel || "追加"}
          </button>
        ) : null}
      </div>

      {notice ? (
        <div className={`notice ${notice.tone}`}>
          {notice.tone === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{notice.message}</span>
          {notice.actionsUrl ? (
            <a href={notice.actionsUrl} target="_blank" rel="noreferrer">
              反映状況を見る
            </a>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="loading-panel">
          <Loader2 className="spin" size={28} />
          読み込み中
        </div>
      ) : (
        <div className="editor-layout">
          {section.kind === "list" ? (
            <aside className="item-list">
              <button
                className={selectedId === "new" ? "selected" : ""}
                type="button"
                onClick={() => {
                  setSelectedId("new");
                  setDraft(mergeDefaults(section));
                }}
              >
                <Plus size={18} />
                新しく追加
              </button>
              {items.map((item) => (
                <button
                  className={selectedId === item.id ? "selected" : ""}
                  key={item.id || JSON.stringify(item)}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id || "");
                    setDraft(mergeDefaults(section, item));
                    setErrors({});
                  }}
                >
                  <span>{getString(item[titleKey]) || "タイトル未入力"}</span>
                  {item.isPublished === false ? <small>下書き</small> : <small>公開</small>}
                </button>
              ))}
            </aside>
          ) : null}

          <form
            className="edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              void save("draft");
            }}
          >
            {section.fields.map((field) => (
              <Field
                field={field}
                value={draft[field.key]}
                error={errors[field.key]}
                key={field.key}
                onChange={(value) => updateField(field.key, value)}
              />
            ))}
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={() => setShowPreview(true)}>
                <Eye size={18} />
                プレビュー確認
              </button>
              <button className="secondary-button" type="button" disabled={saving || deploying} onClick={() => void save("draft")}>
                {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                下書き保存
              </button>
              <button className="primary-button" type="button" disabled={saving || deploying} onClick={() => void save("publish")}>
                {deploying ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                公開して反映
              </button>
            </div>
          </form>
        </div>
      )}

      {showPreview ? <PreviewModal draft={draft} section={section} onClose={() => setShowPreview(false)} /> : null}
    </div>
  );
}

export default function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [lastDeploy, setLastDeploy] = useState<Notice | undefined>();

  async function checkSession() {
    setChecking(true);
    try {
      const response = await fetch("/api/session", { cache: "no-store" });
      const result = (await response.json()) as { authenticated?: boolean };
      setAuthenticated(Boolean(result.authenticated));
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

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
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
        <Dashboard onSelect={setActiveSection} lastDeploy={lastDeploy} />
      )}
    </main>
  );
}
