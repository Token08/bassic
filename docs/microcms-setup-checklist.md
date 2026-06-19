# microCMS Setup Checklist

納品先にはGitHubを触らせず、microCMSの管理画面だけで更新できる状態を目指します。

初期入力の参考値は `docs/cms-sample-content-v1.json`、公開前の確認順は `docs/production-handoff-checklist.md` を参照してください。
各APIの細かい項目名、必須項目、入力形式は `docs/microcms-field-definitions-v1.md` を正とします。

## 1. 作成するAPI

microCMSで以下のAPIを作成します。API IDはコードと一致させてください。

| API ID | 種類 | 用途 |
| --- | --- | --- |
| `site-settings` | オブジェクト形式 | 住所、電話、営業時間、喫煙、テーブル・チャージ、SNS URL |
| `home` | オブジェクト形式 | TOP文言、First Visit文言、Instagram表示URL |
| `hero-slides` | リスト形式 | 各ページのメイン背景画像 |
| `events` | リスト形式 | イベントスケジュール |
| `menu` | リスト形式 | フード/ドリンク名、料金、画像 |
| `drink-menu-sheets` | リスト形式 | ドリンクメニュー表画像 |
| `party-plans` | リスト形式 | 貸切、二次会、レンタルの案内 |
| `equipment-rental` | オブジェクト形式 | 機材レンタル説明、料金、PDFリンク |
| `social-notices` | リスト形式 | SNS欄に出す投稿URLカード |
| `page-copy` | リスト形式 | 各ページの見出し、説明文 |
| `page-sections` | リスト形式 | 既存セクションの表示/非表示、表示順 |
| `custom-sections` | リスト形式 | 追加のお知らせセクション |

## 2. home

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `heroTitle` | TOP見出し | テキストフィールド | 必須 |
| `heroLead` | TOP説明文 | テキストエリア | 必須 |
| `firstVisitLead` | 初めての方向け説明 | テキストエリア | 必須 |
| `accessNote` | アクセス補足 | テキストエリア | 必須 |
| `instagramWidgetSrc` | Instagram表示URL | テキストフィールド | 任意 |

`instagramWidgetSrc` は LightWidget などで発行された iframe の `src` URLだけを貼ります。未入力でもサイトは崩れません。
TOP画像は `home` ではなく、`hero-slides` の `page = home` で管理します。
`displayOrder` や `優先順位` などの数字欄は、0以上の半角整数だけを入力します。小数やマイナスは使いません。

## 3. events

| fieldId | 表示名 | 種類 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| `title` | イベント名 | テキストフィールド | 必須 |  |
| `date` | 開催日 | 日付 | 必須 | 開催日だけを入れます。時刻は `OPEN` / `START` / `END` に分けて入力 |
| `openTime` | OPEN | テキストフィールド | 任意 | `18:30` のように半角数字と `:` で入力 |
| `startTime` | START | テキストフィールド | 任意 | `19:00` のように半角数字と `:` で入力 |
| `endTime` | END | テキストフィールド | 任意 | `22:00` のように半角数字と `:` で入力。深夜2時終了なら `02:00` |
| `performers` | 出演者 | テキストエリア | 任意 |  |
| `price` | 料金 | テキストフィールド | 任意 |  |
| `reservation` | 予約方法 | テキストエリア | 任意 |  |
| `sourceUrl` | FacebookイベントURL・詳細URL | テキストフィールド | 任意 |  |
| `sourceId` | FacebookイベントID | テキストフィールド | 任意 |  |
| `sourceType` | 取り込み元 | テキストフィールド | 任意 |  |
| `image` | イベント画像 | 画像 | 任意 |  |
| `isPublished` | 公開する | 真偽値 | 必須 |  |

下書き中は `isPublished` をオフにします。
Facebookイベントから取り込む場合、`sourceUrl` は個別イベントページURLを入れ、`sourceId` と `sourceType` は管理画面側で自動入力します。`sourceId` はGoogle Calendar同期時の重複防止に使います。
`date` は開催日だけを入れます。開場・開始・終了の時刻は `OPEN` / `START` / `END` に分けて入力します。

## 4. menu

| fieldId | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| `name` | メニュー名 | テキストフィールド | 必須 |
| `englishName` | 英語名 | テキストフィールド | 任意 |
| `price` | 料金 | テキストフィールド | 任意 | 公開する場合は必ず入力 |
| `description` | 補足メモ | テキストエリア | 任意 |
| `category` | カテゴリ | hidden / 管理画面で自動入力 | 任意 |
| `image` | メニュー画像 | 画像 | 任意 | 公開する場合は必ず入力 |

フードメニューのカードは画像、名前、料金を中心に表示します。`description` は検索向けや将来表示用の補足として扱い、通常のメニューカード本文としては使いません。
下書き保存なら料金・画像が空でも保存できますが、公開する場合は料金と画像の入力を必須として扱います。

現在のサイトでは、フードは `menu`、ドリンク表は `drink-menu-sheets` で管理します。`category` はフードメニュー作成時に管理画面側で `food` を自動入力するため、店舗側が選ぶ必要はありません。

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

## 7. FacebookイベントとGoogle Calendar連携の注意

イベントをGoogle Calendarへ反映する場合、`events` の `sourceUrl` はFacebookの個別イベントページURLを入れます。イベント一覧ページのURLでは同期対象として扱えません。

FacebookイベントURLから取り込んだイベントを公開する場合は、`date` と `startTime` が入っているか管理画面側で確認します。日付またはSTARTが取れない場合は手入力します。時間は `19:00` のように入力し、`OPEN` や `START` の文字は入れません。

`image` はCalendar説明欄の画像URLとして使います。Google Calendarの月表示で画像カードとして大きく出ることは保証されないため、画像はサイト側のイベント表示と説明欄リンク用と考えてください。

## 8. 接続確認

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
