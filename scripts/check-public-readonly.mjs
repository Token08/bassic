import { pathToFileURL } from "node:url";

export const publicPaths = [
  "/",
  "/events/",
  "/menu/",
  "/party/",
  "/access/",
  "/first-visit/",
  ...["en", "ko", "zh-hant", "zh-hans"].flatMap((locale) =>
    ["", "events/", "menu/", "party/", "access/"].map(
      (path) => "/" + locale + "/" + path,
    ),
  ),
];
const assetHosts = new Set([
  "images.microcms-assets.io",
  "files.microcms-assets.io",
]);
function trusted(url, base) {
  return (
    !url.username &&
    !url.password &&
    (url.origin === base.origin ||
      (url.protocol === "https:" && assetHosts.has(url.hostname)))
  );
}
async function request(url, method, fetcher, allowed) {
  let target = new URL(url);
  for (let attempt = 0; attempt < 4; attempt++) {
    if (!allowed(target)) throw Error("点検対象外の接続先です。");
    const response = await fetcher(target.href, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw Error("転送先がありません。");
      target = new URL(location, target);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw Error("HTTP " + response.status);
    }
    return response;
  }
  throw Error("転送が多すぎます。");
}
async function batches(values, operation) {
  const errors = [];
  for (let at = 0; at < values.length; at += 4) {
    const results = await Promise.allSettled(
      values.slice(at, at + 4).map(async (value) => {
        try {
          await operation(value);
        } catch (error) {
          throw Error(
            value +
              ": " +
              (error instanceof Error ? error.message : "点検失敗"),
          );
        }
      }),
    );
    for (const result of results)
      if (result.status === "rejected") errors.push(result.reason.message);
  }
  return errors;
}
const decode = (value) => value.replaceAll("&amp;", "&");
export async function checkPublicSite({
  baseUrl = "https://www.bassic.jp/",
  expectedCommit = "",
  paths = publicPaths,
  fetcher = fetch,
} = {}) {
  const base = new URL(baseUrl);
  const assets = new Set();
  const pageUrls = paths.map((path) => new URL(path, base).href);
  const failures = await batches(pageUrls, async (url) => {
    const response = await request(
      url,
      "GET",
      fetcher,
      (target) =>
        target.origin === base.origin && !target.username && !target.password,
    );
    const html = await response.text();
    if (!/<title>[^<]+<\/title>/i.test(html) || !/<body\b/i.test(html))
      throw Error("ページを表示できません。");
    const add = (value) => {
      try {
        const target = new URL(decode(value), url);
        target.hash = "";
        if (trusted(target, base) && !pageUrls.includes(target.href))
          assets.add(target.href);
      } catch {}
    };
    for (const match of html.matchAll(
      /<(?:a|img)\b[^>]*?\b(?:href|src)="([^"]+)"/gi,
    ))
      add(match[1]);
    for (const match of html.matchAll(/<source\b[^>]*?\bsrcset="([^"]+)"/gi))
      for (const source of match[1].split(","))
        add(source.trim().split(/\s+/)[0]);
  });
  if (assets.size > 250)
    throw Error("点検対象が250件を超えました。範囲を確認してください。");
  failures.push(
    ...(await batches([...assets], async (url) => {
      let response;
      try {
        response = await request(url, "HEAD", fetcher, (target) =>
          trusted(target, base),
        );
      } catch (error) {
        if (!String(error).includes("HTTP 405")) throw error;
        response = await request(url, "GET", fetcher, (target) =>
          trusted(target, base),
        );
      }
      await response.body?.cancel();
    })),
  );
  try {
    const response = await request(
      new URL("/_bassic-build.json", base).href,
      "GET",
      fetcher,
      (target) => target.origin === base.origin,
    );
    const marker = await response.json();
    if (
      !Number.isInteger(marker.run) ||
      !/^[a-f0-9]{40}$/.test(marker.commit) ||
      (expectedCommit && marker.commit !== expectedCommit)
    )
      throw Error("公開した版を確認できません。");
  } catch (error) {
    failures.push("公開状態: " + error.message);
  }
  if (failures.length)
    throw Error("公開サイトの点検に失敗しました。\n" + failures.join("\n"));
  return { pages: pageUrls.length, resources: assets.size };
}

export async function checkAdminSite({
  baseUrl = "https://bassic-admin.vercel.app/",
  fetcher = fetch,
} = {}) {
  const base = new URL(baseUrl);
  const allowed = (target) =>
    target.origin === base.origin && !target.username && !target.password;
  const response = await request(base.href, "GET", fetcher, allowed);
  if (!/<title>[^<]*Bassic\./i.test(await response.text()))
    throw Error("管理画面を表示できません。");
  const session = await request(
    new URL("/api/session", base).href,
    "GET",
    fetcher,
    allowed,
  );
  if ((await session.json()).authenticated !== false)
    throw Error("未ログイン時の状態を確認できません。");
  for (const path of [
    "/api/visual-editor",
    "/api/content/home",
    "/api/deploy",
  ]) {
    const gate = await fetcher(new URL(path, base).href, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    await gate.body?.cancel();
    if (gate.status !== 401)
      throw Error(
        path + ": ログイン保護を確認できません（HTTP " + gate.status + "）。",
      );
  }
  return { protectedRoutes: 3 };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.log(
      "Public read-only check passed.",
      await checkPublicSite({
        baseUrl: process.env.PUBLIC_SITE_URL,
        expectedCommit: process.env.PUBLIC_EXPECT_COMMIT || "",
      }),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
