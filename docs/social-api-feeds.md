# Social API feeds

The homepage can render recent posts from static JSON generated at build time.
This keeps API tokens out of the browser and works on GitHub Pages.

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

The site uses this order:

1. API JSON posts from `public/data/social-feed.json`
2. Configured iframe widget URL, where supported
3. Official embed or profile fallback

## Notes

- X requires a valid bearer token for the X API v2 user timeline endpoints.
- Instagram and Facebook require Meta tokens with the correct page/account permissions.
- Without tokens, the script writes empty feeds and the site keeps the current fallback UI.
