/** One description for calendar drafts, automatic sync and read-back verification. */
export function calendarDescription(event, siteUrl = "https://www.bassic.jp/") {
  let source = event.sourceUrl || "";
  try {
    const url = new URL(source);
    const id = /^\/events\/(?:[^/]+\/)?(\d+)(?:\/|$)/.exec(url.pathname)?.[1];
    if (["facebook.com", "www.facebook.com", "m.facebook.com", "mbasic.facebook.com"].includes(url.hostname) && id)
      source = `https://www.facebook.com/events/${id}/`;
  } catch { /* A missing source is allowed for manually entered events. */ }
  let image = event.imageUrl || event.image?.url || "";
  if (image.startsWith("/")) image = siteUrl.replace(/\/$/, "") + image;
  const reservation = source && event.reservation?.includes(source) ? "" : event.reservation;
  return [
    event.openTime ? `OPEN ${event.openTime}` : "",
    event.startTime ? `START ${event.startTime.padStart(5, "0")}` : "",
    event.performers, event.price, reservation,
    source ? `イベント詳細: ${source}` : "",
    image ? `画像: ${image}` : "",
  ].filter(Boolean).join("\n\n");
}
