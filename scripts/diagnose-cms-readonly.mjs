// Read-only operational diagnostics. Never output credentials or content values.
const domain = process.env.MICROCMS_SERVICE_DOMAIN;
const key = process.env.MICROCMS_API_KEY;
if (!domain || !key || !/^[a-z0-9-]+$/.test(domain)) throw new Error("CMS configuration missing");
for (const [name, url] of [
  ["event-schema", `https://${domain}.microcms-management.io/api/v1/apis/events`],
  ["event-list", `https://${domain}.microcms.io/api/v1/events?limit=1`]
]) {
  const start = Date.now();
  try {
    const response = await fetch(url, { headers: { "X-MICROCMS-API-KEY": key }, signal: AbortSignal.timeout(15000) });
    console.log(JSON.stringify({ name, status: response.status, elapsedMs: Date.now() - start }));
    if (!response.ok) continue;
    const data = await response.json();
    if (name === "event-schema") console.log(JSON.stringify({ fields: (data.apiFields || []).map(field => ({ id: field.fieldId, kind: field.kind, required: field.required, unique: field.isUnique })) }));
    else console.log(JSON.stringify({ totalCount: data.totalCount, fields: Object.entries(data.contents?.[0] || {}).map(([id, value]) => ({ id, type: value === null ? "null" : Array.isArray(value) ? "array" : typeof value })) }));
  } catch { console.log(JSON.stringify({ name, result: "read-failed", elapsedMs: Date.now() - start })); }
}
