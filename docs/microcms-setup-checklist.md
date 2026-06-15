# microCMS Setup Checklist

納品先にはGitHubを触らせず、microCMSの管理画面だけで更新できる状態を目指します。

初期入力の参考値は `docs/cms-sample-content.json`、公開前の確認順は `docs/production-handoff-checklist.md` を参照してください。

## 1. 作成するAPI

microCMSで以下のAPIを作成します。API IDはコードと一致させてください。

| API ID | 種類 | 用途 |
| --- | --- | --- |
| `home` | オブジェクト形式 | TOP文言、First Visit文言、Instagram表示URL |
| `events` | リスト形式 | イベントスケジュール |
| `menu` | リスト形式 | フード/ドリンク名、料金、画像 |
| `party-plans` | リスト形式 | 貸切、二次会、レンタルの案内 |
| `social-notices` | リスト形式 | SNS欄に出す投稿URLカード |

## 2. home

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `heroTitle` | TOP見出し | テキストフィールド | 必須 |
| `heroLead` | TOP説明文 | テキストエリア | 必須 |
| `firstVisitLead` | 初めての方向け説明 | テキストエリア | 必須 |
| `accessNote` | アクセス補足 | テキストエリア | 必須 |
| `heroImage` | TOP画像 | 画像 | 任意 |
| `instagramWidgetSrc` | Instagram表示URL | テキストフィールド | 任意 |

`instagramWidgetSrc` は LightWidget などで発行された iframe の `src` URLだけを貼ります。未入力でもサイトは崩れません。

## 3. events

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `title` | イベント名 | テキストフィールド | 必須 |
| `date` | 開催日 | 日時 | 必須 |
| `openTime` | OPEN | テキストフィールド | 任意 |
| `startTime` | START | テキストフィールド | 任意 |
| `performers` | 出演者 | テキストエリア | 任意 |
| `price` | 料金 | テキストフィールド | 任意 |
| `reservation` | 予約方法 | テキストエリア | 任意 |
| `image` | イベント画像 | 画像 | 任意 |
| `isPublished` | 公開する | 真偽値 | 必須 |

下書き中は `isPublished` をオフにします。

## 4. menu

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `name` | メニュー名 | テキストフィールド | 必須 |
| `englishName` | 英語名 | テキストフィールド | 任意 |
| `price` | 料金 | テキストフィールド | 任意 |
| `description` | 説明 | テキストエリア | 任意 |
| `category` | カテゴリ | セレクト | 必須 |
| `image` | メニュー画像 | 画像 | 任意 |

`category` は `food` / `drink` の2択です。

## 5. party-plans

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `title` | プラン名 | テキストフィールド | 必須 |
| `price` | 料金 | テキストフィールド | 必須 |
| `body` | 説明 | テキストエリア | 必須 |

## 6. social-notices

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `platform` | SNS種別 | セレクト | 必須 |
| `title` | 表示タイトル | テキストフィールド | 必須 |
| `url` | 投稿URL | テキストフィールド | 必須 |
| `date` | 表示日 | 日時 | 任意 |
| `description` | 短い説明 | テキストエリア | 任意 |
| `isPublished` | 公開する | 真偽値 | 必須 |

`platform` は `instagram` / `facebook` / `x` の3択です。Xは自動タイムライン取得ではなく、投稿URLカードとして安定表示します。

## 7. 接続確認

ローカルまたはGitHub Actionsの環境変数に以下を設定します。

```env
MICROCMS_SERVICE_DOMAIN=サービスID
MICROCMS_API_KEY=APIキー
```

設定後に以下を実行します。

```bash
npm run smoke:cms
npm run typecheck
npm run build
npm run smoke:links
npm run smoke:seo
```

`smoke:cms` は環境変数が未設定の場合はスキップします。設定済みの場合は、API IDや必須項目が合っているか確認します。
