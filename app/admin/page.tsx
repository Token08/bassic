import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, CheckCircle2, KeyRound, MonitorCog, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Bassic. 管理入口",
  robots: {
    index: false,
    follow: false
  }
};

const dedicatedAdminUrl = process.env.NEXT_PUBLIC_DEDICATED_ADMIN_URL;
const microCmsAdminUrl = process.env.NEXT_PUBLIC_MICROCMS_ADMIN_URL || "https://app.microcms.io/";
const repoDocsBase = "https://github.com/Token08/bassic/blob/main/docs";

export default function AdminPortalPage() {
  return (
    <main className="admin-portal">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Bassic. Admin</p>
          <h1>管理入口</h1>
          <p>
            納品先は専用管理画面から、イベント、メニュー、画像、料金、SNS告知を更新します。
            GitHubやAPIキーを触らずに運用できる入口です。
          </p>
        </div>
        <div className="admin-actions">
          {dedicatedAdminUrl ? (
            <a className="admin-button primary" href={dedicatedAdminUrl} target="_blank" rel="noreferrer">
              <MonitorCog size={18} />
              専用管理画面を開く
              <ArrowUpRight size={16} />
            </a>
          ) : null}
          <a className="admin-button" href={microCmsAdminUrl} target="_blank" rel="noreferrer">
            <KeyRound size={18} />
            microCMSを開く
            <ArrowUpRight size={16} />
          </a>
          <a className="admin-button" href={`${repoDocsBase}/admin-docs-index.md`} target="_blank" rel="noreferrer">
            <BookOpen size={18} />
            操作資料を見る
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <section className="admin-section admin-split">
        <article className="admin-panel">
          <div className="admin-section-heading">
            <p className="admin-kicker">Client Flow</p>
            <h2>納品先が使うもの</h2>
          </div>
          <div className="admin-command-list">
            <div>
              <CheckCircle2 size={17} />
              <span>サイトURL</span>
            </div>
            <div>
              <CheckCircle2 size={17} />
              <span>専用管理画面URL</span>
            </div>
            <div>
              <CheckCircle2 size={17} />
              <span>共有パスワード</span>
            </div>
            <div>
              <CheckCircle2 size={17} />
              <span>操作マニュアル</span>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-section-heading">
            <p className="admin-kicker">Safety</p>
            <h2>触らせないもの</h2>
          </div>
          <div className="admin-command-list">
            <div>
              <ShieldCheck size={17} />
              <span>GitHub</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>APIキー</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>GitHub Actions</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>Vercel環境変数</span>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-section admin-note">
        <MonitorCog size={24} />
        <div>
          <h2>専用管理画面について</h2>
          <p>
            専用管理画面は <code>admin-app/</code> をVercelにデプロイして使います。
            このページは公開サイト側に残す案内用の入口です。
          </p>
        </div>
      </section>
    </main>
  );
}
