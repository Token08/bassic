# Bassic. 納品前ステータス

## 2026-11-06 公開移行の再点検

判定: **GitHub Pagesで新サイトの先行公開が完了。独自ドメイン切替と管理更新の実運用検証は未完了。** 下記の7月時点の実績は過去の記録であり、現在の稼働保証ではありません。

### 先行公開の実績

- 新サイト: https://token08.github.io/bassic/index.html （HTTPS、確認用のnoindex）。ルートURLには旧ドメインへの転送キャッシュが残るため、当面はindex.htmlを案内する。
- 確認用管理画面入口: https://token08.github.io/bassic/admin/
- Pagesの独自ドメイン紐付けを一時解除し、HTTPS強制が有効であることを確認。旧サイトのDNS・メール設定は変更していない。
- 実CMS接続・ビルド・公開が成功: https://github.com/Token08/bassic/actions/runs/42177123845
- 実CMSの検証件数はhero-slides 0、events 0、menu 1、homeはcompact item。多くの表示はローカル初期データを使っているため、実運用データが揃った証拠とは扱わない。
- 公開したTOP／MENUのPC表示と、390px幅でTOP／MENU／EVENT／ACCESS／PARTYの導線・表示を確認。ドリンク表切替と拡大を確認。ACCESS／PARTYに横はみ出しなし。
- Google Calendar埋め込みは実際に読み込めており、2026年11月の23件の予定表示を確認。これは書き込み同期の検証とは別。
- 公開確認で見つけたカレンダー案内カードの文字色、来店者向けSNS文言、架空イベントのフォールバック／初期投入データを修正。

### 移行開始時に確認した外部状態

- 本番 `https://www.bassic.jp/` は旧サイトを返す。新サイトの `/admin/` と `/menu/` は404。
- `www.bassic.jp` のAレコードは `157.7.107.41`。NSは `uns01.lolipop.jp` / `uns02.lolipop.jp`。メールのMXは `mx01.lolipop.jp`。Web移行時にメール関連設定を変えない。
- GitHub Pagesには `www.bassic.jp` の独自ドメインが登録済みだが、HTTPS強制は無効。
- 専用管理画面は起動済み。GitHubのCMS用Secretは登録済み。
- 最新の公開実行（2026-09-17）はビルド成功、Pagesデプロイ時のIDトークン取得タイムアウトで失敗。その後のワークフローは `disabled_inactivity`。
- ローカルのCMS接続情報はダミー。ローカルCMS smokeのスキップは本番接続の成功証明ではない。

### PHPの調査結果

新サイトのリポジトリにPHPコード・Composer設定はなく、静的出力＋Node.js管理画面で構成される。
対象のPHP脆弱性はCVE-2026-109618 / CVE-2026-109619。ロリポップは全PHPバージョンへの修正適用とsession.upload_progress無効化を2026-10-22に公表している。ただし、この契約のPHPバージョン・設定・残存アプリは管理画面へのログイン後に確認する。事業者の告知のみで個別環境の確認済みとは扱わない。

- PHP公式: https://www.php.net/archive/2026.php#2026-10-21-5
- ロリポップ公式: https://lolipop.jp/info/news/8239/

### 今回の修正・検証

- 公開サイトと管理画面をNext.js 15.5.29へ更新し、PostCSSと推移的依存関係も修正。両方の `npm audit --omit=dev` が0件。
- `npm run check:handoff` が通過（両アプリの型チェック・ビルド、管理画面構成、内部リンク・本文・26ページのSEO）。
- 管理画面healthの設定詳細を認証必須にし、本番CookieをSecureに固定。ローカル本番サーバーで未認証401・認証後200・Secure/HttpOnly/SameSite=Laxを検証。
- 外部への書き込みを `External operations` ワークフローに分離。検証完了した連携だけ個別に有効化する。
- CMSイベント取得失敗時はカレンダー同期を停止。SNS配信失敗を終了コードにも反映。外部に書き込まない障害テスト4件が通過。
- 公開データからサンプルFacebookイベントを除去。旧 `calendar.html` / `menu.html` / `party.html` / `access.html` / `bassic.html` の入口を新ページへ転送する。
- 旧サイトの公開HTML・直接参照素材とPages/DNS設定を、ローカルの `.codex-remote-attachments/launch-backup-2026-11-06/` に退避。これは公開情報のスナップショットであり、旧サーバー全体のバックアップではない。

### 未完了のゲート

2026-11-06の方針: 現行ホスティング／ドメインのログイン復旧を待つ間、旧サイトのDNSとメールを維持し、GitHub Pagesの `https://token08.github.io/bassic/` で先行公開する。確認用公開はnoindexとし、独自ドメイン切り替え時に解除する。Vercelは既存の専用管理画面を動かす基盤であり、公開サイトの先行公開に追加契約は不要。

1. ロリポップとDNS管理へのログイン接続を確保し、PHP設定確認・完全バックアップ・Web向けDNS切替・HTTPS確認を行う。
2. Vercelへのログイン接続を確保し、修正済み管理画面を配備する。実CMSでの保存・画像・下書き・公開反映リハーサルを再実施する。
3. SNS／Google Calendarの認証はGitHub Secretsに未登録。対象アカウントを確認して接続し、個別検証後に有効化する。
4. 本番でPC・スマホの見た目と主要導線、旧URL、店舗情報を確認する。Search ConsoleとGoogleビジネスプロフィールを確認する。
5. 引き渡しメモの本番URL・保守連絡先を確定し、店舗側端末で操作を確認する。翌日の公開確認と失敗通知の受信を確認する。

## 以下は2026-07-06時点の記録

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
