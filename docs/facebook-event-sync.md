# Facebook Event Sync

`npm run fetch:events` writes `public/data/facebook-events.json`.

`npm run sync:calendar` reads Facebook events registered in the admin CMS first, then reads `public/data/facebook-events.json`, deduplicates by Facebook event URL/source id, and writes the events into the embedded Google Calendar. Synced Facebook events are not rendered in the Pickup cards.

For client operation, the preferred workflow is semi-automatic: paste a Facebook event URL into the admin event form, press the Facebook import button, confirm title/date/image, then publish.

Before writing to Google Calendar, run `npm run sync:calendar:dry` to preview the event title, start/end time, Facebook URL, and image URL that would be synced. If the output looks correct, run `npm run sync:calendar`.

## Source Priority

1. Meta Graph API with `FACEBOOK_PAGE_ACCESS_TOKEN` and `FACEBOOK_PAGE_ID`.
2. Facebook iCal with `FACEBOOK_EVENTS_ICAL_URL`.
3. Google Calendar iCal with `GOOGLE_CALENDAR_ICAL_URL` or `GOOGLE_CALENDAR_ID`.
4. Optional browser sync with `FACEBOOK_BROWSER_SYNC=true` and `FACEBOOK_BROWSER_COOKIES_JSON`.

GitHub Actions installs Playwright only when `FACEBOOK_BROWSER_SYNC` is enabled.

## Failure Behavior

The script prefers manually confirmed admin events. If live fetching fails, it keeps the previous successful JSON data so the site does not lose the schedule.

`sync:calendar` deletes previously synced events by default. Set `GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC=true` only when the target Google Calendar should be emptied before inserting the synced events.

Images are written as image URLs in the Google Calendar event description. Google Calendar month view does not reliably display event images as visual cards.

## Environment Variables

- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_EVENTS_LIMIT`
- `FACEBOOK_EVENTS_ICAL_URL`
- `GOOGLE_CALENDAR_ICAL_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_CLEAR_BEFORE_SYNC`
- `GOOGLE_CALENDAR_SYNC_DRY_RUN`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FACEBOOK_BROWSER_SYNC`
- `FACEBOOK_BROWSER_COOKIES_JSON`
