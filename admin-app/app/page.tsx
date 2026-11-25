import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminClient googleLogin={process.env.ADMIN_AUTH_MODE === "google"} />;
}
