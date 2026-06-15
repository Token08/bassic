# Bassic. 管理画面・納品資料一覧

このフォルダは、Bassic.サイトを「納品先が管理画面から更新できる状態」にするための資料置き場です。

## 最初に読む資料

- `docs/microcms-current-status.md`
  - 現在どこまでCMS対応できているかを確認する資料です。
- `docs/client-handoff-checklist.md`
  - 納品先へ何を渡すか、何を渡さないかを確認するチェックリストです。

## microCMSを作る時に使う資料

- `docs/microcms-field-definitions-v1.md`
  - microCMSで作成するAPI ID、項目名、入力形式の定義です。
- `docs/cms-sample-content-v1.json`
  - 初期データのサンプルです。
- `docs/microcms-admin-v1.md`
  - microCMS、GitHub Actions、Webhookの制作者向け設定資料です。

## 管理画面アプリ

- `docs/dedicated-admin-app-v1.md`
  - `admin-app/` をVercelへ出す場合の構成と設定資料です。

## 納品先へ渡す操作資料

- `docs/delivery-admin-manual-v1.md`
  - 店舗側が管理画面で更新するための簡易マニュアルです。

## 確認コマンド

```bash
npm run typecheck
npm run build
npm run smoke:links
npm run smoke:seo
npm run check:admin-app
```

実際のmicroCMS接続情報を設定した後だけ実行するもの:

```bash
npm run setup:admin
npm run check:admin
npm run smoke:cms
```
