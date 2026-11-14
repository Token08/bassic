export function closedDayDraftUrl(startDate: string, endDate: string, note: string, calendarId: string) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value >= "1900-01-01" && value <= "9998-12-31" &&
    Number.isFinite(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
  const last = endDate || startDate;
  if (!valid(startDate) || !valid(last) || last < startDate || !calendarId.trim()) return "";
  const exclusiveEnd = new Date(last + "T00:00:00Z");
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  const stamp = (value: string) => value.replace(/-/g, "");
  return "https://calendar.google.com/calendar/r/eventedit?" + new URLSearchParams({
    action: "TEMPLATE", text: "店休日", dates: stamp(startDate) + "/" + stamp(exclusiveEnd.toISOString().slice(0, 10)),
    stz: "Asia/Tokyo", etz: "Asia/Tokyo", src: calendarId.trim(), location: "public bar Bassic.", details: note.trim()
  });
}
