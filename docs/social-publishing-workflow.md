# 承認後SNS投稿ワークフロー

Facebookイベントを管理画面から公開すると、`social-notices` に Facebook / Instagram / X の配信待ちが作成されます。投稿文を確認し、`SNS配信状態` を `投稿承認済み` にして公開すると、GitHub Actions の `Publish approved social notices` で投稿対象になります。

## microCMS追加フィールド

`social-notices` に以下のフィールドを追加します。

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| postText | SNS投稿文 | テキストエリア | false |
| image | SNS投稿画像 | 画像 | false |
| scheduledAt | SNS予約投稿日時 | テキストフィールド | false |
| deliveryStatus | SNS配信状態 | セレクト | true |
| externalPostId | 投稿済みID | テキストフィールド | false |
| lastPublishError | 投稿エラー | テキストエリア | false |
| sourceEventId | 元イベントID | テキストフィールド | false |
| sourceEventUrl | 元イベントURL | テキストフィールド | false |
| sourceEventTitle | 元イベント名 | テキストフィールド | false |
| approvedAt | 承認日時 | テキストフィールド | false |
| postedAt | 投稿日時 | テキストフィールド | false |

`deliveryStatus` の選択肢は `draft` / `approved` / `posted` / `failed` です。
`scheduledAt` は空欄なら承認後すぐ投稿対象です。日時を入れる場合は `2026-07-01T18:00` のように入力し、その時刻以降のSNS投稿ジョブで配信されます。

管理画面トップの「要確認」には、今月・来月の公開イベントの不足項目、SNS投稿失敗、Instagram画像不足、APIトークン未設定、予約時刻を過ぎた未投稿が表示されます。警告は確認用で、保存や公開そのものは止めません。

## 運用

- `draft`: イベント公開時に作成される下書き。投稿されません。
- `approved`: 投稿対象。`externalPostId` が空のものだけ投稿されます。
- `posted`: 投稿済み。再投稿されません。
- `failed`: 投稿失敗。`lastPublishError` を確認します。

投稿用シークレット:

```text
FACEBOOK_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
X_ACCESS_TOKEN
```

トークン未設定時は該当SNS投稿だけスキップし、HP公開とGoogle Calendar同期は止めません。Instagram API投稿には `https://` で始まる画像URLが必要です。
