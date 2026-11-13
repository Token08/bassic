// Content API image fields only accept URLs uploaded to this microCMS service.
// Preserve external posters in the existing text field, without schema changes.
const prefix = "bassic-event-v1:";

export function decodeEventFromStorage(item) {
  if (!item || typeof item !== "object") return item;
  let result = { ...item };
  if (typeof item.sourceType === "string" && item.sourceType.startsWith(prefix)) {
    try {
      const meta = JSON.parse(item.sourceType.slice(prefix.length));
      if (typeof meta.sourceType === "string" && typeof meta.image?.url === "string") {
        result = { ...result, sourceType: meta.sourceType, image: meta.image };
      }
    } catch { /* Preserve malformed legacy values; never invent poster data. */ }
  }
  if (typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}T/.test(result.date) && Number.isFinite(Date.parse(result.date))) {
    result.date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", dateStyle: "short" }).format(new Date(result.date));
  }
  return result;
}

export function encodeEventForStorage(item) {
  const result = { ...item };
  if (typeof result.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.date)) result.date += "T00:00:00.000Z";
  // PATCH may update a subset of fields; absent images must remain untouched.
  if (!Object.hasOwn(result, "image")) return result;
  const image = typeof result.image === "string" ? { url: result.image } : result.image;
  const url = typeof image?.url === "string" ? image.url.trim() : "";
  if (url && !url.startsWith("https://images.microcms-assets.io/")) {
    result.sourceType = prefix + JSON.stringify({ sourceType: String(result.sourceType || ""), image: { url, alt: typeof image.alt === "string" ? image.alt : "" } });
    result.image = null;
  } else result.image = url || null;
  return result;
}
