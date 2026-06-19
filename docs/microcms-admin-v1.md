# Bassic. microCMS 管理設定 v1

この資料は制作者向けです。納品先には、GitHub、APIキー、Webhook設定を直接触らせない方針にします。

## 目的

Bassic.サイトを、店舗側がブラウザの管理画面から更新できるようにします。

店舗側が触るもの:

- 管理画面URL
- ログイン情報
- イベント、メニュー、画像、価格、SNSお知らせなどの入力画面

店舗側に見せないもの:

- GitHub
- GitHub Actions
- Vercel設定
- microCMS APIキー
- Webhook設定

## 必要なmicroCMS API

次のAPI IDをmicroCMSで作成します。IDは必ずこの表記にします。

| API ID | 形式 | 用途 |
| --- | --- | --- |
| `site-settings` | オブジェクト | 店舗基本情報 |
| `home` | オブジェクト | TOPページ |
| `hero-slides` | リスト | 各ページの背景画像 |
| `events` | リスト | イベント情報 |
| `menu` | リスト | フードメニュー |
| `drink-menu-sheets` | リスト | ドリンクメニュー表画像 |
| `party-plans` | リスト | 貸切・レンタルプラン |
| `equipment-rental` | オブジェクト | 機材レンタル情報 |
| `social-notices` | リスト | SNSお知らせカード |
| `page-copy` | リスト | ページ文言 |
| `page-sections` | リスト | セクション表示制御 |
| `custom-sections` | リスト | 追加セクション |

項目の詳細は `docs/microcms-field-definitions-v1.md` を参照します。

## サイト側の動き

- `lib/microcms.ts` がmicroCMSからデータを取得します。
- microCMSが未設定、または取得に失敗した場合は、ローカルのフォールバックデータで表示します。
- そのため、CMS準備中でも公開サイトは壊れません。

## GitHub Pagesへの反映

GitHub Pagesは静的サイトなので、microCMSで保存しただけでは公開HTMLは更新されません。

運用方法:

1. 店舗側が管理画面で内容を保存する
2. 管理画面がmicroCMSへ保存する
3. 管理画面がGitHub Actionsへ再ビルドを依頼する
4. GitHub Pagesに新しい内容が反映される

## Webhook / repository_dispatch

管理画面、またはmicroCMS WebhookからGitHub Actionsを起動する場合は、以下を使います。

送信先:

```text
https://api.github.com/repos/token08/bassic/dispatches
```

HTTP method:

```text
POST
```

Headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer <GitHub fine-grained token>
X-GitHub-Api-Version: 2022-11-28
```

Body:

```json
{
  "event_type": "microcms_publish"
}
```

トークンは納品先に渡さず、制作者または保守担当者が管理します。

## GitHub Secrets

GitHub Actionsでサイトをビルドするため、Repository secretsに以下を登録します。

```text
MICROCMS_SERVICE_DOMAIN
MICROCMS_API_KEY
```

実際の値が未設定の間は、`npm run check:admin` が失敗します。これは正常です。

## 初期設定の流れ

1. microCMSでサービスを作成する
2. この資料のAPI IDを作成する
3. `docs/microcms-field-definitions-v1.md` に沿って項目を作る
4. GitHub SecretsにmicroCMS情報を登録する
5. 必要なら `npm run seed:cms -- --apply` で初期データを流し込む
6. `npm run smoke:cms` で取得確認する
7. 管理画面アプリをVercelへデプロイする

## 確認コマンド

```bash
npm run typecheck
npm run build
npm run smoke:links
npm run smoke:content
npm run smoke:seo
npm run check:admin-app
```

microCMS情報を設定した後:

```bash
npm run check:admin
npm run smoke:cms
```
