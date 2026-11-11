# Facebookイベント連携

Facebookイベントは、完全自動取得ではなく「管理画面にFacebookイベントURLを貼る」方式を主運用にします。Meta APIの権限審査に依存しないため、納品先がITに詳しくなくても運用しやすく、取得に失敗しても手入力で公開できます。

## 基本方針

- 納品先は、管理画面にFacebookの個別イベントURLを貼ります。
- 管理画面の `Facebookから読み取る` ボタンで、取れる範囲のタイトル、画像、日付、STARTを読み取ります。
- 取得できなかった項目が表示されます。日付とSTARTを確認し、不足分を手入力してください。OPENだけが記載されている場合はSTARTを手入力します。
- 同じFacebookイベントが登録済みの場合は「登録済みのイベントを編集」を押します。現在の登録内容と読み取り結果を見比べてから公開します。
- 保存しただけではGoogle Calendar本体は更新されません。
- 定期同期を有効にするまでは、保守担当者へ反映依頼メモを送り、担当者がカレンダーを更新します。
- 中止・非公開にした予定はカレンダーから自動で削除しません。担当者が対象予定を確認して処理します。

定期同期を有効にすると、公開済みの開催予定を管理画面の情報からGoogle Calendarへ反映します。最初はテストカレンダーを使い、追加、日時変更、同じ内容での再実行を確認します。本番のカレンダーIDと書き込み権限を確認した後に `ENABLE_CALENDAR_SYNC` を有効にします。Vercelに対象の `GOOGLE_CALENDAR_ID` と、対象カレンダーに閲覧権限を持つ `GOOGLE_CALENDAR_READ_SERVICE_ACCOUNT_JSON` を設定すると、管理画面の「カレンダーの掲載を確認」からイベント名・日付・開始時刻を照合できます。設定前は反映依頼メモを使います。

手動で書き込む場合も `GOOGLE_CALENDAR_ID` を明示します。テスト時は店舗サイトに埋め込まれた公開カレンダーとは別に、非公開カレンダーを用意し、そのIDを指定してください。

## 非公開カレンダーでの書き込み確認

作成・接続の前に、ログイン中のGoogleアカウントが店舗用または店舗が承認した検証用アカウントであることを確認します。接続済みという理由だけで個人用アカウントを使いません。店舗側の接続が未確認の間は、ローカルの隔離テストで作業を進めます。

1. Google Calendarで `Bassic QA (private)` という別カレンダーを作り、一般公開をオフにします。テスト用サービスアカウントに「予定の変更」権限を付けます。
2. `BASSIC_QA_CALENDAR_ID` にそのカレンダーIDを、`BASSIC_QA_CALENDAR_CREDENTIAL_FILE` にリポジトリの外に保管したテスト用鍵ファイルのパスを設定します。
3. `node scripts/verify-calendar-test-write.mjs` を実行します。実行前に接続先の名前を照合し、実行時は予定の追加、日時変更、同じ内容の再実行を確認します。最後に、その実行で作成したテスト予定だけを削除します。
4. 確認後、店舗カレンダーの書き込み権限を別途確認します。本番の定期同期を有効にする前に、同期対象の公開済みイベントを確認します。

FacebookイベントとSNS下書きの新規登録には、管理画面で既に使っているPOST権限を使います。保存前に同じイベントやSNS下書きがないか確認します。担当者一人での運用を前提としており、別々の操作で同じ項目を同時に新規保存した場合は重複する可能性があります。既存イベントの編集にはPATCH権限を使います。

## 管理画面での入力手順

1. 専用管理画面の左から `イベントスケジュール` を選び、中央の開催イベント欄を押す。右側の `Facebookイベント取り込み` から `選ぶ` を押す。
2. `FacebookイベントURL・詳細URL` に、Facebookの個別イベントページURLを貼る。
3. `Facebookから読み取る` を押す。
4. タイトル、画像、日付、START、ENDを確認する。
5. Facebookから日付またはSTARTが取れない場合は、日付とSTARTを手入力する。
6. `公開する` をオンにして保存する。
7. Google Calendarへも載せたい場合は、`公開する` がオンになっていることを確認し、`Google Calendar反映依頼メモ` の `コピーする` を押して保守担当者へ送る。

イベント名、日付、STARTが空欄の場合、依頼メモの `コピーする` は押せません。Google Calendar同期に必要な最低限の情報として、この3項目は必ず入力します。
依頼メモには `公開状態` も入ります。保守担当者は `公開状態: 公開するON` のイベントだけをGoogle Calendar反映対象として扱います。

Facebookのイベント一覧ページではなく、必ず個別イベントページのURLを使います。

```text
OK: https://www.facebook.com/events/1234567890/
NG: https://www.facebook.com/bar.Bassic/events
```

## 読み取りに失敗した時

Facebook側の表示制限やログイン状態によって、タイトル、画像、日付、STARTを自動で読めないことがあります。その場合も登録自体は止めません。

1. `FacebookイベントURL・詳細URL` はそのまま残す。
2. イベント名、日付、STARTを手入力する。
3. 画像が取れない場合は、管理画面で画像をアップロードするか、画像URLを手入力する。
4. `公開する` をオンにする前に、日付とSTARTが空欄ではないことを確認する。
5. Google Calendarへも載せたい場合は、通常通り `Google Calendar反映依頼メモ` の内容を受け取ってから同期する。

読み取り結果が不完全でも、管理画面で確認・修正した内容を正として扱います。
読み取り中に別のイベントURLへ変更した場合、前のURLの結果は入力欄に反映しません。画像の表示に失敗した場合は画面に案内が出るので、画像URLを確認するかアップロードし直します。反映依頼メモには入力欄の現在の内容を使います。入力欄で消した情報を読み取り候補から補い直すことはしません。

## 公開後の結果とやり直し

- サイトは「公開サイトに反映されました」と表示されてから公開ページを確認します。受付だけでは反映完了と扱いません。
- カレンダーは「カレンダーの掲載を確認」で確認します。未接続、未掲載、通信失敗、内容の差分・重複を掲載済みと扱いません。
- SNSはX・Instagram用の下書き作成結果を表示します。下書き作成はSNSへの投稿完了ではありません。
- SNS下書きの結果を確認できない場合は「SNS下書きだけをやり直す」を押します。サイトを再公開せず、保存済みの最新イベントから不足する投稿先の下書きだけ作成します。既存の文面や画像は上書きしません。すでに非公開になったイベントは対象外です。
- カレンダーやSNSの問題があってもサイトの公開処理は独立して進みます。サイトだけ反映失敗の場合は「反映だけをやり直す」を使います。失敗が続く場合は同じイベントを新規登録し直さず、店舗共通の連絡窓口から保守担当へ連絡します。

## Google Calendar同期手順

同期は追加・更新方式です。カレンダーの既存予定を削除してから作り直す処理は行いません。同じイベントは同じIDで更新し、通信失敗後の再実行でも重複登録を防ぎます。内容が同じ予定は書き込みを省略します。
Google Calendarから読み取った予定は、そのカレンダーへ書き戻しません。CMS取得や同期済み予定一覧の取得に失敗した場合は停止します。
`GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC=true` はエラーになります。通常は `false` のまま使います。
CMSから消えた予定・非公開にした予定は、この同期で自動削除しません。中止・取り下げはGoogle Calendar側で対象予定を確認して処理する運用です。同期済み予定が重複している場合も、自動削除せず担当者の確認が必要です。

本番のGoogle Calendarへ書き込む前に、必ず確認用コマンドを実行します。

```bash
npm run sync:calendar:check
```

このコマンドは、Google Calendarへ入る予定のタイトル、日付、START、Facebook URL、画像URLを表示します。警告が残っている場合は失敗します。管理画面のイベント内容を直してから、もう一度実行してください。

納品先から依頼を受けた時は、依頼メモの `公開状態` が `公開するON` か、依頼されたイベント名が確認結果の `summary` と一致しているか、日付、START、Facebook URL、画像URLが管理画面の内容と合っているかを見ます。

確認結果に問題がなければ、本番同期を実行します。

```bash
npm run sync:calendar
```

本番同期も警告が残っている場合は停止します。どうしても警告を許容する場合だけ、保守担当者が内容を確認したうえで `GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS=true` を使います。

## Google Calendarへ入る内容

- `summary`: イベントタイトル
- `start/end`: 日付、START、END
- `description`: FacebookイベントURL、画像URL、予約方法、補足
- `source.url`: FacebookイベントURL
- `extendedProperties.private.sourceId`: FacebookイベントID。重複同期を防ぐために使います。

ENDがSTART以前の時刻の場合は、深夜またぎとして翌日の終了時刻にします。例: START `23:00` / END `02:00` は、翌日2:00終了としてGoogle Calendarへ入ります。

画像はGoogle Calendarの説明欄にURLとして入ります。Google Calendarの月表示で、画像カードとして大きく表示されることは保証しません。

サイト内画像URLが `/images/...` のような相対パスの場合、同期時に公開URLへ変換します。本番同期前は `NEXT_PUBLIC_SITE_URL` または `NEXT_PUBLIC_PUBLIC_SITE_URL` を本番URLに合わせてください。

## 既存の自動取得ルート

保守担当者向けに、既存の自動取得ルートは残しています。ただし主運用にはしません。

1. Meta Graph API: `FACEBOOK_PAGE_ACCESS_TOKEN` と `FACEBOOK_PAGE_ID`
2. Facebook iCal: `FACEBOOK_EVENTS_ICAL_URL`
3. Google Calendar iCal: `GOOGLE_CALENDAR_ICAL_URL` または `GOOGLE_CALENDAR_ID`
4. ブラウザ取得: `FACEBOOK_BROWSER_SYNC=true` と `FACEBOOK_BROWSER_COOKIES_JSON`

`npm run fetch:events` は `public/data/facebook-events.json` を作ります。`npm run sync:calendar` は管理画面に登録されたFacebookイベントを優先し、その後に `public/data/facebook-events.json` を読みます。同じFacebookイベントURLや `sourceId` は重複しないようにまとめます。

管理画面と自動取得ファイルの両方に同じFacebookイベントURLがある場合は、管理画面で確認・修正した内容を優先します。納品後の運用では、管理画面の内容を正と考えてください。

外部取得に失敗した場合は、前回成功したJSONを残して、サイトの予定が空にならないようにします。

## 環境変数

- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_EVENTS_LIMIT`
- `FACEBOOK_EVENTS_ICAL_URL`
- `GOOGLE_CALENDAR_ICAL_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC`
- `GOOGLE_CALENDAR_SYNC_DRY_RUN`
- `GOOGLE_CALENDAR_SYNC_FAIL_ON_WARNINGS`
- `GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FACEBOOK_BROWSER_SYNC`
- `FACEBOOK_BROWSER_COOKIES_JSON`
