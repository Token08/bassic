# Social API feeds

This repository keeps the API-fetching script as a future option, but the current homepage does not depend on Instagram or X API output.
For public launch stability, Instagram uses a CMS-configured external widget URL when available, X uses static JSON or CMS cards with a profile-card fallback, and Facebook can use either static JSON or the official Page Plugin iframe.

If real-time feeds are introduced later, fetch posts at build time or through a server/admin process so API tokens never reach the browser.

Run locally:

```bash
npm run fetch:social
npm run build
```

Output:

```text
public/data/social-feed.json
```

## GitHub Secrets

Add these as repository secrets when API access is ready:

```text
X_BEARER_TOKEN
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
FACEBOOK_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
```

`FACEBOOK_PAGE_ID` can be omitted when the page id `bar.Bassic` works.
`INSTAGRAM_USER_ID` can be omitted only when the token supports the `graph.instagram.com/me/media` endpoint.

## Display priority

The current homepage uses this order:

1. Instagram widget URL from `home.instagramWidgetSrc`, when present
2. microCMS `social-notices` cards, when present
3. Facebook API JSON posts from `public/data/social-feed.json`, when present
4. Facebook official Page Plugin iframe
5. X API JSON posts from `public/data/social-feed.json`, when present
6. Instagram and X official profile cards

## Notes

- X requires a valid bearer token for the X API v2 user timeline endpoints.
- Instagram and Facebook require Meta tokens with the correct page/account permissions.
- Without tokens, the script writes empty feeds and the site keeps the current fallback UI.
- Keep Instagram/X API rendering behind a future server/admin integration unless a stable token-management workflow is ready.

## 承認後SNS投稿

イベントを管理画面から公開すると、`social-notices` に Facebook / Instagram / X の配信待ちが作成されます。店側または保守担当者が投稿文を確認し、`SNS配信状態` を `投稿承認済み` にして公開すると、GitHub Actions の `Publish approved social notices` で投稿対象になります。

- `deliveryStatus = draft`: 下書き。投稿されません。
- `deliveryStatus = approved`: 投稿対象。`externalPostId` が空のものだけ投稿します。
- `deliveryStatus = posted`: 投稿済み。再投稿しません。
- `deliveryStatus = failed`: 投稿失敗。`lastPublishError` に理由を残します。
- `scheduledAt`: 空欄なら承認後すぐ投稿対象。日時が入っている場合は、その時刻以降に投稿対象になります。

管理画面トップの運用アラートでは、イベント情報の不足、SNS投稿失敗、Instagram画像不足、APIトークン未設定、予約投稿時刻を過ぎた未投稿を確認できます。

投稿用の追加シークレット:

```text
X_ACCESS_TOKEN
```

Facebook Page投稿は `FACEBOOK_PAGE_ACCESS_TOKEN`、Instagram投稿は `INSTAGRAM_ACCESS_TOKEN` と `INSTAGRAM_USER_ID` を使います。Instagram API投稿には `https://` で始まる画像URLが必要です。トークンが未設定の場合、サイト公開とGoogle Calendar同期は止めず、該当SNS投稿だけスキップします。
