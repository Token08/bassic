"use client";

import { useState } from "react";
import { ArrowUpRight, LockKeyhole } from "lucide-react";

type AdminLoginGateProps = {
  dedicatedAdminUrl?: string;
  passwordHash?: string;
};

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function AdminLoginGate({ dedicatedAdminUrl, passwordHash }: AdminLoginGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!passwordHash) {
      setError("管理画面入口のパスワード設定が未完了です。担当者に連絡してください。");
      return;
    }

    setLoading(true);
    try {
      const inputHash = await sha256(password);
      if (inputHash !== passwordHash) {
        setError("パスワードが違います。");
        return;
      }

      setUnlocked(true);
      if (dedicatedAdminUrl) {
        window.location.href = dedicatedAdminUrl;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-gate-panel">
      <div className="admin-gate-icon">
        <LockKeyhole size={28} />
      </div>
      <div>
        <p className="admin-kicker">Bassic. Admin</p>
        <h1>管理画面ログイン</h1>
        <p className="admin-gate-copy">パスワードを入力すると、専用管理画面へ進みます。</p>
      </div>

      <form className="admin-gate-form" onSubmit={submit}>
        <label htmlFor="admin-entry-password">パスワード</label>
        <input
          id="admin-entry-password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="パスワードを入力"
        />
        {error ? <p className="admin-gate-error">{error}</p> : null}
        {unlocked && !dedicatedAdminUrl ? (
          <p className="admin-gate-error">専用管理画面URLが未設定です。担当者に連絡してください。</p>
        ) : null}
        <button className="admin-button primary" type="submit" disabled={loading || !password}>
          <LockKeyhole size={18} />
          {loading ? "確認中..." : "ログイン"}
          <ArrowUpRight size={16} />
        </button>
      </form>

      <p className="admin-gate-note">編集画面はログイン後に表示されます。</p>
    </section>
  );
}
