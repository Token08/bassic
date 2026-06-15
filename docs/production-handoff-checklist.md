# Production Handoff Checklist

公開前から納品後までの確認リストです。納品先にはGitHubではなく、サイトURLとmicroCMS管理画面を渡す前提で整理しています。

## 1. 公開前に決めること

- 本番URL: `https://www.bassic.jp`
- Googleビジネスプロフィールの公式サイトURL
- 通常営業時間とイベント日の通常営業開始時間
- 喫煙可否とイベント中の禁煙対応
- チャージ料金
- 予約の受付先メールアドレス
- Instagram一覧表示を使うかどうか

## 2. microCMSで作ること

- `home`
- `events`
- `menu`
- `party-plans`
- `social-notices`

詳しい項目は `docs/microcms-setup-checklist.md` を参照してください。初期入力の参考値は `docs/cms-sample-content.json` にあります。

## 3. サイト側で設定する環境変数

```env
MICROCMS_SERVICE_DOMAIN=
MICROCMS_API_KEY=
NEXT_PUBLIC_SITE_URL=https://www.bassic.jp
NEXT_PUBLIC_GOOGLE_MAPS_URL=
```

`NEXT_PUBLIC_SITE_URL` はURL確定前なら仮URLでも動きます。本番切り替え時にここを `https://www.bassic.jp` にします。

## 4. 公開前チェック

```bash
npm run smoke:cms
npm run typecheck
npm run build
npm run smoke:links
npm run smoke:seo
```

`smoke:cms` はmicroCMSのAPI IDや必須項目が間違っていないか確認します。microCMS未接続の場合はスキップします。

## 5. 画面で見る場所

- TOP: ヒーロー画像、First Visit、営業情報カード、SNS欄、アクセス欄
- Events: Google Calendar、イベント説明、予約導線
- Menu: ドリンク画像スライダー、フードカード、画像モーダル
- Party: プラン、機材レンタル、Use Case
- Access: 背景画像、住所、営業時間、喫煙、Google Map
- スマホ: ハンバーガーメニュー、Language、下部固定CTA、H1のはみ出し

## 6. 納品先に渡すもの

- サイトURL
- microCMS管理画面URL
- microCMSログイン情報
- 操作マニュアル: `docs/delivery-admin-manual.md`
- 更新できる項目一覧

GitHub、Actions、APIキー、環境変数は制作側で管理します。納品先が普段触るのはmicroCMSだけにします。
