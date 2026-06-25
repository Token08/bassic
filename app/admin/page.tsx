import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, LockKeyhole, MonitorCog, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Bassic. 管理入口",
  robots: {
    index: false,
    follow: false
  }
};

const dedicatedAdminUrl = process.env.NEXT_PUBLIC_DEDICATED_ADMIN_URL;

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
          ) : (
            <span className="admin-button muted">
              <LockKeyhole size={18} />
              管理画面URL設定待ち
            </span>
          )}
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
            <h2>ログインが必要です</h2>
          </div>
          <div className="admin-command-list">
            <div>
              <ShieldCheck size={17} />
              <span>共有パスワード</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>ログイン保持は12時間</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>ログアウト可能</span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>未ログインでは編集不可</span>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-section admin-note">
        <MonitorCog size={24} />
        <div>
          <h2>専用管理画面について</h2>
          <p>
            この入口から移動できるのは、パスワード付きの専用管理画面だけです。
            管理画面URLが未設定の間は、編集画面へ進めません。
          </p>
        </div>
      </section>
    </main>
  );
}
