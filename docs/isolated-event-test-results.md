# 掲載イベント未定での運用テスト

確認日: 2026-11-11

実際に掲載するイベントが決まる前でも、架空のイベントを使って運用の流れを検証できる。本番CMS、本番カレンダー、SNSへの書き込みは行っていない。

## 今回確認できたこと

- 隔離した管理画面でログイン、Facebook取り込み、既存イベントの選択、下書き保存、公開処理を実行した。
- 公開処理に使う外部サービスの応答はメモリ内の代替サービスに限定し、隔離した公開ページでタイトル・開始時刻・画像とスマホ表示を確認した。非公開イベントが表示されないことも確認した。
- 同じイベントを再取り込みしてもイベントとX・Instagram用下書きが増えず、スタッフが編集した文面を保持することを確認した。
- 画像を取得できない場合に既存画像を保持し、カレンダーやSNSの処理失敗をサイト公開の結果と分けることを確認した。
- 実際の同期関数をメモリ内のカレンダーで実行し、追加→日時変更→再実行で同じ予定を更新すること、非公開化などで同期対象から外れても既存予定や手動登録の予定を勝手に削除しないことを確認した。
- 日時の日本時間への変換、OPENとSTARTの区別、曖昧な時刻の空欄維持、通信失敗後の再実行など、関連する自動テスト19件が成功した。
- 過去のBassic実イベント `https://www.facebook.com/events/5208864859197487/` を読み取り専用で取得し、タイトル・日付・画像を照合した。このページの開始時刻は取得できず、スタッフ入力が必要と判定された。

## 再実行

```powershell
npm run build:admin-app
node --test scripts/facebook-event-time.test.mjs scripts/ops-failure.test.mjs scripts/calendar-upsert.test.mjs
$env:BASSIC_QA_PLAYWRIGHT=Join-Path $env:TEMP 'bassic-browser-qa/node_modules/playwright-core'
$env:BASSIC_QA_CHROMIUM='C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:BASSIC_QA_PUBLIC_SITE='1'
$env:BASSIC_QA_FACEBOOK_READ='1'
node scripts/smoke-event-flow-isolated.mjs
```

PlaywrightとChromeは別途必要。Facebookの読み取り確認はネットワークと対象ページの取得可否に依存する。

## 接続後に確認すること

実Googleカレンダーの権限、Googleの実API応答、本番サイトへの実イベントの掲載、スタッフ本人による単独操作は今回の隔離テストでは確認していない。

Googleカレンダーは店舗の共有先と権限を確認後、専用の非公開カレンダー `Bassic QA (private)` で `scripts/verify-calendar-test-write.mjs` を実行する。このスクリプトは追加・日時変更・再実行を検証し、作成したテスト予定を削除する。掲載イベントが未定でも実行できる。本番用カレンダーをこのテストの対象にはしない。
