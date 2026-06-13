# SNS embeds

The homepage currently prioritizes stable display over real-time feeds.
Instagram and X render official profile cards so the page never breaks because of embed restrictions, rate limits, or blocked third-party frames.
Facebook keeps the official Page Plugin timeline because it has been the most stable embed for this site.

## Instagram

Instagram renders a profile card that links to `@bassic_official`.
Do not add the native Instagram embed iframe directly; Instagram commonly blocks timeline iframe display on public static sites.
If real-time Instagram posts are needed later, fetch them server-side or through a future admin/CMS backend and render sanitized static JSON.

## Facebook

Facebook uses the official Page Plugin timeline iframe, or static JSON when `public/data/social-feed.json` contains Facebook posts.

## X

X renders a profile card that links to `@bar_Bassic`.
The official X timeline widget is not used because it can render an empty, rate-limited, or blocked frame.
If real-time X posts are needed later, fetch them server-side with a managed token and render static JSON.
