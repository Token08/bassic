# Content Architecture

This site is structured so future admin/CMS work can replace content data without rewriting UI components.

## Editable Content Entry Points

- `lib/site.ts`
  - Store identity, address, phone, email, hours, charge, smoking policy, Google Map, and SNS URLs.
  - Use this for business-wide facts that affect SEO and structured data.

- `lib/editable-content.ts`
  - Store visual assets, hero slides, fallback menu images, social links, and stable third-party embed URLs.
  - Replace or extend this file when a future admin site manages images or visual configuration.
  - The event calendar embed URL is also stored here. It reuses the Google Calendar ID from the legacy `calendar.html` page.

- `lib/page-content.ts`
  - Store page-level copy and reusable section copy that is still static today.
  - Move these values into CMS/admin fields later without changing page layout components.
  - Current examples: page hero text, first-visit feature cards, visit information card labels, SNS section copy, and the home menu teaser.

- `lib/localized-content.ts`
  - Store translated section copy that is not page metadata.
  - Keep localized first-visit cards, SNS intro copy, access teaser copy, and language-specific helper labels here.
  - Move these values into translated CMS/admin fields later if multilingual editing becomes part of the management workflow.

- `lib/fallback-data.ts`
  - Store local fallback content for home copy, events, menu items, party plans, and social notice cards.
  - This keeps the static site usable when microCMS is not configured or fetches fail.

- `lib/microcms.ts`
  - Fetch and normalize CMS content.
  - Keep fallback merging and sorting here so components can receive stable data.

- `lib/i18n.ts`
  - Store localized labels and page metadata for non-Japanese pages.

- `lib/routes.ts`
  - Store canonical internal page paths, localized path generation, and sitemap route priorities.
  - Update this first when adding a page or changing a URL.

- `lib/path-utils.ts`
  - Store runtime path helpers used by the header and language switcher.
  - Keep base path stripping, current locale detection, internal localized links, and language-switch URLs here.
  - Update this only when URL behavior changes; avoid duplicating path logic inside UI components.

- `scripts/smoke-seo.mjs`
  - Check exported HTML after `npm run build`.
  - Confirms canonical URLs, hreflang, OGP/Twitter tags, and sitemap registration for Japanese and localized public pages.

- `scripts/smoke-links.mjs`
  - Check exported HTML after `npm run build`.
  - Confirms internal links and local asset references resolve inside `out/`.

## UI Layer Rule

Components should render data. They should avoid owning prices, event dates, image paths, or operational facts.

Shared UI pieces should be reused across Japanese and localized pages when they render the same concept. For example, visit information cards are rendered through `components/visit-info.tsx` so hours, charge, and smoking policy stay visually consistent across languages. First-visit feature cards use `FeatureCardGrid` from `components/content.tsx`, with copy supplied by `lib/page-content.ts` or `lib/localized-content.ts`. Header navigation and the language switcher should use `lib/path-utils.ts` so the selected language is preserved across internal page transitions.

Preferred flow:

1. Admin/CMS stores editable content.
2. `lib/microcms.ts` or a future API adapter normalizes it.
3. Page files pass normalized data into components.
4. Components only render the received data.

## Future Admin Site Notes

Recommended admin-managed fields:

- Events: date, title, performers, open/start time, price, reservation text, image, published flag.
- Menu: name, English name, category, price, description, image.
- Home: hero title, hero lead, first-visit lead, access note, top images.
- Social notices: platform, title, post URL, date, short description, published flag.
- Visuals: top slideshow, event slideshow, party slideshow, menu teaser image.
- Business facts: hours, charge, smoking policy, phone, email, Google Map URL.

When adding new admin fields, update types in `lib/types.ts`, add fallback values in `lib/fallback-data.ts` or `lib/editable-content.ts`, then normalize in `lib/microcms.ts`.

For X, Instagram, or Facebook posts that should appear on the homepage without API maintenance, add them to the `social-notices` endpoint. The site renders those cards before trying static API JSON or third-party embeds.
