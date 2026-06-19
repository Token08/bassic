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

`instagramWidgetSrc` はLightWidgetなど外部サービスで発行したiframe URLだけを入力します。Instagram IDだけでは直近投稿一覧を安定表示できません。

TOPを含む各ページのメイン画像は、下記の `hero-slides` で管理します。画像変更の入口を分けないため、`home` には画像フィールドを作りません。

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

| 表示名 | fieldId | 種類 | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| イベント名 | `title` | テキスト | yes |  |
| 日付 | `date` | 日付 | yes | 開催日だけを入れます。時刻は `OPEN` / `START` / `END` に分けて入力 |
| OPEN | `openTime` | テキスト | no | `18:30` のように半角数字と `:` で入力 |
| START | `startTime` | テキスト | no | `19:00` のように半角数字と `:` で入力 |
| END | `endTime` | テキスト | no | `22:00` のように半角数字と `:` で入力。深夜2時終了なら `02:00` |
| 出演者 | `performers` | テキストエリア | no |  |
| 料金 | `price` | テキスト | no |  |
| 予約方法 | `reservation` | テキストエリア | no |  |
| FacebookイベントURL・詳細URL | `sourceUrl` | テキスト | no |  |
| FacebookイベントID | `sourceId` | hidden / 管理画面で自動入力 | no |  |
| 取り込み元 | `sourceType` | hidden / 管理画面で自動入力 | no |  |
| 画像 | `image` | 画像 | no |  |
| 公開する | `isPublished` | 真偽値 | yes |  |

`sourceId` はFacebookイベントURLから取り込めたイベントIDです。Google Calendar同期時の重複防止に使うため、通常は店舗側で直接編集しません。
`sourceType` は管理画面側で自動入力する保守用の値です。通常は店舗側で直接編集しません。Facebookイベントを取り込んだ場合は `facebook` が入ります。
`日付` は開催日のみを入れます。開場・開始・終了の時刻は `OPEN` / `START` / `END` に分けて入力します。
`日付` と `START` は通常イベントでは任意入力を許容しますが、FacebookイベントURLから取り込んだイベントを公開する場合は管理画面側で入力確認します。
`sourceUrl` はGoogle Calendarへ反映する時の詳細リンクにも使います。FacebookイベントをGoogle Calendarにも載せたい場合は、イベント一覧ページではなく個別イベントページのURLを入れてください。
`image` はGoogle Calendarの説明欄に画像URLとして入ります。月表示で画像カードのように大きく表示されることは保証されません。

## `menu`

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| メニュー名 | `name` | テキスト | yes |
| 英語名 | `englishName` | テキスト | no |
| 料金 | `price` | テキスト | no | 公開する場合は必ず入力 |
| 補足メモ | `description` | テキストエリア | no |
| カテゴリ | `category` | hidden / 管理画面で自動入力 | no |
| 画像 | `image` | 画像 | no | 公開する場合は必ず入力 |
| 表示順 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

メニューカードは画像、名前、料金を中心に表示します。`description` は検索向けや将来表示用の補足として扱い、通常のメニューカード本文としては使いません。
管理画面では下書き保存なら料金・画像が空でも保存できますが、公開する場合は料金と画像の入力を必須として扱います。

現在のサイトでは、フードは `menu`、ドリンク表は `drink-menu-sheets` で管理します。`category` はフードメニュー作成時に管理画面側で `food` を自動入力するため、店舗側が選ぶ必要はありません。

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

保守用の文言設定です。日常更新は `home`、`menu`、`events`、`site-settings` を優先します。
同じページの文言が複数ある場合は、`displayOrder` が大きいものを優先して使います。

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
| カレンダー補足 | `calendarNote` | テキストエリア | no |
| ドリンク補足 | `drinkLead` | テキストエリア | no |
| フード補足 | `foodLead` | テキストエリア | no |
| 貸切補足 | `partyLead` | テキストエリア | no |
| 機材レンタル補足 | `rentalLead` | テキストエリア | no |
| 優先順位 | `displayOrder` | 数字 | no |
| 公開する | `isPublished` | 真偽値 | no |

## `page-sections`

保守用の表示切替です。OFFにすると該当セクションが公開サイトから消えます。通常運用では変更しません。

| 表示名 | fieldId | 種類 | 必須 |
| --- | --- | --- | --- |
| ページ | `page` | セレクト | yes |
| セクション | `sectionKey` | セレクト | yes |
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
