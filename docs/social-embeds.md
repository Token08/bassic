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

X uses the official `twitter-timeline` widget. The site reloads the widget after hydration so the timeline has another chance to render after client-side page load.
