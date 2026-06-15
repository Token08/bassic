# Bassic. 専用管理画面

`admin-app/` は納品先向けの簡単な管理UIです。公開サイト本体はGitHub Pagesの静的サイトのまま維持し、この管理UIだけVercelでサーバー付きNext.jsとして動かします。

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
```

`MICROCMS_API_KEY` はGET、POST、PATCH、Media Uploadを許可したキーを使います。ブラウザには出さず、Vercel API Routesだけが利用します。

## 反映の流れ

1. 管理画面で下書き保存、または公開して反映を押す。
2. Vercel API RoutesがmicroCMSへ保存する。
3. 公開して反映の場合だけGitHub `repository_dispatch` を実行する。
4. GitHub Pagesのビルドが走り、公開サイトへ反映される。

## Vercel設定

VercelのRoot Directoryを `admin-app` に設定してデプロイします。公開サイト側の `next.config.ts` は `output: "export"` のままなので、GitHub Pages運用には影響しません。

`admin-app/vercel.json` にNext.js用の基本設定を入れています。
