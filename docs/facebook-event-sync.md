# Facebookイベント連携

Facebookイベントは、完全自動取得ではなく「管理画面にFacebookイベントURLを貼る」方式を主運用にします。Meta APIの権限審査に依存しないため、納品先がITに詳しくなくても運用しやすく、取得に失敗しても手入力で公開できます。

## 基本方針

- 納品先は、管理画面にFacebookの個別イベントURLを貼ります。
- 管理画面の `Facebookから読み取る` ボタンで、取れる範囲のタイトル、画像、日付、STARTを読み取ります。
- 日付またはSTARTが取れない場合は、管理画面で日付とSTARTを手入力します。
- 保存しただけではGoogle Calendar本体は更新されません。
- Google Calendarへ反映する時だけ、保守担当者が `npm run sync:calendar:check` と `npm run sync:calendar` を実行します。

## 管理画面での入力手順

1. 専用管理画面を開き、`イベント` を選ぶ。
2. `FacebookイベントURL・詳細URL` に、Facebookの個別イベントページURLを貼る。
3. `Facebookから読み取る` を押す。
4. タイトル、画像、日付、START、ENDを確認する。
5. Facebookから日付またはSTARTが取れない場合は、日付とSTARTを手入力する。
6. `公開する` をオンにして保存する。
7. Google Calendarへも載せたい場合は、`Google Calendar反映依頼メモ` の `コピーする` を押し、その内容を保守担当者へ送る。

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

## Google Calendar同期手順

本番のGoogle Calendarへ書き込む前に、必ず確認用コマンドを実行します。

```bash
npm run sync:calendar:check
```

このコマンドは、Google Calendarへ入る予定のタイトル、日付、START、Facebook URL、画像URLを表示します。警告が残っている場合は失敗します。管理画面のイベント内容を直してから、もう一度実行してください。

納品先から依頼を受けた時は、依頼されたイベント名が確認結果の `summary` と一致しているか、日付、START、Facebook URL、画像URLが管理画面の内容と合っているかを見ます。

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
