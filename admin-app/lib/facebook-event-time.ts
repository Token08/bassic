export function parseDateTimeValue(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]((?:[01]\d|2[0-3]):[0-5]\d)(?::[0-5]\d(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i);
  if (!match || !validDate(match[1])) return { date: "", time: "" };
  if (!match[3]) return { date: match[1], time: match[2] || "" };
  const instant = new Date(value.replace(" ", "T"));
  if (!Number.isFinite(instant.getTime())) return { date: "", time: "" };
  const [date, time] = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", dateStyle: "short", timeStyle: "short"
  }).format(instant).split(" ");
  return { date, time };
}

function validDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseDateFromText(text: string) {
  const normalized = text.normalize("NFKC");
  const dates = new Set([...normalized.matchAll(/(?<!\d)(\d{4})[\/年.-](\d{1,2})[\/月.-](\d{1,2})(?!\d)/g)]
    .map(([, year, month, day]) => `${year}-${pad(month)}-${pad(day)}`).filter(validDate));
  // Facebook's Japanese event metadata can put the year after the month and day.
  for (const [, month, day, year] of normalized.matchAll(/(?<!\d)(\d{1,2})月\s*(\d{1,2})日?[,\s]+(\d{4})(?!\d)/g)) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    if (validDate(date)) dates.add(date);
  }
  const englishMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  for (const [, monthName, day, year] of normalized.matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})(?!\d)/gi)) {
    const month = englishMonths.indexOf(monthName.toLowerCase()) + 1;
    const date = `${year}-${pad(String(month))}-${pad(day)}`;
    if (validDate(date)) dates.add(date);
  }
  const times = new Set<string>();
  const patterns = [
    /(?<![\d:])(午前|午後)?\s*([01]?\d|2[0-3]):([0-5]\d)\s*(?:\bSTART\b|開演|開始)/gi,
    /(?:\bSTART\b|開演|開始)\s*[:=]?\s*(午前|午後)?\s*([01]?\d|2[0-3]):([0-5]\d)(?!\d|\s*(?:\b(?:OPEN|END|CLOSE)\b|開場|終演))/gi
  ];
  for (const pattern of patterns) {
    for (const [, period, hour, minute] of normalized.matchAll(pattern)) {
      if (period && (+hour < 1 || +hour > 12)) continue;
      const converted = period ? (+hour % 12) + (period === "午後" ? 12 : 0) : +hour;
      times.add(`${pad(String(converted))}:${minute}`);
    }
  }
  return { date: dates.size === 1 ? [...dates][0] : "", startTime: dates.size <= 1 && times.size === 1 ? [...times][0] : "" };
}

function pad(value: string) {
  return value.padStart(2, "0");
}
