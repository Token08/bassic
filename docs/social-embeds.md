# SNS embeds

Build-time API feeds are preferred when `public/data/social-feed.json` contains posts.
See `docs/social-api-feeds.md` for the GitHub Secrets and fetch script.

## Instagram

The homepage supports a LightWidget iframe for the Instagram timeline.

1. Create a LightWidget widget for `bassic_official`.
2. Copy the generated iframe `src`, for example:
   `https://cdn.lightwidget.com/widgets/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.html`
3. Set it as:
   `NEXT_PUBLIC_INSTAGRAM_WIDGET_SRC`

For GitHub Pages, add it as a Repository Variable named:

```text
NEXT_PUBLIC_INSTAGRAM_WIDGET_SRC
```

If the value is empty or not a valid LightWidget iframe URL, the site falls back to a safe Instagram profile card.

## Facebook

Facebook uses the official Page Plugin timeline iframe.

## X

X API posts from `public/data/social-feed.json` are preferred.
The official X timeline widget is not used by default because it can render an empty or rate-limited frame.

If an external iframe widget is preferred, set:

```text
NEXT_PUBLIC_X_WIDGET_SRC
```

When this value is set to an HTTPS URL and no API posts are available, the homepage uses that iframe.
If neither API posts nor an iframe URL are available, the site shows a clean X profile card.
