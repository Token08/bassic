import type { Metadata } from "next";
import AdminLoginGate from "./admin-login-gate";

export const metadata: Metadata = {
  title: "Bassic. 管理画面ログイン",
  robots: {
    index: false,
    follow: false
  }
};

const dedicatedAdminUrl = process.env.NEXT_PUBLIC_DEDICATED_ADMIN_URL;
const passwordHash = process.env.NEXT_PUBLIC_ADMIN_ENTRY_PASSWORD_HASH;

export default function AdminPortalPage() {
  return (
    <main className="admin-portal admin-login-portal">
      <AdminLoginGate dedicatedAdminUrl={dedicatedAdminUrl} passwordHash={passwordHash} />
    </main>
  );
}
