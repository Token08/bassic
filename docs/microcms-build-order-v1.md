# microCMS 管理画面 作成順 v1

この順番で作ると、最初に最低限の公開確認ができます。

## 1. 最初に作る

### `site-settings`

店舗情報です。ここが入ると、住所・電話・営業時間・SNSリンクが管理画面から変えられます。

### `home`

TOPページの文言です。ここが入ると、TOPの見出しや初回来店向け文言を管理画面から変えられます。

確認:

```bash
npm run setup:admin
npm run smoke:cms
npm run deploy:cms
```

## 2. 画像まわり

### `hero-slides`

TOP / Events / Party / Menu / Access のメイン画像を管理します。

### `drink-menu-sheets`

ドリンクメニュー表の画像を管理します。

## 3. 更新頻度が高い内容

### `events`

イベント情報を管理します。

### `social-notices`

Instagram / Facebook / X の告知カードを管理します。

## 4. メニュー・貸切

### `menu`

フードメニューを管理します。

### `party-plans`

貸切・二次会プランを管理します。

### `equipment-rental`

機材レンタル説明とPDFリンクを管理します。

## 5. 最終確認

```bash
npm run check:admin
npm run smoke:cms
npm run deploy:cms
```

確認用URL:

```text
https://token08.github.io/bassic/
```

本番公開時は `NEXT_PUBLIC_SITE_URL=https://www.bassic.jp` にし、`NEXT_PUBLIC_BASE_PATH` を空にしてビルドします。
ユーザーが開く入口が `https://www.bassic.jp/index.html` の場合でも、canonical、sitemap、OGP、hreflang は `https://www.bassic.jp/` 基準に統一します。

microCMSのAPIキーとサービスドメインが未設定でも、サイトは静的フォールバックで表示されます。
