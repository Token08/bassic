import type { Metadata } from "next";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImageIcon,
  ListChecks,
  Settings,
  Share2,
  Store,
  Utensils
} from "lucide-react";

export const metadata: Metadata = {
  title: "Bassic. Admin Portal",
  robots: {
    index: false,
    follow: false
  }
};

const microCmsAdminUrl = process.env.NEXT_PUBLIC_MICROCMS_ADMIN_URL || "https://app.microcms.io/";
const repoDocsBase = "https://github.com/Token08/bassic/blob/main/docs";

const setupSteps = [
  {
    title: "店舗情報",
    apiId: "site-settings",
    detail: "住所、電話、営業時間、喫煙、チャージ、SNSリンク",
    icon: Settings
  },
  {
    title: "TOPページ",
    apiId: "home",
    detail: "TOP文言、初回来店文言、アクセス補足、InstagramウィジェットURL",
    icon: Store
  },
  {
    title: "メイン画像",
    apiId: "hero-slides",
    detail: "TOP / Events / Party / Menu / Access のメイン画像",
    icon: ImageIcon
  },
  {
    title: "イベント",
    apiId: "events",
    detail: "イベント名、日付、時間、料金、予約方法、画像",
    icon: CalendarDays
  },
  {
    title: "メニュー",
    apiId: "menu",
    detail: "フード名、料金、画像、表示順、公開/非公開",
    icon: Utensils
  },
  {
    title: "SNS告知",
    apiId: "social-notices",
    detail: "Instagram / Facebook / X の告知カード",
    icon: Share2
  }
];

const docLinks = [
  { label: "作成順", href: `${repoDocsBase}/microcms-build-order-v1.md` },
  { label: "フィールド定義", href: `${repoDocsBase}/microcms-field-definitions-v1.md` },
  { label: "初期データ", href: `${repoDocsBase}/cms-sample-content-v1.json` },
  { label: "納品マニュアル", href: `${repoDocsBase}/delivery-admin-manual-v1.md` }
];

const commandItems = [
  "npm run setup:admin",
  "npm run check:admin",
  "npm run smoke:cms",
  "npm run deploy:cms"
];

export default function AdminPortalPage() {
  return (
    <main className="admin-portal">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Bassic. Admin</p>
          <h1>管理画面ポータル</h1>
          <p>
            microCMS標準管理画面で更新し、GitHub Pagesへ自動反映するための入口です。
            編集権限とログイン情報はmicroCMS側で管理します。
          </p>
        </div>
        <div className="admin-actions">
          <a className="admin-button primary" href={microCmsAdminUrl} target="_blank" rel="noreferrer">
            <Settings size={18} />
            microCMSを開く
            <ArrowUpRight size={16} />
          </a>
          <a className="admin-button" href={`${repoDocsBase}/admin-docs-index.md`} target="_blank" rel="noreferrer">
            <FileText size={18} />
            資料一覧
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <p className="admin-kicker">Build Order</p>
          <h2>最初に作るAPI</h2>
        </div>
        <div className="admin-card-grid">
          {setupSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article className="admin-card" key={step.apiId}>
                <Icon size={24} />
                <div>
                  <p>{step.apiId}</p>
                  <h3>{step.title}</h3>
                  <span>{step.detail}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section admin-split">
        <div className="admin-panel">
          <div className="admin-section-heading">
            <p className="admin-kicker">Docs</p>
            <h2>設定資料</h2>
          </div>
          <div className="admin-link-list">
            {docLinks.map((link) => (
              <a href={link.href} target="_blank" rel="noreferrer" key={link.href}>
                <ClipboardList size={18} />
                {link.label}
                <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-section-heading">
            <p className="admin-kicker">Checks</p>
            <h2>反映確認</h2>
          </div>
          <div className="admin-command-list">
            {commandItems.map((command) => (
              <div key={command}>
                <CheckCircle2 size={17} />
                <code>{command}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-section admin-note">
        <ListChecks size={24} />
        <div>
          <h2>残タスク</h2>
          <p>
            microCMSでAPIを作成し、実際の <code>MICROCMS_SERVICE_DOMAIN</code> と <code>MICROCMS_API_KEY</code> を
            <code>npm run setup:admin</code> で登録すると接続確認まで進められます。
          </p>
        </div>
      </section>
    </main>
  );
}
