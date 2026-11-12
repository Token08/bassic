import { createHash } from "node:crypto";

export const maxPdfBytes = 3 * 1024 * 1024;

export async function validatePdf(file: File) {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return "PDFファイルを選んでください。";
  if (!file.size || file.size > maxPdfBytes) return "PDFは3MB以内にしてください。";
  if (Buffer.from(await file.slice(0, 5).arrayBuffer()).toString("ascii") !== "%PDF-") return "PDFファイルの内容を確認してください。";
  return "";
}

// PDF files are kept with the website, without requiring a paid CMS file plan.
// Content-addressed paths preserve older links and make retries idempotent.
export async function storePdf(file: File) {
  if (process.env.VERCEL_ENV === "preview") throw new Error("確認用環境ではアップロードできません。");
  const bytes = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");
  const owner = process.env.GITHUB_OWNER || "Token08";
  const repo = process.env.GITHUB_REPO || "bassic";
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) throw new Error("PDFの保存設定を確認してください。担当者へ連絡してください。");
  const path = `public/assets/pdf/uploads/${hash}.pdf`;
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" };
  const request = (method: string, body?: object) => fetch(endpoint + (method === "GET" ? "?ref=main" : ""), {
    method, headers: { ...headers, Accept: method === "GET" ? "application/vnd.github.raw+json" : "application/vnd.github+json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  let existing = await request("GET");
  if (existing.status === 404) {
    const written = await request("PUT", { message: "Store equipment PDF", content: bytes.toString("base64"), branch: "main" });
    if (!written.ok && written.status !== 409 && written.status !== 422) throw new Error("PDFを保存できませんでした。時間をおいて再度お試しください。直らない場合は担当者へ連絡してください。");
    existing = await request("GET");
  }
  if (!existing.ok) throw new Error("PDFの保存を確認できませんでした。もう一度選んでください。");
  if (!Buffer.from(await existing.arrayBuffer()).equals(bytes)) throw new Error("PDFの保存内容を確認できませんでした。担当者へ連絡してください。");
  return { url: `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/main/${path}` };
}
