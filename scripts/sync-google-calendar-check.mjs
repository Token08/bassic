process.env.GOOGLE_CALENDAR_SYNC_DRY_RUN = "true";
process.env.GOOGLE_CALENDAR_SYNC_FAIL_ON_WARNINGS = "true";

await import("./sync-google-calendar.mjs");
