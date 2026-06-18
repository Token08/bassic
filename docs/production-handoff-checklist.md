# Production Handoff Checklist

公開前から納品後までの確認リストです。納品先にはGitHubではなく、サイトURLと管理画面URLを渡す前提で整理しています。

## 1. 公開前に決めること

- 本番URL: `https://www.bassic.jp`
- Googleビジネスプロフィールの公式サイトURL
- 通常営業時間とイベント日の通常営業開始時間
- 喫煙可否とイベント中の禁煙対応
- テーブルチャージ
- 予約受付メールアドレス
- Instagram一覧表示に外部ウィジェットを使うかどうか
- FacebookイベントをGoogle Calendarへ反映する運用担当

## 2. microCMSで作ること

- `site-settings`
- `home`
- `hero-slides`
- `events`
- `menu`
- `drink-menu-sheets`
- `party-plans`
- `equipment-rental`
- `social-notices`
- `page-copy`
- `page-sections`
- `custom-sections`

詳しい項目は `docs/microcms-setup-checklist.md` を参照してください。初期入力の参考値は `docs/cms-sample-content-v1.json` にあります。

## 3. サイト側で設定する環境変数

公開サイト本体:

```env
MICROCMS_SERVICE_DOMAIN=
MICROCMS_API_KEY=
NEXT_PUBLIC_SITE_URL=https://www.bassic.jp
NEXT_PUBLIC_GOOGLE_MAPS_URL=
```

`NEXT_PUBLIC_SITE_URL` はURL確定前なら仮URLでも動きます。本番切り替え時に `https://www.bassic.jp` にします。

管理画面:

```env
NEXT_PUBLIC_PUBLIC_SITE_URL=https://www.bassic.jp/
```

`NEXT_PUBLIC_PUBLIC_SITE_URL` は管理画面の「公開サイトを開く」導線とSNS状態確認で使います。公開サイトの本番URLと揃えてください。

## 4. 公開前チェック

```bash
npm run smoke:cms
npm run typecheck
npm run typecheck:admin-app
npm run check:admin-app
npm run build
npm run build:admin-app
npm run smoke:links
npm run smoke:seo
```

`smoke:cms` はmicroCMSのAPI IDや必須項目が合っているか確認します。microCMS未接続の場合はスキップします。

## 5. 画面で見る場所

- TOP: ヒーロー画像、First Visit、営業情報カード、SNS欄、アクセス欄
- Events: Google Calendar、イベント説明、予約導線
- Menu: ドリンク画像スライダー、フードカード、画像モーダル
- Party: プラン、機材レンタル、詳細PDFリンク、Use Case
- Access: 背景画像、住所、営業時間、喫煙、Google Map
- スマホ: ハンバーガーメニュー、Language、下部固定CTA、H1のはみ出し

## 6. FacebookイベントからGoogle Calendarへ反映する時

1. 管理画面で「イベント」を開く
2. FacebookイベントURL（個別ページURL）を貼る
3. 「Facebookから読み取る」を押す
4. タイトル、画像、日時を確認する
5. 日時が取れない場合は手入力する
6. 公開してから `npm run sync:calendar:dry` で同期内容を確認する
7. dry runの `description` 内にある `画像:` が本番URL、またはFacebookなどの外部URLになっていることを確認する
8. 問題なければ `npm run sync:calendar` を実行する

画像はGoogle Calendarの説明欄にURLとして入ります。月表示で大きく画像カードとして表示されることは保証しません。
警告が残っている場合、本番同期は止まります。警告が出た時は管理画面のイベント内容を直してから、もう一度dry runを実行してください。

## 7. 納品先に渡すもの

- サイトURL
- 管理画面URL
- 管理画面ログイン情報
- 操作マニュアル: `docs/delivery-admin-manual.md`
- 更新できる項目一覧
- 困った時の連絡先

GitHub、Actions、APIキー、環境変数は制作側で管理します。納品先が普段触るのは管理画面だけにします。
