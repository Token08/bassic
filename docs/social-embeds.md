# SNS embeds

The homepage currently prioritizes stable display over real-time feeds.
Instagram renders an official profile card so the page never breaks because of embed restrictions or blocked third-party frames.
Facebook keeps the official Page Plugin timeline because it has been the most stable embed for this site.
X renders static API feed data when `public/data/social-feed.json` contains posts. Without API data, it falls back to a profile link card.

CMS-managed display settings now have the highest priority. Instagram uses `home.instagramWidgetSrc` first, and X uses `social-notices` cards before trying API JSON or profile-card fallbacks.

## Instagram

Instagram renders a CMS-configured iframe widget when `home.instagramWidgetSrc` is set.
Use LightWidget or a similar external widget service, then paste only the iframe `src` URL into microCMS.
Do not paste external script tags into the site.
If the widget URL is empty or invalid, Instagram falls back to a stable profile/card display.

## Facebook

Facebook uses the official Page Plugin timeline iframe, or static JSON when `public/data/social-feed.json` contains Facebook posts.
If a specific Facebook post should be highlighted, register it in `social-notices`.

## X

The official X timeline widget was tested on GitHub Pages and can render `Rate limit exceeded`, even when the iframe itself loads.
For launch stability, do not show that widget by default.
Use `npm run fetch:social` with `X_BEARER_TOKEN` to write recent X posts into `public/data/social-feed.json`; the homepage will then render those posts as a static feed.
For non-engineer operation, the preferred X workflow is to paste X post URLs into the `social-notices` microCMS endpoint. This avoids bearer tokens and rate-limit display failures.
