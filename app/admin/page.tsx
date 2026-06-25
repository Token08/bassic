import type { Metadata } from "next";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

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
      {dedicatedAdminUrl ? <meta httpEquiv="refresh" content={`0;url=${dedicatedAdminUrl}`} /> : null}
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Bassic. Admin</p>
          <h1>管理画面ログイン</h1>
          <p>
            管理画面を開くにはパスワード入力が必要です。
            編集画面はログイン後に表示されます。
          </p>
        </div>
        <div className="admin-actions">
          {dedicatedAdminUrl ? (
            <a className="admin-button primary" href={dedicatedAdminUrl} target="_blank" rel="noreferrer">
              <LockKeyhole size={18} />
              パスワード入力へ進む
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

      <section className="admin-section admin-note">
        <LockKeyhole size={24} />
        <div>
          <h2>未ログインでは編集できません</h2>
          <p>
            このページには編集機能を置いていません。
            実際の更新は、パスワード保護された専用管理画面で行います。
          </p>
        </div>
      </section>
    </main>
  );
}
