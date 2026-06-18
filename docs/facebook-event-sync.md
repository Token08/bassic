# Facebook Event Sync

`npm run fetch:events` writes `public/data/facebook-events.json`.

`npm run sync:calendar` reads Facebook events registered in the admin CMS first, then reads `public/data/facebook-events.json`, deduplicates by Facebook event URL/source id, and writes the events into the embedded Google Calendar. Synced Facebook events are not rendered in the Pickup cards.

For client operation, the preferred workflow is semi-automatic: paste a Facebook event URL into the admin event form, press the Facebook import button, confirm title/date/image, then publish.

If the operator pastes a single Facebook event URL and saves without pressing the import button, the admin app still marks it as a Facebook event for calendar sync. The title, date, and image still need to be confirmed before publishing.

Before writing to Google Calendar, run `npm run sync:calendar:dry` to preview the event title, start/end time, Facebook URL, and image URL that would be synced. The dry run prints a warning summary at the end, so confirm it says `Dry run completed without warnings.` before the real sync. If the output looks correct, run `npm run sync:calendar`.

If the dry run prints a warning, check the event in the admin screen before syncing. The most common warning is using the Facebook page's event list URL instead of a single event URL. Use a URL like `https://www.facebook.com/events/1234567890/`.

The real sync also stops when warnings remain, so incomplete event data cannot be missed. Only a maintainer should bypass this by setting `GOOGLE_CALENDAR_SYNC_ALLOW_WARNINGS=true`, and only after confirming the warning is acceptable.

For stricter release checks in dry run, set `GOOGLE_CALENDAR_SYNC_FAIL_ON_WARNINGS=true`. In that mode, any warning stops the command before the real sync step.

Published events without a title or date are not synced. The dry run reports them as skipped items, and the real sync stops until the admin data is fixed.

## Admin Import Workflow

1. Open the dedicated admin screen and choose `イベント`.
2. Paste a single Facebook event URL into `FacebookイベントURL・詳細URL`.
3. Press `Facebookから読み取る`.
4. Confirm the imported title, date, start time, end time, and image.
5. If Facebook does not expose the event date/time in metadata, enter the date and time manually.
6. Turn `公開する` on and publish after preview.
7. Run `npm run sync:calendar:dry` before the real calendar sync.

The importer reads `og:title`, `og:image`, `og:description`, and JSON-LD event metadata when Facebook exposes it. Facebook may hide date/time depending on login state or markup changes, so manual confirmation stays part of the workflow.

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

If an event image starts with `/`, the sync script converts it to the public site URL before writing it to Google Calendar. Set `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_PUBLIC_SITE_URL` to the final domain before production sync.

## Environment Variables

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
