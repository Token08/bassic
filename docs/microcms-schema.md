# microCMS Content API Schema

microCMS管理画面で以下のAPIを作成します。API IDはコードと一致させてください。

## home

種類: オブジェクト形式

| フィールドID | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| heroTitle | トップ見出し | テキストフィールド | true |
| heroLead | トップ説明文 | テキストエリア | true |
| firstVisitLead | 初めての方向け説明 | テキストエリア | true |
| accessNote | アクセス補足 | テキストエリア | true |
| instagramWidgetSrc | Instagram表示URL | テキストフィールド | false |

TOP画像は `home` ではなく `hero-slides` の `page = home` で管理します。画像変更の入口を分けないため、`home.heroImage` は新規作成しません。

## events

種類: リスト形式

| フィールドID | 表示名 | 種類 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| title | イベント名 | テキストフィールド | true |  |
| date | 開催日 | 日時 | true |  |
| openTime | OPEN | テキストフィールド | false | `18:30` のように入力 |
| startTime | START | テキストフィールド | false | `19:00` のように入力 |
| endTime | END | テキストフィールド | false | `22:00` のように入力。深夜2時終了なら `02:00` |
| performers | 出演者 | テキストエリア | false |  |
| price | 料金 | テキストフィールド | false |  |
| reservation | 予約方法 | テキストエリア | false |  |
| sourceUrl | FacebookイベントURL・詳細URL | テキストフィールド | false |  |
| sourceId | FacebookイベントID | テキストフィールド | false |  |
| sourceType | 取り込み元 | テキストフィールド | false |  |
| image | イベント画像 | 画像 | false |  |
| isPublished | 公開する | 真偽値 | true |  |

Facebookイベントから取り込んだイベントは `sourceUrl` に個別イベントページURL、`sourceId` にFacebookイベントID、`sourceType` に `facebook` が入ります。Google Calendarへ反映する時は、`sourceUrl` と `image` を説明欄リンクとして使い、`sourceId` は重複防止に使います。

## menu

種類: リスト形式

| フィールドID | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| name | メニュー名 | テキストフィールド | true |
| englishName | 英語名 | テキストフィールド | false |
| price | 価格 | テキストフィールド | false |
| description | 説明 | テキストエリア | false |
| category | カテゴリ | セレクト | true |
| image | メニュー画像 | 画像 | false |

`category` は `food` / `drink` の2択にします。
`image` が未設定の場合、サイト側のカテゴリ別フォールバック画像を表示します。

## party-plans

種類: リスト形式

| フィールドID | 表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| title | プラン名 | テキストフィールド | true |
| price | 価格 | テキストフィールド | true |
| body | 説明 | テキストエリア | true |

## 運用メモ

- イベント更新を最優先にするため、`events` は公開/非公開を必ず設定します。
- トップ画像はDrive素材から選び、横長で店内の雰囲気が伝わる写真を推奨します。
- メニュー画像は正方形または横長を推奨します。未設定でも公開できますが、来店前の分かりやすさを優先するメニューには画像を設定します。
- 営業時間やGoogle Map URLはCMSではなく `lib/site.ts` / 環境変数で管理します。表記ゆれを防ぐためです。

## social-notices

種類: リスト形式

TOPページのSNS欄に表示する「お知らせカード」です。Xの自動タイムラインはAPI制限で不安定なため、納品運用ではここに投稿URLを貼って表示します。

| fieldId | 管理画面の表示名 | 種類 | 必須 |
| --- | --- | --- | --- |
| title | 表示タイトル | テキストフィールド | true |
| platform | SNS種別 | セレクト | true |
| url | 投稿URL | テキストフィールド | true |
| date | 表示日 | 日時 | false |
| description | 短い説明 | テキストエリア | false |
| isPublished | 公開する | 真偽値 | true |

`platform` は `instagram` / `facebook` / `x` の3択です。

X欄を更新したい場合は、`platform` を `x` にして、Xの投稿URL、表示タイトル、短い説明を登録してください。公開前の下書きは `isPublished` を false にします。

## Instagramタイムライン表示

Instagramの直近投稿を自動表示したい場合は、LightWidgetなどの外部ウィジェットで発行されたiframe URLを `home.instagramWidgetSrc` に登録します。

- URLは `https://` から始まるものだけ使用します。
- 外部scriptタグは貼りません。iframe URLだけを入力してください。
- 未入力の場合、Instagram欄は崩れないプロフィール/お知らせカード表示に戻ります。
