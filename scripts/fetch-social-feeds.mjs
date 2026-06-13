import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "public", "data", "social-feed.json");
const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
const maxItems = Number(process.env.SOCIAL_FEED_LIMIT || 5);

const emptyFeed = {
  generatedAt: new Date().toISOString(),
  feeds: {
    instagram: [],
    facebook: [],
    x: []
  },
  errors: {}
};

async function main() {
  const result = structuredClone(emptyFeed);

  const tasks = [
    ["instagram", fetchInstagramFeed],
    ["facebook", fetchFacebookFeed],
    ["x", fetchXFeed]
  ];

  for (const [key, task] of tasks) {
    try {
      result.feeds[key] = await task();
    } catch (error) {
      result.errors[key] = error instanceof Error ? error.message : String(error);
      result.feeds[key] = [];
    }
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const counts = Object.fromEntries(Object.entries(result.feeds).map(([key, items]) => [key, items.length]));
  console.log(`Social feed written to ${outputPath}`);
  console.log(`Social feed counts: ${JSON.stringify(counts)}`);
  if (Object.keys(result.errors).length) {
    console.log(`Social feed warnings: ${JSON.stringify(result.errors)}`);
  }
}

async function fetchInstagramFeed() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken) {
    return [];
  }

  const fields = "id,caption,media_url,permalink,timestamp,media_type,thumbnail_url";
  const url = userId
    ? `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(userId)}/media`
    : "https://graph.instagram.com/me/media";

  const data = await requestJson(url, {
    fields,
    limit: String(maxItems),
    access_token: accessToken
  });

  return (data.data || []).map((item) => ({
    id: String(item.id),
    platform: "instagram",
    text: trimText(item.caption || "Instagram post"),
    url: item.permalink,
    imageUrl: item.media_type === "VIDEO" ? item.thumbnail_url || item.media_url : item.media_url,
    createdAt: item.timestamp || null
  }));
}

async function fetchFacebookFeed() {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID || "bar.Bassic";

  if (!accessToken) {
    return [];
  }

  const data = await requestJson(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/posts`, {
    fields: "id,message,created_time,permalink_url,full_picture",
    limit: String(maxItems),
    access_token: accessToken
  });

  return (data.data || []).map((item) => ({
    id: String(item.id),
    platform: "facebook",
    text: trimText(item.message || "Facebook post"),
    url: item.permalink_url,
    imageUrl: item.full_picture || null,
    createdAt: item.created_time || null
  }));
}

async function fetchXFeed() {
  const bearerToken = process.env.X_BEARER_TOKEN;
  const username = process.env.X_USERNAME || "bar_Bassic";

  if (!bearerToken) {
    return [];
  }

  const user = await requestJson(`https://api.x.com/2/users/by/username/${encodeURIComponent(username)}`, {
    "user.fields": "username"
  }, bearerToken);

  const userId = user?.data?.id;
  if (!userId) {
    throw new Error("X user id was not returned");
  }

  const tweets = await requestJson(`https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets`, {
    max_results: String(Math.max(5, maxItems)),
    exclude: "retweets,replies",
    "tweet.fields": "created_at,entities",
    expansions: "attachments.media_keys",
    "media.fields": "preview_image_url,url,type"
  }, bearerToken);

  const mediaByKey = new Map((tweets.includes?.media || []).map((media) => [media.media_key, media]));

  return (tweets.data || []).slice(0, maxItems).map((tweet) => {
    const mediaKey = tweet.attachments?.media_keys?.[0];
    const media = mediaKey ? mediaByKey.get(mediaKey) : null;

    return {
      id: String(tweet.id),
      platform: "x",
      text: trimText(tweet.text || "X post"),
      url: `https://x.com/${username}/status/${tweet.id}`,
      imageUrl: media?.url || media?.preview_image_url || null,
      createdAt: tweet.created_at || null
    };
  });
}

async function requestJson(url, params, bearerToken) {
  const requestUrl = new URL(url);
  Object.entries(params).forEach(([key, value]) => requestUrl.searchParams.set(key, value));

  const response = await fetch(requestUrl, {
    headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body?.error?.message || body?.title || body?.detail || body?.raw || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  return body;
}

function trimText(text) {
  return String(text).replace(/\s+/g, " ").trim().slice(0, 220);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
