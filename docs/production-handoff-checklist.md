# Production Handoff Checklist

公開前から納品後までの確認リストです。納品先にはGitHubではなく、サイトURLと管理画面URLを渡す前提で整理しています。

## 1. 公開前に決めること

- ユーザーが開く本番URL: `https://www.bassic.jp/index.html`
- 検索エンジン向けの正規URL: `https://www.bassic.jp/`
- Googleビジネスプロフィールの公式サイトURL
- 通常営業時間とイベント日の通常営業開始時間
- 喫煙可否とイベント中の禁煙対応
- テーブル・チャージ
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
ユーザー向けの入口が `https://www.bassic.jp/index.html` でも、canonical、sitemap、OGP、JSON-LD、hreflang は `https://www.bassic.jp/` 基準に統一します。`/` と `/index.html` が別ページ扱いになると検索評価が分散するためです。

管理画面:

```env
NEXT_PUBLIC_PUBLIC_SITE_URL=https://www.bassic.jp/
```

`NEXT_PUBLIC_PUBLIC_SITE_URL` は管理画面の「公開サイトを開く」導線とSNS状態確認で使います。公開サイトの本番URLと揃えてください。

## 4. 公開前チェック

毎回実行するもの:

```bash
npm run typecheck
npm run typecheck:admin-app
npm run check:admin-app
npm run build
npm run build:admin-app
npm run smoke:links
npm run smoke:content
npm run smoke:seo
```

microCMS接続情報を設定した後だけ実行するもの:

```bash
npm run smoke:cms
```

`smoke:cms` はmicroCMSのAPI IDや必須項目が合っているか確認します。microCMS未接続の場合はスキップします。納品前に管理画面を実運用へ移す時は、必ず本物のmicroCMS接続情報で一度通します。

FacebookイベントをGoogle Calendarへ反映する前に実行するもの:

```bash
npm run sync:calendar:check
```

`sync:calendar:check` はGoogle Calendarへ書き込まず、同期予定のタイトル、日時、FacebookイベントURL、画像URLを確認します。警告が出た場合は同期せず、管理画面のイベント内容を直してから再実行します。

本番URLへ切り替える時は、`NEXT_PUBLIC_BASE_PATH` を空にしてからビルドします。仮URLの `https://token08.github.io/bassic/` で使う `/bassic` の設定が残っていると、本番URLのリンクや画像パスがずれます。

```powershell
$env:NEXT_PUBLIC_SITE_URL="https://www.bassic.jp"
Remove-Item Env:\NEXT_PUBLIC_BASE_PATH -ErrorAction SilentlyContinue
npm run build
npm run smoke:seo
npm run smoke:links
npm run smoke:content
```

## 5. 画面で見る場所

- TOP: ヒーロー画像、First Visit、営業情報カード、SNS欄、アクセス欄
- Events: Google Calendar、イベント説明、予約導線
- Menu: ドリンク画像スライダー、フードカード、画像モーダル
- Party: プラン、機材レンタル、詳細PDFリンク、Use Case
- Access: 背景画像、住所、営業時間、喫煙、Google Map
- スマホ: ハンバーガーメニュー、Language、下部固定CTA、H1のはみ出し

## 6. 公開後24時間以内に見ること

- スマホとPCで `https://www.bassic.jp/index.html` を開き、TOP、Events、Menu、Party、Accessへ移動できる
- スマホでハンバーガーメニュー、Language、下部固定CTA（電話、地図、Instagram、予約）が押せる
- Google Mapで `public bar Bassic.` を開き、公式サイトURL、住所、電話、営業時間がサイト表記と一致している
- 電話、Google Map、予約メール、Instagram、Facebook、X、オンラインストア、機材PDFリンクが開く
- Search Consoleで `https://www.bassic.jp/sitemap.xml` を送信し、インデックス登録状況を確認する
- 管理画面の「確認するページ」から公開ページを開き、再読み込み後に反映を確認できる

## 7. FacebookイベントからGoogle Calendarへ反映する時

1. 管理画面で「イベント」を開く
2. FacebookイベントURL（個別ページURL）を貼る
3. 「Facebookから読み取る」を押す
4. タイトル、画像、日付、STARTを確認する
5. 日付またはSTARTが取れない場合は手入力する
6. 管理画面の「Google Calendar反映依頼メモ」で「コピーする」を押し、依頼文に公開状態、イベント名、日付、START、END、FacebookイベントURL、画像URLが入ることを確認する
7. 依頼文の公開状態が「公開するON」になっていることを確認する
8. 公開してから `npm run sync:calendar:check` で同期内容を確認する
9. 依頼されたイベント名、または依頼メモのイベント名が確認結果の `summary` と一致していることを確認する
10. 確認結果の `description` 内にある `画像:` が本番URL、またはFacebookなどの外部URLになっていることを確認する
11. 問題なければ `npm run sync:calendar` を実行する

画像はGoogle Calendarの説明欄にURLとして入ります。月表示で大きく画像カードとして表示されることは保証しません。
警告が残っている場合、`sync:calendar:check` と本番同期は止まります。警告が出た時は管理画面のイベント内容を直してから、もう一度 `sync:calendar:check` を実行してください。

## 8. 納品先に渡すもの

- サイトURL
- 管理画面URL
- 管理画面ログイン情報
- 操作マニュアル: `docs/delivery-admin-manual.md`
- 更新できる項目一覧
- 困った時の連絡先

GitHub、Actions、APIキー、環境変数は制作側で管理します。納品先が普段触るのは管理画面だけにします。
