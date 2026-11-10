export const mobileCropPositions = ["center", "top", "bottom", "left", "right"] as const;
export type MobileCropPosition = (typeof mobileCropPositions)[number];

export function mobileCrop(value: unknown): MobileCropPosition | undefined {
  return mobileCropPositions.find((position) => position === value);
}

export function mobileImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  if (/^\/assets\/(?!\/)[^\s]+$/.test(value)) return value;
  try {
    if (new URL(value).protocol === "https:") return value;
  } catch {
    return;
  }
}

const slideTitlePrefix = "BASSIC_SLIDE_V1:";

// The existing slide CMS has no responsive fields. Keep the optional settings
// together with the slide in its internal title field, including on reorder.
export function packSlideTitle(title: unknown, image: unknown, position: unknown): string {
  const label = typeof title === "string" ? title : "";
  const url = mobileImageUrl(image && typeof image === "object" && "url" in image ? image.url : image);
  const crop = mobileCrop(position);
  return url || crop || label.startsWith(slideTitlePrefix)
    ? slideTitlePrefix + JSON.stringify({ title: label, url, crop })
    : label;
}

export function unpackSlideTitle(value: unknown) {
  const title = typeof value === "string" ? value : "";
  if (title.startsWith(slideTitlePrefix)) {
    try {
      const parsed = JSON.parse(title.slice(slideTitlePrefix.length));
      if (typeof parsed?.title === "string") {
        const url = mobileImageUrl(parsed.url);
        return { title: parsed.title as string, mobileImage: url ? { url } : undefined, mobilePosition: mobileCrop(parsed.crop) };
      }
    } catch {
      // A pre-existing label can contain arbitrary text.
    }
  }
  return { title, mobileImage: undefined, mobilePosition: undefined };
}
