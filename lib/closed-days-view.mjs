export function validDay(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "1900-01-01" && value <= "9998-12-31" &&
    Number.isFinite(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}
export function shiftDay(value, days) { return new Date(Date.parse(value + "T00:00:00Z") + days * 86400000).toISOString().slice(0, 10); }
export function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month) || !validDay(month + "-01")) throw Error("表示する月を確認してください。");
  const start = month + "-01";
  return { start, end: shiftDay(start.slice(0, 8) + "28", 4).slice(0, 8) + "01" };
}
export const overlaps = (event, date) => event.start <= date && date < event.end;
