# Bassic. microCMS Admin v1

目的: 納品先がGitHubを触らず、microCMS管理画面から日本語サイトの主要情報を更新できるようにする。

## 対応API

| API ID | 形式 | 用途 |
| --- | --- | --- |
| `site-settings` | オブジェクト | 住所、電話、営業時間、喫煙、チャージ、SNSリンク、Google Map URL |
| `home` | オブジェクト | TOP文言、初回来店文言、アクセス補足、TOP画像、InstagramウィジェットURL |
| `hero-slides` | リスト | TOP / Events / Party / Menu / Access のメイン画像・スライド画像 |
| `events` | リスト | イベント名、日付、時間、料金、予約方法、画像、公開/非公開 |
| `menu` | リスト | フード名、料金、画像、表示順、公開/非公開 |
| `drink-menu-sheets` | リスト | ドリンクメニュー画像、表示順、公開/非公開 |
| `party-plans` | リスト | 貸切・二次会・レンタル料金、説明、表示順、公開/非公開 |
| `equipment-rental` | オブジェクト | 機材レンタル説明、PDFリンク |
| `social-notices` | リスト | Instagram / Facebook / X のお知らせカード |

初期入力のたたき台は `docs/cms-sample-content-v1.json` を参照する。画像フィールドはmicroCMS管理画面で画像をアップロードして差し替える。

## 必須フィールド

### `site-settings`

| fieldId | 種類 |
| --- | --- |
| `address` | テキスト |
| `phone` | テキスト |
| `hoursLabel` | テキストエリア |
| `eventHoursNote` | テキストエリア |
| `smokingLabel` | テキストエリア |
| `chargeLabel` | テキスト |
| `googleMapsUrl` | テキスト |
| `directionsUrl` | テキスト |
| `instagramUrl` | テキスト |
| `facebookUrl` | テキスト |
| `xUrl` | テキスト |
| `onlineStoreUrl` | テキスト |

### `hero-slides`

| fieldId | 種類 | 備考 |
| --- | --- | --- |
| `page` | セレクト | `home`, `events`, `party`, `menu`, `access` |
| `title` | テキスト | 管理用 |
| `image` | 画像 | サイト表示画像 |
| `displayOrder` | 数字 | 小さい順 |
| `isPublished` | 真偽値 | 公開する場合true |

### リスト型共通

`menu`, `drink-menu-sheets`, `party-plans` は `displayOrder` と `isPublished` を持たせる。未設定でも既存の静的データへフォールバックする。

## GitHub Actions反映Webhook

GitHub Pagesは静的サイトなので、microCMS更新だけでは公開サイトは更新されない。microCMSのWebhookでGitHub Actionsを起動する。

microCMS Webhookの送信先:

```text
https://api.github.com/repos/token08/bassic/dispatches
```

HTTP method:

```text
POST
```

Headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer <GitHub fine-grained token>
X-GitHub-Api-Version: 2022-11-28
```

Body:

```json
{
  "event_type": "microcms_publish"
}
```

GitHub tokenには対象リポジトリのActionsを起動できる権限が必要。トークンは納品先に渡さず、制作者側で管理する。

## GitHub Secrets

GitHub ActionsのRepository secretsに以下を設定する。

```text
MICROCMS_SERVICE_DOMAIN
MICROCMS_API_KEY
```

ローカルで対話式に設定する場合:

```bash
npm run setup:admin
```

このコマンドはGitHub Secretsに2値を登録し、ローカル検証用の `.env.local` も更新する。

## 確認コマンド

```bash
npm run check:admin
npm run smoke:cms
npm run typecheck
npm run build
```

`MICROCMS_SERVICE_DOMAIN` と `MICROCMS_API_KEY` が未設定の場合、サイトは既存の静的データでビルドされる。
