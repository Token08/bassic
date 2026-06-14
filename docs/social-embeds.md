# SNS embeds

The homepage currently prioritizes stable display over real-time feeds.
Instagram renders an official profile card so the page never breaks because of embed restrictions or blocked third-party frames.
Facebook keeps the official Page Plugin timeline because it has been the most stable embed for this site.
X renders static API feed data when `public/data/social-feed.json` contains posts. Without API data, it falls back to a profile link card.

## Instagram

Instagram renders a profile card that links to `@bassic_official`.
Do not add the native Instagram embed iframe directly; Instagram commonly blocks timeline iframe display on public static sites.
If real-time Instagram posts are needed later, fetch them server-side or through a future admin/CMS backend and render sanitized static JSON.

## Facebook

Facebook uses the official Page Plugin timeline iframe, or static JSON when `public/data/social-feed.json` contains Facebook posts.

## X

The official X timeline widget was tested on GitHub Pages and can render `Rate limit exceeded`, even when the iframe itself loads.
For launch stability, do not show that widget by default.
Use `npm run fetch:social` with `X_BEARER_TOKEN` to write recent X posts into `public/data/social-feed.json`; the homepage will then render those posts as a static feed.
