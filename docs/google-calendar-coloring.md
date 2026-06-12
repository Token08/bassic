# Google Calendar 色分け運用

イベントスケジュールページは、元ページと同じGoogle Calendarを1つだけ埋め込む。
サイト側CSSからGoogle Calendar iframe内部の日付色は変更できないため、色分けはGoogle Calendar側のイベント色で管理する。

## 方針

- イベント日: 赤
- 店休日: グレー
- カレンダーは分けない
- Google Calendar埋め込みは1つのまま

## Apps Scriptで同一カレンダー内のイベント色を揃える

1. Google Calendarを管理しているGoogleアカウントで、Google Apps Scriptを開く。
2. 下記の `CALENDAR_ID` をBassic.のカレンダーIDにする。
3. スクリプトを実行する。
4. 必要なら時間主導トリガーで毎日1回実行する。

```js
const CALENDAR_ID = "bpi41sabm94gp0sni0ps7vajkc@group.calendar.google.com";
const MONTHS_AHEAD = 12;

function colorBassicCalendarEvents() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    throw new Error(`Calendar not found: ${CALENDAR_ID}`);
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + MONTHS_AHEAD);

  const events = calendar.getEvents(start, end);
  events.forEach((event) => {
    const title = event.getTitle();
    const isClosed = /店休日|休業|休み|closed/i.test(title);
    event.setColor(isClosed ? CalendarApp.EventColor.GRAY : CalendarApp.EventColor.RED);
  });
}
```

## 注意

- Google Calendarの埋め込み表示がイベント色を反映するかは、Google Calendar側の仕様に依存する。
- 反映に時間がかかる場合は、公開ページ側のキャッシュ更新やブラウザ再読み込みを確認する。
- サイト側で確実に自由な色分けをしたい場合は、Google Calendar iframeではなく、iCalデータから独自カレンダーUIを作る必要がある。
