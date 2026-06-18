# microCMS フィールド定義 v1

この資料は、microCMS側で作るAPIと入力項目の定義です。API IDはサイト側のコードと一致している必要があります。

## 作成するAPI ID

| API ID | 形式 | 用途 |
| --- | --- | --- |
| `site-settings` | オブジェクト | 住所、電話、営業時間、喫煙、テーブル・チャージ、SNS URL、Google Map URL |
| `home` | オブジェクト | TOPページの主要文言、初回来店文言、Instagram表示URL |
| `hero-slides` | リスト | 各ページのメイン背景画像 |
| `events` | リスト | イベント情報 |
| `menu` | リスト | フードメニュー |
| `drink-menu-sheets` | リスト | ドリンクメニュー表画像 |
| `party-plans` | リスト | 貸切・二次会・レンタルプラン |
| `equipment-rental` | オブジェクト | 機材レンタル説明、PDFリンク |
| `social-notices` | リスト | Instagram / Facebook / X のお知らせカード |
| `page-copy` | リスト | 各ページの見出し、説明文 |
| `page-sections` | リスト | セクションの表示/非表示制御 |
| `custom-sections` | リスト | 将来追加する自由セクション |

## `site-settings`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 住所 | `address` | テキスト | yes |
| 電話番号 | `phone` | テキスト | yes |
| 通常営業時間 | `hoursLabel` | テキストエリア | yes |
| イベント日の営業時間補足 | `eventHoursNote` | テキストエリア | no |
| 喫煙について | `smokingLabel` | テキストエリア | yes |
| テーブル・チャージ | `chargeLabel` | テキスト | yes |
| Google Map URL | `googleMapsUrl` | テキスト | yes |
| 現在地から向かうURL | `directionsUrl` | テキスト | no |
| Instagram URL | `instagramUrl` | テキスト | yes |
| Facebook URL | `facebookUrl` | テキスト | yes |
| X URL | `xUrl` | テキスト | yes |
| Online Store URL | `onlineStoreUrl` | テキスト | no |

## `home`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| TOP見出し | `heroTitle` | テキスト | yes |
| TOP説明文 | `heroLead` | テキストエリア | yes |
| 初回来店説明文 | `firstVisitLead` | テキストエリア | yes |
| アクセス補足 | `accessNote` | テキストエリア | yes |
| Instagram表示URL | `instagramWidgetSrc` | テキスト | no |
| TOP画像 | `heroImage` | 画像 | no |

`instagramWidgetSrc` はLightWidgetなど外部サービスで発行したiframe URLだけを入力します。Instagram IDだけでは直近投稿一覧を安定表示できません。

## `hero-slides`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 表示ページ | `page` | セレクト | yes |
| 管理用タイトル | `title` | テキスト | no |
| 画像 | `image` | 画像 | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | yes |

`page` の選択肢:

| 表示名 | 値 |
| --- | --- |
| TOP | `home` |
| Events | `events` |
| Menu | `menu` |
| Party | `party` |
| Access | `access` |

## `events`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| イベント名 | `title` | テキスト | yes |
| 日付 | `date` | 日時 | yes |
| OPEN | `openTime` | テキスト | no |
| START | `startTime` | テキスト | no |
| END | `endTime` | テキスト | no |
| 出演者 | `performers` | テキストエリア | no |
| 料金 | `price` | テキスト | no |
| 予約方法 | `reservation` | テキストエリア | no |
| FacebookイベントURL・詳細URL | `sourceUrl` | テキスト | no |
| 取り込み元 | `sourceType` | hidden / 管理画面で自動入力 | no |
| 画像 | `image` | 画像 | no |
| 公開する | `isPublished` | 真偽値 | yes |

`sourceType` は管理画面側で自動入力する保守用の値です。通常は店舗側で直接編集しません。Facebookイベントを取り込んだ場合は `facebook` が入ります。
`START` は通常イベントでは任意ですが、FacebookイベントURLから取り込んだイベントを公開する場合は管理画面側で入力確認します。

## `menu`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| メニュー名 | `name` | テキスト | yes |
| 英語名 | `englishName` | テキスト | no |
| 料金 | `price` | テキスト | no |
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

現在のサイトでは、フードは `menu`、ドリンク表は `drink-menu-sheets` で管理します。

## `drink-menu-sheets`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| タイトル | `title` | テキスト | yes |
| メニュー表画像 | `image` | 画像 | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | yes |

## `party-plans`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| プラン名 | `title` | テキスト | yes |
| 料金 | `price` | テキスト | yes |
| 説明 | `body` | テキストエリア | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

## `equipment-rental`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| 見出し | `title` | テキスト | yes |
| 料金 | `price` | テキスト | no |
| 説明 | `body` | テキストエリア | yes |
| PDF URL | `pdfUrl` | テキスト | no |

## `social-notices`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| SNS種別 | `platform` | セレクト | yes |
| 表示タイトル | `title` | テキスト | yes |
| 投稿URL | `url` | テキスト | yes |
| 表示日 | `date` | 日時 | no |
| 説明 | `description` | テキストエリア | no |
| 公開する | `isPublished` | 真偽値 | yes |

`platform` の選択肢:

| 表示名 | 値 |
| --- | --- |
| Instagram | `instagram` |
| Facebook | `facebook` |
| X | `x` |

## `page-copy`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| ページ | `page` | セレクト | yes |
| ヒーロー小見出し | `heroEyebrow` | テキスト | no |
| ヒーロー見出し | `heroTitle` | テキスト | no |
| ヒーロー説明文 | `heroLead` | テキストエリア | no |
| 導入文 | `introLead` | テキストエリア | no |
| アクセス補足 | `accessNote` | テキストエリア | no |
| SNS見出し1行目 | `socialTitleLine1` | テキスト | no |
| SNS見出し2行目 | `socialTitleLine2` | テキスト | no |
| SNS説明文 | `socialLead` | テキストエリア | no |
| 一覧小見出し | `listEyebrow` | テキスト | no |
| 一覧見出し | `listTitle` | テキスト | no |
| カレンダー補足 | `calendarNote` | テキストエリア | no |
| ドリンク補足 | `drinkLead` | テキストエリア | no |
| フード補足 | `foodLead` | テキストエリア | no |
| 貸切補足 | `partyLead` | テキストエリア | no |
| 機材レンタル補足 | `rentalLead` | テキストエリア | no |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

## `page-sections`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| ページ | `page` | セレクト | yes |
| セクションキー | `sectionKey` | テキスト | yes |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

通常は制作者が設定します。店舗側が触る必要はありません。

## `custom-sections`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| ページ | `page` | セレクト | yes |
| 見出し | `title` | テキスト | yes |
| 本文 | `body` | テキストエリア | yes |
| 画像 | `image` | 画像 | no |
| リンク文言 | `linkLabel` | テキスト | no |
| リンクURL | `linkUrl` | テキスト | no |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |
