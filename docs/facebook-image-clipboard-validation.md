# Facebook画像取得・コピー検証

2026-11-14。作業ブランチ `codex/facebook-image-clipboard-lab`。本番の管理画面・CMS・Googleカレンダー・SNS投稿処理には未統合。

## 確認結果（通常HTTPと、追加した独立ブラウザ方式を区別）

| 店舗主催の公開イベント | 通常のNode HTTP取得 | 独立ブラウザ（PC・クラウドとも成功） |
| --- | --- | --- |
| [RUNT / SOCIETY PAGE / Little☆Star](https://www.facebook.com/events/1821212975591464/) | 画像本体を解決できず | JPEG 960 × 536、84,590 bytes |
| [東京ローカル・ホンク九州ツアー 〜 福岡編 〜](https://www.facebook.com/events/29205926255674734/) | 画像本体を解決できず | JPEG 960 × 536、88,286 bytes |
| [NO RULES.](https://www.facebook.com/events/2385993572172152/) | 画像本体を解決できず | JPEG 680 × 960、46,455 bytes |

3件とも店舗のFacebookイベント一覧で確認。告知画像を目視し、イベント名・日付を照合した。ブラウザはFacebook未ログイン。ダウンロードした画像はPC内の検証資料だけに使用し、リポジトリに追加しない。

通常の取得は本番の既存読み取りと同じUser-AgentによるNode fetch。Vercel本番で追加の画像取得コードを動かした結果ではない。`og:image` は `lookaside.fbsbx.com/lookaside/crawler/media/` を指し、JPEGではなくHTMLの写真ページ誘導を返す。誘導先もHTMLで、画像メタデータがない。画像向けAcceptヘッダーでも今回の1件はHTMLだった。通常の取得が失敗することと、Facebook全体から取得不可能であることを混同しない。

写真IDは順に `1741440347988387`、`1679206417545114`、`1713307654134990`。ブラウザで表示された対応写真リンク内の画像のみ取得し、ページ内の別イベント・店舗ロゴ・任意のCDN画像を拾わない。

`scripts/facebook-image-browser-probe.mjs` にサーバー側の実験処理を追加した。通常HTTPの結果から写真IDを得て、ログイン情報のない独立Chromiumで公開イベントを描画。イベント名と写真IDを照合し、対応する写真リンク内の画像だけを取得する。複数の候補が矛盾するときは失敗にする。ユーザーのブラウザプロファイルやCookieにはアクセスせず、ログイン・認証回避・投稿はしない。

Windows上の独立プロセスで3件成功し、ダウンロード済みの目視確認画像とSHA-256が3件とも一致。さらに[GitHub上の隔離実行](https://github.com/Token08/bassic/actions/runs/43561761697)でも3件成功した。Playwright 1.58.2と互換性のあるUbuntu 24.04に固定。GitHubのlatest OS移行に伴う実行環境の差を避ける。画像は一時ディレクトリだけに置き、クラウドの成果物にはサニタイズ済み診断JSONのみを3日間保持する。

これはローカルとGitHubランナーの成功であり、現在のVercelアプリにブラウザを組み込んだ結果ではない。無料APIで画像を取得したという意味でもない。新たな有料API・ブラウザサービスの契約はしていない。

## コピー検証

別環境のループバック専用画面で画像をデコードし、canvasでPNGにしてClipboardItemへ書き込む。コピー直後にブラウザのClipboard APIで読み戻し、実データをデコードして確認した。

| 画像 | 読み戻したPNG |
| --- | --- |
| RUNT | 960 × 536、726,356 bytes |
| 東京ローカル・ホンク | 960 × 536、724,542 bytes |
| NO RULES. | 680 × 960、254,678 bytes |

投稿文をコピーすると、PNGがクリップボードからなくなることも確認。画像貼り付け前に文面をコピーする導線にはしない。

これは前回のCodex内ブラウザでの実データ書き込み・読み戻し検証。再実行時の読取許可待ちには5秒のタイムアウトを設け、待ち続ける表示にはしない。Windowsの通常ブラウザでCtrl+Vして画像を受け取る検証、Mac実機、X・Instagramの投稿画面での受け取りは別の検証事項。Windows実機の再試行では対象ウィンドウを操作前面にできず、Ctrl+V確認に至っていない。仮想クリップボードの制約やログイン画面到達を、SNS貼り付け成功として扱わない。

Instagramの検証アカウント作成を試したが、登録画面に「アカウントを作成できませんでした」と「入力『携帯電話番号またはメールアドレス』は無効です」が表示され、完了できなかった。捨てアドの拒否と、入力消失・登録制限は判別できていないため原因を断定しない。登録の反復や架空の生年月日入力は行わない。Xも検証アカウント未作成。投稿・シェアは確定していない。

## 再実行

```powershell
npm.cmd run test:facebook-images
node scripts/facebook-image-probe.mjs "$env:TEMP/bassic-facebook-image-lab/server" https://www.facebook.com/events/1821212975591464/ https://www.facebook.com/events/29205926255674734/ https://www.facebook.com/events/2385993572172152/
npm.cmd run lab:images -- "$env:TEMP/bassic-facebook-image-lab/manifest.json"
# 独立ブラウザの公開ページ読み取り（実験用。Playwrightと対応Chromiumが別途必要）
node scripts/facebook-image-browser-probe.mjs --execute-public-probe "$env:TEMP/bassic-facebook-image-lab/backend-browser" https://www.facebook.com/events/1821212975591464/ https://www.facebook.com/events/29205926255674734/ https://www.facebook.com/events/2385993572172152/
```

manifestはローカルJSON配列。各項目に `title`、取得済みJPEG/PNGの絶対パス `file`、任意の `text` を記す。画像の最大サイズは10MB、3件まで。manifest・画像・パスワード・メール受信箱のアクセス情報はリポジトリへ入れない。開くURLは `http://127.0.0.1:3133/`。公開サーバーにデプロイしない。

プローブはHTTPSのFacebook・対応画像CDNだけを許可し、リダイレクト先も検査する。MIMEとファイルヘッダーを確認し、HTMLを取得成功にしない。プローブの成功は転送形式の確認であり、画像デコードと対象イベントとの照合は別途必要。

追加の環境変数は `BASSIC_QA_PLAYWRIGHT`（検証用Playwrightパッケージの絶対ディレクトリ）、`BASSIC_QA_CHROMIUM`（検証用Chromiumの実行ファイルパス）。未指定なら通常のパッケージ解決・ブラウザキャッシュを使う。既存のブラウザプロファイルを指定しない。

クラウドの再検証は `gh workflow run event-regression.yml --ref codex/facebook-image-clipboard-lab -f public_image_probe=true`。手動でのみ実行し、対象は上記3件に固定。CMS・カレンダー・SNSの認証情報を渡さない。通常のPR検証ではネットワーク不要の画像テスト10項目を実行する。

## 次に必要なこと

画像取得方式の実現性は3件で確認できたが、本番統合のゲートは閉じたままにする。現在のVercelアプリにブラウザ実行環境はないため、管理画面への接続と実行時間・失敗時の表示は未実装。検証用GitHubワークフローを本番用の依頼受付・画像保管として流用しない。サーバーで取得した画像を使う検証画面は、レポートの各 `fileName` をmanifestの `file` に対応付けて開ける。

SNSはログイン済みの検証アカウントを用意できた時点で、作成画面への画像受け渡しのみ再開する。画像の長期保存・自動削除は、その方式が成立するまで作り込まない。
