export const publicationWaitMs = 15 * 60_000;
export function publicationDeadline(requestedAt, now = Date.now()) {
  const at = Date.parse(requestedAt);
  // Reloading must not restart the waiting period of an existing request.
  return Number.isFinite(at) ? Math.min(at, now) + publicationWaitMs : now;
}
export function canLookUpPublication(requestedAt, now = Date.now()) {
  const at = Date.parse(requestedAt);
  return Number.isFinite(at) && at <= now + 60_000 && at >= now - 7 * 86400000;
}
