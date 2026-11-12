# SNS下書きからの手動投稿と将来の自動投稿

## 初回の運用: X・Instagramへ手動投稿

Facebookイベントを管理画面から公開すると、X・Instagramの下書きが作成されます。「SNS用の文面を開く」から選び、編集した現在の文面を使います。Xは「Xで投稿する」で文面入りの投稿画面へ進みます。Instagramは「文面をコピーしてInstagramを開く」からPCの「作成」で画像を選び、文面を貼り付けます。画像は「画像をPCに保存」で用意します。配信元のCORS制限等で保存できない場合は「画像を開く」から右クリックで保存できます。最終投稿は各SNSでスタッフが確定します。ボタンを開いたことや文面をコピーしたことを「投稿済み」とは扱いません。

同じイベント・投稿先の下書きは再公開しても増やしません。編集済みの文面・画像は残し、元イベントと差分がある場合は確認を促します。SNS下書きだけ失敗したときは公開結果に出る「SNS下書きだけをやり直す」を使います。保存済みの最新イベントを確認して、不足分だけ作成します。下書きの存在を確認できないときは、新規作成せず再確認を案内します。

## 将来の自動投稿: 店舗の権限確認後に有効化

以下は保守担当者向けの既存機能です。初回運用では `ENABLE_SOCIAL_PUBLISHING` を有効にしません。店舗側の運用・各サービスの権限を確認した後に限り、Facebook / Instagram / X の投稿文を確認して `SNS配信状態` を `投稿承認済み` にし、公開すると、GitHub Actions の `Publish approved social notices` で投稿対象にできます。

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
