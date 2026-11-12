# 店舗カレンダーの接続・有効化（保守用）

画面・SNSの改修はPR #24で本番化済み。以下は自動保存を有効にするための接続ゲートで、未確認の項目を済んだ扱いにしない。

## 接続前

- 店舗用Googleアカウントでログインし、既知の個人用アカウントを使っていないことを確認する。
- サイトに埋め込まれたカレンダーIDは `bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com`。Google側の店舗カレンダー名・ID・管理権限を照合する。
- 店舗のGoogle CloudプロジェクトでCalendar APIと同期専用サービスアカウントを準備する。Cloudプロジェクト全体の管理権限はサービスアカウントに付けない。新しい鍵やアクセス権の追加は、対象を明示して操作時の確認を受ける。
- 同期用アカウントへのカレンダー権限は「予定の変更」まで。鍵はリポジトリやチャットへ載せない。

## 別の非公開カレンダーで検証

1. 店舗アカウントで `Bassic QA (private)` を作り、一般公開がオフであることを画面で確認する。
2. 同期用サービスアカウントをテスト用カレンダーへ共有する。
3. 作成した鍵ファイルを作業用の保護された場所で読み、`BASSIC_QA_CALENDAR_CREDENTIAL_FILE` と `BASSIC_QA_CALENDAR_ID` を設定する。
4. `node scripts/verify-calendar-test-write.mjs` を実行する。追加・日時変更・再実行で1件を維持し、この実行が作った予定だけ片付ける。本番カレンダーIDはスクリプトで拒否する。
5. 本番の既存予定とCMSの掲載予定を読み取り照合する。手入力済みの同一Facebookイベントがあれば、重複させずに移行方法を確認する。同期コードも、同じFacebook URLまたは同じ見出し・開始日時の既存予定を検知したら書き込み前に停止する。既存予定を勝手に取り込んだり削除したりしない。

## 本番の有効化

上記が成功してから、確認済みの店舗カレンダーへの権限と以下の設定を整える。

- GitHub Secrets: `GOOGLE_SERVICE_ACCOUNT_JSON`、`GOOGLE_CALENDAR_ID`
- GitHub Variables: `ENABLE_CALENDAR_SYNC=true`
- 管理画面の本番環境: `GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON`、同じ `GOOGLE_CALENDAR_ID`、`GOOGLE_CALENDAR_SYNC_ENABLED=true`

管理画面の認証は読み取り専用スコープで使う。書き込みはGitHub Actionsの既存の同期処理で行う。`microcms_publish` でサイト掲載と独立して実行し、定期実行も残す。`bassic_calendar_sync` はカレンダーだけの再試行で、サイトの再保存・SNS配信・過去イベント整理は実行しない。

管理画面はGoogle側の予定名・開始・終了・説明文（画像URL含む）が一致したときだけ「反映済み」と表示する。APIの失敗や不一致では成功扱いにせず、15分で確認を打ち切って再確認・カレンダーだけの再反映を案内する。カレンダーの失敗でもサイト掲載・SNS下書きは続けられる。

本番ではテスト予定を作らない。店舗が掲載する実イベントで、次の通常更新時に一致を確認する。中止・非公開化の予定は自動削除せず、Google側でも対象予定を処理する。

## 停止・復旧

連携に問題があれば `ENABLE_CALENDAR_SYNC=false` と `GOOGLE_CALENDAR_SYNC_ENABLED=false` に戻し、サイト更新とSNS下書きは維持する。停止だけでは既存のGoogle予定は消えない。重複や中止の処理はカレンダー担当者が確認する。
