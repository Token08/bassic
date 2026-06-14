# Bassic. 管理画面 操作マニュアル v1

## 渡すもの

- サイトURL
- 管理入口URL: `/admin/`
- microCMS管理画面URL
- ログイン情報
- この操作マニュアル

GitHub、GitHub Actions、APIキーは制作者側で管理します。

## 更新後の反映

microCMSで保存・公開すると、GitHub Actionsが自動でサイトを再ビルドします。反映まで数分かかる場合があります。

反映されない場合は制作者側で以下を確認します。

```bash
npm run check:admin
npm run smoke:cms
npm run deploy:cms
```

## 店舗情報を変える

`site-settings` を開きます。

更新できる内容:

- 住所
- 電話番号
- 営業時間
- イベント日の営業時間補足
- 喫煙について
- チャージ
- Google Map URL
- Instagram / Facebook / X URL

## TOPページを変える

`home` を開きます。

更新できる内容:

- TOP見出し
- TOP説明文
- 初回来店向け説明文
- アクセス補足文
- TOP画像
- Instagram外部ウィジェットURL

Instagramの投稿一覧を自動表示したい場合は、LightWidgetなどで発行したiframeの `src` URLだけを入れます。scriptタグは貼りません。

## メイン画像を変える

`hero-slides` を開きます。

`page` で表示場所を選びます。

- `home`: TOP
- `events`: Events
- `party`: Party
- `menu`: Menu
- `access`: Access

`displayOrder` は小さい数字から表示されます。非表示にしたい画像は `isPublished` をOFFにします。

## イベントを追加する

`events` を開きます。

入力する内容:

- イベント名
- 日付
- OPEN
- START
- 出演者
- 料金
- 予約方法
- 画像
- 公開/非公開

下書き中は `isPublished` をOFFにします。

## メニューを変える

フードは `menu` を開きます。

入力する内容:

- メニュー名
- 英語名
- 料金
- 説明
- カテゴリ
- 画像
- 表示順
- 公開/非公開

カテゴリは `food` を使います。v1ではドリンク一覧は画像シート方式を基本にします。

## ドリンクメニュー画像を変える

`drink-menu-sheets` を開きます。

ドリンクメニュー表の画像をアップロードし、`displayOrder` を設定します。古い画像を一時的に隠す場合は `isPublished` をOFFにします。

## 貸切・レンタルを変える

貸切プランは `party-plans` を開きます。

機材レンタルの説明とPDFは `equipment-rental` を開きます。

PDFはmicroCMSにアップロードしたURL、または既存PDFのURLを入れます。

## SNSのお知らせを追加する

`social-notices` を開きます。

入力する内容:

- SNS種別: `instagram`, `facebook`, `x`
- 表示タイトル
- 投稿URL
- 表示日
- 説明
- 公開/非公開

SNSの自動タイムライン取得ではなく、投稿URLをカードとして表示する方式です。
