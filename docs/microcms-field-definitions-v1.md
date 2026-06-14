# microCMS フィールド定義 v1

## `site-settings`

形式: オブジェクト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 住所 | `address` | テキストフィールド | yes |
| 電話番号 | `phone` | テキストフィールド | yes |
| 営業時間 | `hoursLabel` | テキストエリア | yes |
| イベント日の営業時間補足 | `eventHoursNote` | テキストエリア | no |
| 喫煙について | `smokingLabel` | テキストエリア | yes |
| チャージ | `chargeLabel` | テキストフィールド | yes |
| Google Map URL | `googleMapsUrl` | テキストフィールド | yes |
| 経路案内URL | `directionsUrl` | テキストフィールド | no |
| Instagram URL | `instagramUrl` | テキストフィールド | yes |
| Facebook URL | `facebookUrl` | テキストフィールド | yes |
| X URL | `xUrl` | テキストフィールド | yes |
| Online Store URL | `onlineStoreUrl` | テキストフィールド | no |

## `home`

形式: オブジェクト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| TOP見出し | `heroTitle` | テキストフィールド | yes |
| TOP説明文 | `heroLead` | テキストエリア | yes |
| 初回来店向け説明文 | `firstVisitLead` | テキストエリア | yes |
| アクセス補足文 | `accessNote` | テキストエリア | yes |
| TOP画像 | `heroImage` | 画像 | no |
| InstagramウィジェットURL | `instagramWidgetSrc` | テキストフィールド | no |

## `hero-slides`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 表示ページ | `page` | セレクト | yes |
| 管理用タイトル | `title` | テキストフィールド | no |
| 画像 | `image` | 画像 | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | yes |

`page` の選択肢:

| 表示名 | 値 |
| --- | --- |
| TOP | `home` |
| Events | `events` |
| Party | `party` |
| Menu | `menu` |
| Access | `access` |

## `events`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| イベント名 | `title` | テキストフィールド | yes |
| 日付 | `date` | 日時 | yes |
| OPEN | `openTime` | テキストフィールド | no |
| START | `startTime` | テキストフィールド | no |
| 出演者 | `performers` | テキストエリア | no |
| 料金 | `price` | テキストフィールド | no |
| 予約方法 | `reservation` | テキストエリア | no |
| 画像 | `image` | 画像 | no |
| 公開する | `isPublished` | 真偽値 | yes |

## `menu`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| メニュー名 | `name` | テキストフィールド | yes |
| 英語名 | `englishName` | テキストフィールド | no |
| 料金 | `price` | テキストフィールド | no |
| 説明 | `description` | テキストエリア | no |
| カテゴリ | `category` | セレクト | yes |
| 画像 | `image` | 画像 | no |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

`category` の選択肢:

| 表示名 | 値 |
| --- | --- |
| Food | `food` |
| Drink | `drink` |

v1ではドリンク一覧は `drink-menu-sheets` の画像管理を基本にします。

## `drink-menu-sheets`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| タイトル | `title` | テキストフィールド | yes |
| メニュー画像 | `image` | 画像 | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | yes |

## `party-plans`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| プラン名 | `title` | テキストフィールド | yes |
| 料金 | `price` | テキストフィールド | yes |
| 説明 | `body` | テキストエリア | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

## `equipment-rental`

形式: オブジェクト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 見出し | `title` | テキストフィールド | yes |
| 料金 | `price` | テキストフィールド | no |
| 説明 | `body` | テキストエリア | yes |
| PDF URL | `pdfUrl` | テキストフィールド | no |

## `social-notices`

形式: リスト

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| SNS種別 | `platform` | セレクト | yes |
| 表示タイトル | `title` | テキストフィールド | yes |
| 投稿URL | `url` | テキストフィールド | yes |
| 表示日 | `date` | 日時 | no |
| 説明 | `description` | テキストエリア | no |
| 公開する | `isPublished` | 真偽値 | yes |

`platform` の選択肢:

| 表示名 | 値 |
| --- | --- |
| Instagram | `instagram` |
| Facebook | `facebook` |
| X | `x` |
