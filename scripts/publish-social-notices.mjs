const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;
const graphVersion = process.env.META_GRAPH_VERSION || "v23.0";
const facebookPageId = process.env.FACEBOOK_PAGE_ID || "bar.Bassic";
const instagramUserId = process.env.INSTAGRAM_USER_ID;
const facebookToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN || facebookToken;
const xAccessToken = process.env.X_ACCESS_TOKEN || process.env.X_USER_ACCESS_TOKEN;

async function main() {
  if (!serviceDomain || !apiKey) {
    console.log("Skipping SNS publishing because microCMS credentials are not configured.");
    return;
  }

  const notices = await fetchApprovedNotices();
  if (!notices.length) {
    console.log("No approved SNS notices to publish.");
    return;
  }

  const results = [];
  for (const notice of notices) {
    const result = await publishNotice(notice);
    results.push(result);
    console.log(`${result.platform}: ${result.status}${result.message ? ` - ${result.message}` : ""}`);
  }

  const failed = results.filter((result) => result.status === "failed").length;
  const posted = results.filter((result) => result.status === "posted").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  console.log(`SNS publish complete. posted=${posted} skipped=${skipped} failed=${failed}`);
}

async function fetchApprovedNotices() {
  const params = new URLSearchParams({
    limit: "100",
    filters: 'deliveryStatus[equals]approved'
  });
  const data = await microCmsRequest(`/social-notices?${params.toString()}`);

  return (data.contents || []).filter((notice) => !notice.externalPostId && notice.isPublished !== false);
}

async function publishNotice(notice) {
  const platform = String(notice.platform || "").toLowerCase();
  const scheduledAt = parseScheduledAt(notice.scheduledAt);

  if (scheduledAt && scheduledAt.getTime() > Date.now()) {
    return { platform, status: "skipped", message: `Scheduled for ${scheduledAt.toISOString()}` };
  }

  try {
    const postId =
      platform === "facebook"
        ? await publishFacebook(notice)
        : platform === "instagram"
          ? await publishInstagram(notice)
          : platform === "x"
            ? await publishX(notice)
            : "";

    if (!postId) {
      return { platform, status: "skipped", message: "Unsupported platform or missing credentials." };
    }

    await patchNotice(notice.id, {
      deliveryStatus: "posted",
      externalPostId: postId,
      lastPublishError: "",
      postedAt: new Date().toISOString()
    });

    return { platform, status: "posted", message: postId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await patchNotice(notice.id, {
      deliveryStatus: "failed",
      lastPublishError: message
    }).catch((patchError) => {
      console.log(`Could not store SNS publish error for ${notice.id}: ${patchError instanceof Error ? patchError.message : String(patchError)}`);
    });

    return { platform, status: "failed", message };
  }
}

async function publishFacebook(notice) {
  if (!facebookToken) {
    await storeMissingToken(notice, "FACEBOOK_PAGE_ACCESS_TOKEN is not set");
    return "";
  }

  const body = new URLSearchParams({
    access_token: facebookToken,
    message: getPostText(notice)
  });
  const link = getString(notice.url) || getString(notice.sourceEventUrl);
  if (link) {
    body.set("link", link);
  }

  const data = await requestJson(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(facebookPageId)}/feed`, {
    method: "POST",
    body
  });

  return data.id || "";
}

async function publishInstagram(notice) {
  if (!instagramToken || !instagramUserId) {
    await storeMissingToken(notice, "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID is not set");
    return "";
  }

  const imageUrl = getImageUrl(notice.image);
  if (!imageUrl || !imageUrl.startsWith("https://")) {
    await storeMissingToken(notice, "Instagram API publishing requires an https image URL");
    return "";
  }

  const containerBody = new URLSearchParams({
    access_token: instagramToken,
    image_url: imageUrl,
    caption: getPostText(notice)
  });
  const container = await requestJson(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(instagramUserId)}/media`, {
    method: "POST",
    body: containerBody
  });

  if (!container.id) {
    throw new Error("Instagram media container id was not returned");
  }

  const publishBody = new URLSearchParams({
    access_token: instagramToken,
    creation_id: container.id
  });
  const published = await requestJson(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(instagramUserId)}/media_publish`, {
    method: "POST",
    body: publishBody
  });

  return published.id || "";
}

async function publishX(notice) {
  if (!xAccessToken) {
    await storeMissingToken(notice, "X_ACCESS_TOKEN is not set");
    return "";
  }

  const data = await requestJson("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${xAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: getPostText(notice).slice(0, 280) })
  });

  return data.data?.id || "";
}

async function storeMissingToken(notice, message) {
  await patchNotice(notice.id, {
    lastPublishError: message
  });
}

function getPostText(notice) {
  return getString(notice.postText) || [getString(notice.title), getString(notice.description), getString(notice.url)].filter(Boolean).join("\n");
}

function parseScheduledAt(value) {
  const raw = getString(value);
  if (!raw) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? `${raw}:00+09:00` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getImageUrl(value) {
  if (value && typeof value === "object" && typeof value.url === "string") {
    return value.url.trim();
  }

  return typeof value === "string" ? value.trim() : "";
}

async function patchNotice(id, patch) {
  if (!id) {
    return;
  }

  await microCmsRequest(`/social-notices/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

async function microCmsRequest(path, init = {}) {
  const response = await fetch(`https://${serviceDomain}.microcms.io/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-MICROCMS-API-KEY": apiKey,
      ...(init.headers || {})
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body.message || text || `microCMS request failed: ${response.status}`);
  }

  return body;
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.detail || text || `${response.status} ${response.statusText}`);
  }

  return body;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
