export type CalendarEventInput = {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  sourceUrl?: string;
  imageUrl?: string;
  performers?: string;
  price?: string;
  reservation?: string;
  openTime?: string;
};

export function xPostUrl(text: string) {
  return "https://x.com/intent/tweet?" + new URLSearchParams({ text });
}

/** Opens a draft only. The user must choose the shop calendar and save it. */
export function calendarDraftUrl(event: CalendarEventInput) {
  const normalizeTime = (value: string) => {
    const match = /^(\d{1,2}):([0-5]\d)$/.exec(value);
    return match && Number(match[1]) <= 23 ? match[1].padStart(2, "0") + ":" + match[2] : "";
  };
  const startTime = normalizeTime(event.startTime);
  const endTime = event.endTime ? normalizeTime(event.endTime) : "";
  if (!event.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
      !startTime || (event.endTime && !endTime)) return "";
  const day = new Date(event.date + "T00:00:00Z");
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== event.date) return "";
  const start = new Date(event.date + "T" + startTime + ":00+09:00");
  let end = endTime ? new Date(event.date + "T" + endTime + ":00+09:00") : new Date(start.getTime() + 2 * 3600000);
  if (end <= start) end = new Date(end.getTime() + 86400000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const safeLink = (value?: string) => value && /^https:\/\//i.test(value) ? value : "";
  const details = [
    event.openTime ? "OPEN " + event.openTime : "",
    "START " + startTime,
    event.performers, event.price, event.reservation,
    safeLink(event.sourceUrl),
    safeLink(event.imageUrl) ? "画像: " + safeLink(event.imageUrl) : "",
  ].filter(Boolean).join("\n");
  return "https://calendar.google.com/calendar/r/eventedit?" + new URLSearchParams({
    action: "TEMPLATE", text: event.title, dates: stamp(start) + "/" + stamp(end),
    stz: "Asia/Tokyo", etz: "Asia/Tokyo", details, location: "public bar Bassic.",
  });
}
