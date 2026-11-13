// Draft text and external image URLs are data, not CMS media/select fields.
export function packSocialNoticeRecord(notice) {
  const clean = Object.fromEntries(Object.entries(notice).filter(([key, value]) =>
    !["id", "createdAt", "updatedAt", "publishedAt", "revisedAt"].includes(key) && !key.startsWith("__") && value !== undefined));
  return { kind: "social-notices", category: "cms", title: String(clean.title || ""), body: JSON.stringify({ bassicSocialNoticeVersion: 1, notice: clean }) };
}

export function decodeSocialNoticeRecord(item) {
  if (item?.kind !== "social-notices" || typeof item.body !== "string") return item;
  let data;
  try { data = JSON.parse(item.body); } catch {
    if (item.body.includes("bassicSocialNoticeVersion")) throw new Error("SNS下書きの保存内容を確認できません。");
    return item;
  }
  if (data?.bassicSocialNoticeVersion === undefined) return item;
  if (data.bassicSocialNoticeVersion !== 1 || !data.notice || typeof data.notice !== "object" || Array.isArray(data.notice))
    throw new Error("SNS下書きの保存形式を確認できません。");
  return { ...data.notice, id: item.id };
}
