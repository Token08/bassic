# SNS embeds

The homepage currently prioritizes stable display over real-time feeds.
Instagram renders an official profile card so the page never breaks because of embed restrictions or blocked third-party frames.
Facebook keeps the official Page Plugin timeline because it has been the most stable embed for this site.
X uses the official timeline widget and falls back to a profile link card if the widget script cannot load.

## Instagram

Instagram renders a profile card that links to `@bassic_official`.
Do not add the native Instagram embed iframe directly; Instagram commonly blocks timeline iframe display on public static sites.
If real-time Instagram posts are needed later, fetch them server-side or through a future admin/CMS backend and render sanitized static JSON.

## Facebook

Facebook uses the official Page Plugin timeline iframe, or static JSON when `public/data/social-feed.json` contains Facebook posts.

## X

X renders the official timeline widget for `@bar_Bassic` through `https://platform.twitter.com/widgets.js`.
The component keeps a fallback card because X can still rate-limit or block embeds depending on the visitor environment.
If real-time X posts are needed later, fetch them server-side with a managed token and render static JSON.
