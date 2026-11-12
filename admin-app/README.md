# Bassic. 専用管理画面

`admin-app/` は店舗スタッフ向けの管理画面です。公開サイトはGitHub Actionsで生成し、ロリポップへ反映します。管理画面はVercelで動かします。

## 画面とコードの構成

- `lib/admin-pages.ts`: 左側のページ選択と、各ページで編集できる項目の定義。
- `app/admin-client.tsx`: 現在使っている公開ページプレビュー、編集フォーム、保存・公開の操作。
- `app/public-page-canvas.tsx`: 公開ページから変更したい場所を選ぶプレビュー。
- `app/components/admin-image.tsx`: 画像のプレビューと読み込み失敗の共通表示。
- `lib/current-field-values.ts`: 入力がない場合に現在の公開内容を表示する処理。
- `lib/fetch-with-timeout.ts`: 通信のタイムアウトとキャンセル。

以前のカード一覧型ダッシュボード、非表示のSNS状況カード、未使用の更新ガイドと専用CSSは削除しました。互換性が必要なAPI・CMSデータ形式は維持します。管理画面は未使用の変数・引数があると型チェックを失敗させます。

検証はルートで `npm run check:handoff`、`npm run test:events` を実行します。書き込みを伴う画面操作は `scripts/smoke-event-flow-isolated.mjs` の隔離環境で行い、本番にテストデータを登録しません。

管理画面は保存データの取得に失敗した場合、初期値で編集を続けず読み込みエラーを表示して保存を止めます。公開サイト側の表示用フォールバックとは分けています。`ADMIN_ALLOW_CONTENT_FALLBACK=true` は非本番のデモ用に限り有効で、本番では使えません。通信成功時にデータがまだない項目の標準表示は維持します。

一覧は100件単位で最後まで読み込みます。途中のページで失敗した場合や、同じレコードが繰り返されて一覧を確定できない場合は、途中までの内容を編集データとして扱いません。

## ローカル起動

```bash
npm run dev:admin-app
```

管理画面だけを直接起動する場合:

```bash
cd admin-app
npm install
npm run dev
```

画面が真っ白になったり、開発サーバーが古い状態を掴んだ場合:

```bash
npm run clean:admin-app
npm run dev:admin-app
```

## Vercel環境変数

```text
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
MICROCMS_SERVICE_DOMAIN=
MICROCMS_API_KEY=
GITHUB_DISPATCH_TOKEN=
GITHUB_OWNER=Token08
GITHUB_REPO=bassic
GITHUB_DISPATCH_EVENT_TYPE=microcms_publish
NEXT_PUBLIC_PUBLIC_SITE_URL=https://www.bassic.jp/
```

`MICROCMS_API_KEY` はGET、POST、PATCH、Media Uploadを許可したキーを使います。ブラウザには出さず、Vercel API Routesだけが利用します。

## 管理画面URL

このアプリをVercelへデプロイすると、次のような専用管理画面URLが発行されます。

```text
https://bassic-admin.vercel.app/
```

ローカルからデプロイする場合は、Vercelへログイン済みの状態でリポジトリルートから実行します。

```bash
npm run deploy:admin:prod
```

発行されたURLは、公開サイト側の環境変数 `NEXT_PUBLIC_DEDICATED_ADMIN_URL` に設定します。設定後、公開サイトの `/admin/` 入口から専用管理画面へ移動できます。

## 反映の流れ

1. 管理画面で下書きを保存、または掲載前に確認を押す。
2. Vercel API RoutesがmicroCMSへ保存する。
3. 掲載前に確認の場合だけ、GitHub `repository_dispatch` を実行する。
4. 静的サイトを生成し、ロリポップへ反映する。

公開ボタンは保存後に反映を依頼します。サイトの生成とロリポップの定期更新を待つため、公開サイトに表示されるまで数分かかります。反映を確認するには公開ページを再読み込みしてください。
店舗側にはボタン名として「この端末に保存」と「掲載前に確認」だけを案内します。GitHubや再ビルドなどの裏側の言葉は、通常は保守担当者だけが扱います。

## カレンダー連携（初期値は無効）

イベントの確認・修正は一つの入力枠で行います。未接続時は掲載後に入力済みの予定をGoogle側で開き、店舗カレンダーを選んで保存します。ボタンを開いただけでは保存済みとしません。

自動同期は[接続チェックリスト](../docs/calendar-connection-checklist.md)の店舗アカウント・非公開カレンダーでの実テスト・既存予定の照合が終わってから有効にします。GitHub側の書き込み設定と、管理画面側の読み取り確認設定を分けています。

管理画面の追加設定：

- `GOOGLE_CALENDAR_ID`: 照合済みの店舗カレンダーID。
- `GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON`: 読み取り確認用のサービスアカウントJSON。ブラウザへ渡さない。
- `GOOGLE_CALENDAR_SYNC_ENABLED=true`: 実書き込み検証とGitHub側の設定が完了した後だけ有効化。

サイト掲載・カレンダー・SNS下書きの結果は別に表示します。カレンダーの失敗はサイト掲載を止めません。予定名・開始・終了・説明文（画像URL含む）が実際のGoogle予定と一致してから反映済みとします。再試行は保存済みの公開イベントからカレンダーだけを依頼し、SNS投稿やサイトの再保存はしません。

## 納品時に渡す資料

納品先にはGitHub、Vercel、APIキー、環境変数を渡しません。通常運用では、サイトURL、管理画面URL、ログイン方法、操作資料だけを渡します。

- `docs/Bassic_README_納品用.txt`: 店舗へ渡す現在の操作資料。
- その他の旧詳細資料は保守用の記録として残しています。

制作者・保守担当向けの資料一覧は `docs/admin-docs-index.md` を確認してください。

## Vercel設定

機材PDFのアップロードは認証付きの `/api/pdf` を使います。既存の `GITHUB_DISPATCH_TOKEN`（対象リポジトリのContents書き込み権限）で、検証済みのPDFを `public/assets/pdf/uploads/<SHA256>.pdf` に保管します。同じファイルは再利用し、既存ファイルを上書きしません。アップロード時点ではCMSの掲載リンクを変更せず、確認後の掲載で切り替えます。配信には公開リポジトリのraw URLを使うため、ファイル自体はアップロード直後から公開されます。3MB以内に制限し、Vercel Previewでは書き込みを禁止しています。microCMSの有料ファイルプランは不要です。

VercelのRoot Directoryを `admin-app` に設定してデプロイします。公開サイト側の `next.config.ts` は `output: "export"` のままなので、GitHub Pages運用には影響しません。

`admin-app/vercel.json` にNext.js用の基本設定を入れています。
