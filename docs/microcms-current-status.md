# Bassic. microCMS current status

## Current implementation

- The public site already has a microCMS adapter in `lib/microcms.ts`.
- If microCMS is not configured, the site uses local fallback content and keeps rendering.
- The dedicated admin app exists in `admin-app/`.
- GitHub Pages deploy already supports `repository_dispatch` with `microcms_publish`.
- `npm run seed:cms` can preview the initial content that will be uploaded to microCMS.

## APIs expected by the site

Create these API IDs in microCMS exactly as written:

- `site-settings`
- `home`
- `hero-slides`
- `events`
- `menu`
- `drink-menu-sheets`
- `party-plans`
- `equipment-rental`
- `social-notices`
- `page-copy`
- `page-sections`
- `custom-sections`

Use `docs/microcms-field-definitions-v1.md` for the field list and `docs/cms-sample-content-v1.json` for initial values.

## Values still needed before CMS launch

- microCMS service domain
- microCMS API key with read/write permissions
- GitHub repository secrets:
  - `MICROCMS_SERVICE_DOMAIN`
  - `MICROCMS_API_KEY`
- A GitHub dispatch token for the dedicated admin app if the app should publish changes automatically.
- Vercel environment variables for `admin-app/` if the dedicated admin app is deployed.

## Useful commands

```bash
npm run typecheck
npm run typecheck:admin-app
npm run check:admin-app
npm run sync:calendar:check
npm run seed:cms
npm run smoke:cms
npm run build
npm run smoke:content
```

When real microCMS credentials are ready:

```bash
npm run setup:admin
npm run seed:cms -- --apply
npm run check:admin
npm run smoke:cms
```

## Current known blocker

`npm run check:admin` fails until the GitHub repository has real `MICROCMS_SERVICE_DOMAIN` and `MICROCMS_API_KEY` secrets. This is expected before microCMS has been created.
