# SNS embeds

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

The official X timeline widget can show rate-limit errors in embedded pages.
To avoid showing a broken black widget to visitors, the site uses a safe profile card by default.

To show a timeline, set an external iframe widget URL as:

```text
NEXT_PUBLIC_X_WIDGET_SRC
```

When this value is set to an HTTPS URL, the homepage uses that iframe.
If the value is empty, the site keeps the clean X profile card and links to the official X page.
