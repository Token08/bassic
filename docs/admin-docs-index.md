# Bassic. 管理画面・納品資料一覧

このフォルダは、Bassic.サイトを「納品先が管理画面から更新できる状態」にするための資料置き場です。

## まず見る資料

- `docs/microcms-current-status.md`
  - 現在どこまでCMS対応できているかを確認する資料です。
- `docs/client-handoff-checklist.md`
  - 納品先へ何を渡すか、何を渡さないかを確認するチェックリストです。

## 納品先へ渡す資料

納品先に渡す資料は、基本的にこの3つだけにします。専門的な設定名や制作者向けの画面名は出さない方針です。

- `docs/delivery-admin-manual.md`
  - 納品先へ渡す最新版の簡易操作マニュアルです。
- `docs/client-handoff-checklist.md`
  - 引き渡し前に、渡すものと渡さないものを確認するチェックリストです。
- `docs/client-handoff-sheet.md`
  - 公開サイトURL、管理画面URL、パスワード、連絡先だけをまとめる記入用メモです。

## 制作者・保守担当だけが見る資料

以下はサイト公開や管理画面接続のための資料です。納品先には通常渡しません。

### 管理画面の項目設計

- `docs/microcms-field-definitions-v1.md`
  - 管理画面で作成する項目名、入力形式、必須項目の定義です。
- `docs/cms-sample-content-v1.json`
  - 初期データのサンプルです。

### 保存先と公開反映の設定

- `docs/microcms-admin-v1.md`
  - 保存先、公開反映、再ビルドの制作者向け設定資料です。

### 専用管理画面アプリ

- `docs/dedicated-admin-app-v1.md`
  - `admin-app/` を公開する場合の構成と設定資料です。

## 旧版・控え

- `docs/delivery-admin-manual-v1.md`
  - 旧版の控えです。納品時は `docs/delivery-admin-manual.md` を渡します。

## 確認コマンド

```bash
npm run typecheck
npm run build
npm run smoke:links
npm run smoke:seo
npm run check:admin-app
```

実際の保存先接続情報を設定した後だけ実行するもの:

```bash
npm run setup:admin
npm run check:admin
npm run smoke:cms
```

## 外部ストア調整資料

- `docs/base-store-design-kit.md`
  - BASEオンラインストアをBassic.本体サイトの色味へ寄せるためのCSSと反映手順です。
- `docs/base-store-current-theme-css.css`
  - BASE管理画面へ貼り付けるCSSを単体で抜き出したものです。
