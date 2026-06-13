# Social API feeds

This repository keeps the API-fetching script as a future option, but the current homepage does not depend on Instagram or X API output.
For public launch stability, Instagram and X use official profile cards, while Facebook can use either static JSON or the official Page Plugin iframe.

If real-time feeds are introduced later, fetch posts at build time or through a server/admin process so API tokens never reach the browser.

Run locally:

```bash
npm run fetch:social
npm run build
```

Output:

```text
public/data/social-feed.json
```

## GitHub Secrets

Add these as repository secrets when API access is ready:

```text
X_BEARER_TOKEN
INSTAGRAM_ACCESS_TOKEN
INSTAGRAM_USER_ID
FACEBOOK_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
```

`FACEBOOK_PAGE_ID` can be omitted when the page id `bar.Bassic` works.
`INSTAGRAM_USER_ID` can be omitted only when the token supports the `graph.instagram.com/me/media` endpoint.

## Display priority

The current homepage uses this order:

1. Facebook API JSON posts from `public/data/social-feed.json`, when present
2. Facebook official Page Plugin iframe
3. Instagram and X official profile cards

## Notes

- X requires a valid bearer token for the X API v2 user timeline endpoints.
- Instagram and Facebook require Meta tokens with the correct page/account permissions.
- Without tokens, the script writes empty feeds and the site keeps the current fallback UI.
- Keep Instagram/X API rendering behind a future server/admin integration unless a stable token-management workflow is ready.
