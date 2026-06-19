const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const externalUrlPattern = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;
const specialUrlPattern = /^(?:data|blob|mailto|tel):/i;

export function assetPath(path: string) {
  if (!path || externalUrlPattern.test(path) || specialUrlPattern.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (basePath && normalizedPath.startsWith(`${basePath}/`)) {
    return normalizedPath;
  }

  return `${basePath}${normalizedPath}`;
}
