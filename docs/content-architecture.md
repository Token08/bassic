# Content Architecture

This site is structured so future admin/CMS work can replace content data without rewriting UI components.

## Editable Content Entry Points

- `lib/site.ts`
  - Store identity, address, phone, email, hours, charge, smoking policy, Google Map, and SNS URLs.
  - Use this for business-wide facts that affect SEO and structured data.

- `lib/editable-content.ts`
  - Store visual assets, hero slides, fallback menu images, SNS embed URLs, and social links.
  - Replace or extend this file when a future admin site manages images or visual configuration.

- `lib/page-content.ts`
  - Store page-level copy and reusable section copy that is still static today.
  - Move these values into CMS/admin fields later without changing page layout components.
  - Current examples: page hero text, visit information card labels, SNS section copy, and the home menu teaser.

- `lib/fallback-data.ts`
  - Store local fallback content for home copy, events, menu items, and party plans.
  - This keeps the static site usable when microCMS is not configured or fetches fail.

- `lib/microcms.ts`
  - Fetch and normalize CMS content.
  - Keep fallback merging and sorting here so components can receive stable data.

- `lib/i18n.ts`
  - Store localized labels and page metadata for non-Japanese pages.

## UI Layer Rule

Components should render data. They should avoid owning prices, event dates, image paths, or operational facts.

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
- Visuals: top slideshow, event slideshow, party slideshow, menu teaser image.
- Business facts: hours, charge, smoking policy, phone, email, Google Map URL.

When adding new admin fields, update types in `lib/types.ts`, add fallback values in `lib/fallback-data.ts` or `lib/editable-content.ts`, then normalize in `lib/microcms.ts`.
