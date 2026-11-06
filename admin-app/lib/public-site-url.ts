export function resolvePublicUrl(path: string, siteUrl: string) {
  const base = new URL(`${siteUrl.replace(/\/$/, "")}/`);
  if (base.pathname !== "/" && path.startsWith(base.pathname)) {
    return new URL(path, base.origin).toString();
  }
  return new URL(path.replace(/^\//, ""), base).toString();
}
