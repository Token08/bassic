# Facebook Event Sync

`npm run fetch:events` writes `public/data/facebook-events.json`.

`npm run sync:calendar` reads `public/data/facebook-events.json` and writes those events into the embedded Google Calendar. Synced Facebook events are not rendered in the Pickup cards.

## Source Priority

1. Meta Graph API with `FACEBOOK_PAGE_ACCESS_TOKEN` and `FACEBOOK_PAGE_ID`.
2. Facebook iCal with `FACEBOOK_EVENTS_ICAL_URL`.
3. Google Calendar iCal with `GOOGLE_CALENDAR_ICAL_URL` or `GOOGLE_CALENDAR_ID`.
4. Optional browser sync with `FACEBOOK_BROWSER_SYNC=true` and `FACEBOOK_BROWSER_COOKIES_JSON`.

GitHub Actions installs Playwright only when `FACEBOOK_BROWSER_SYNC` is enabled.

## Failure Behavior

The script does not fall back to manual event entry. If all live sources fail, it keeps the previous successful JSON data so the site does not lose the schedule.

`sync:calendar` deletes previously synced events by default. Set `GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC=true` only when the target Google Calendar should be emptied before inserting the synced events.

## Environment Variables

- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_EVENTS_LIMIT`
- `FACEBOOK_EVENTS_ICAL_URL`
- `GOOGLE_CALENDAR_ICAL_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FACEBOOK_BROWSER_SYNC`
- `FACEBOOK_BROWSER_COOKIES_JSON`
