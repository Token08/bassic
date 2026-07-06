# Bassic. 納品前ステータス

作成日: 2026-07-06

## 現在使えるURL

| 項目 | URL |
| --- | --- |
| 公開サイト（確認用） | https://token08.github.io/bassic/ |
| 管理画面入口 | https://token08.github.io/bassic/admin/ |
| 専用管理画面 | https://bassic-admin.vercel.app/ |

店舗側に渡すURLは「管理画面入口」です。
専用管理画面は実際に編集する本体ですが、入口からログインすると自動で移動します。
納品時に2つの管理URLを並べて渡すと混乱しやすいため、店舗側には入口URLだけを案内します。

本番ドメインへ切り替える場合は、公開サイトURLと管理画面入口URLを本番URLに合わせて更新します。
管理画面パスワードはリポジトリに記載せず、店舗側へ別送します。

## 納品先に渡す資料

- `docs/delivery-admin-manual.md`
- `docs/client-handoff-checklist.md`
- `docs/client-handoff-sheet.md`

納品先には、GitHub、Vercel、microCMS、APIキー、環境変数の説明は通常渡しません。
店舗側が見るのは、公開サイト、管理画面入口、ログイン方法、操作マニュアル、困った時の連絡先だけです。

## 管理画面の状態

- 管理画面TOPは、公開サイトと同じ TOP / EVENT SCHEDULE / MENU / ONLINE STORE / PARTY & RENTAL / ACCESS のページ構造です。
- 各ページカードには、そのページで変更できる項目だけを表示します。
- 画像、メニュー、イベント、SNSお知らせは、追加・削除・並び替え・公開ON/OFFを管理できます。
- 保存導線は「下書き保存」「プレビュー確認」「プレビューして公開」に整理済みです。
- FacebookイベントURLからイベント情報を読み取り、X / Instagram向けSNS下書きを作成できます。
- SNS下書きは `deliveryStatus = draft` から始まり、承認するまでAPI投稿対象になりません。
- 管理画面で入力・画像追加・削除を行うと、保存先への記録は自動で行われます。店舗側が保存先サービスを直接開く必要はありません。

## 2026-07-06 確認済みチェック

以下はこの作業時点で通過済みです。

```bash
npm run typecheck
npm run typecheck:admin-app
npm run check:admin-app
npm run check:admin
npm run build
npm run build:admin-app
npm run smoke:links
npm run smoke:content
npm run smoke:seo
npm run smoke:admin-app
npm run smoke:handoff-rehearsal
npm run check:handoff
```

`npm run smoke:cms` と `npm run publish:social` は、ローカルにmicroCMS本番キーが無い場合は安全にスキップされます。
Vercel本番環境とGitHub Secretsには接続情報を設定済みです。

`npm run smoke:handoff-rehearsal` は、TOP保存、EVENT下書き、MENU下書き、画像追加・並び替え・削除、X / Instagram下書き作成、SNS下書き重複防止をまとめて確認します。
作成した確認用データは最後に削除します。
公開再ビルドまで確認する場合は、`RUN_PUBLIC_DEPLOY_REHEARSAL=true` を付けて実行します。

2026-07-06時点で、`RUN_PUBLIC_DEPLOY_REHEARSAL=true` 付きの実運用リハーサルは通過済みです。
GitHub Pagesの `repository_dispatch` デプロイも成功しています。

## 納品前に最後に見ること

- 店舗側端末で管理画面入口からログインできる
- TOP / EVENT / MENU / PARTY / ACCESS のうち、1〜2箇所を実際に変更して戻せる
- 「下書き保存」では公開サイトが変わらない
- 「プレビューして公開」後、1〜3分ほど待つと公開サイトに反映される
- FacebookイベントURLを貼った時、日付、START、画像、URLを確認できる
- SNS下書きがX / Instagramに重複作成されない
- スマホでTOP、MENU、EVENT、ACCESSを確認できる

## 実運用リハーサル

制作側は納品前に次を実行します。

```powershell
$env:ADMIN_PASSWORD="別送の管理画面パスワード"
npm run smoke:handoff-rehearsal
Remove-Item Env:\ADMIN_PASSWORD
```

公開再ビルドの起動まで含める場合:

```powershell
$env:ADMIN_PASSWORD="別送の管理画面パスワード"
$env:RUN_PUBLIC_DEPLOY_REHEARSAL="true"
npm run smoke:handoff-rehearsal
Remove-Item Env:\ADMIN_PASSWORD
Remove-Item Env:\RUN_PUBLIC_DEPLOY_REHEARSAL
```

この確認は店舗側に実施してもらうものではありません。
制作側が、管理画面保存、下書き作成、削除、公開反映依頼が壊れていないことを事前に見るためのものです。

リハーサルでは画像アップロードも行います。
作成した確認用コンテンツは削除されますが、アップロード済み画像ファイルは保存先のメディア一覧に残る場合があります。

## 残タスク

- 本番ドメインを使う場合は、公開サイトURLと管理画面入口URLを本番ドメインへ切り替える。
- microCMSのメール認証が未完了の場合は、アカウント制限を避けるため完了する。
- 以前チャットに貼ったVercelトークンは、作業完了後にVercel側で失効または再発行する。
