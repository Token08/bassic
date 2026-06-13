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

X uses the official timeline widget by default.
The site loads `https://platform.twitter.com/widgets.js` in the browser and converts the timeline link into an iframe.

If the official X widget is rate-limited or blocked, set an external iframe widget URL as:

```text
NEXT_PUBLIC_X_WIDGET_SRC
```

When this value is set to an HTTPS URL, the homepage uses that iframe instead of the official X widget.
The X card always keeps a direct link to the official X page.
