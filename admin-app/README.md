# Bassic. 専用管理画面

`admin-app/` は納品先向けの簡単な管理UIです。公開サイト本体はGitHub Pagesの静的サイトとして維持し、この管理UIだけVercelでサーバー付きNext.jsとして動かします。

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

## 反映の流れ

1. 管理画面で下書きを保存、または公開して反映を押す。
2. Vercel API RoutesがmicroCMSへ保存する。
3. 公開して反映の場合だけ、GitHub `repository_dispatch` を実行する。
4. GitHub Pagesのビルドが走り、公開サイトへ反映される。

## FacebookイベントからGoogle Calendarへ反映する時

Facebookイベントは、管理画面へ個別イベントURLを貼る運用にしています。

1. 管理画面のイベントで `FacebookイベントURL・詳細URL` に個別イベントURLを貼る。
2. `Facebookから読み取る` を押し、タイトル、画像、日付、STARTを確認する。
3. 読み取れない項目がある場合は、イベント名、日付、START、画像を管理画面で手入力する。
4. 公開後、保守担当者が `npm run sync:calendar:check` で同期内容を確認する。
5. 確認結果のイベント名、日付、START、Facebook URL、画像URLが依頼内容と合っていれば `npm run sync:calendar` でGoogle Calendarへ反映する。

詳しい保守手順は `docs/facebook-event-sync.md` を確認してください。納品先にはこの同期コマンドを触らせず、必要な時だけ「イベント名」と「Google Calendarにも反映してください」を連絡してもらう運用にします。

## 納品時に渡す資料

納品先にはGitHub、Vercel、APIキー、環境変数を渡しません。通常運用では、サイトURL、管理画面URL、ログイン方法、操作資料だけを渡します。

- `docs/delivery-admin-manual.md`
  - 店舗側が普段見る操作マニュアルです。
- `docs/client-handoff-checklist.md`
  - 引き渡し前に渡すもの、渡さないものを確認するチェックリストです。
- `docs/client-handoff-sheet.md`
  - 公開サイトURL、管理画面URL、パスワード、連絡先を記入するメモです。

制作者・保守担当向けの資料一覧は `docs/admin-docs-index.md` を確認してください。

## Vercel設定

VercelのRoot Directoryを `admin-app` に設定してデプロイします。公開サイト側の `next.config.ts` は `output: "export"` のままなので、GitHub Pages運用には影響しません。

`admin-app/vercel.json` にNext.js用の基本設定を入れています。
