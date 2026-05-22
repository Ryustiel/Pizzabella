# Pizza-Bella Static Site

This GitHub Pages site lives in `docs/` and is published on `pizzabella.rouf.me`.

## Structure

- `index.html` is the French home page for Pizza-Bella Lanester.
- `menu.html` is the main SEO menu page with pizza cards, search, quick filters, and the floating order notepad.
- `menu.js` powers menu search, filters, local notepad storage, totals, and item removal.
- `styles.css` contains the shared responsive layout and visual system.
- `robots.txt` and `sitemap.xml` support search engine discovery.
- `CNAME` stores the custom GitHub Pages domain.

## Business Rules

- Orders are by phone only: `02 97 89 35 99`.
- Service is takeaway only.
- Opening hours shown on the site: Tuesday to Sunday, 18:00-21:30; closed Monday.
- Menu prices and ingredients were extracted from the previous Wix export before cleanup.
- The Google reviews block links to the Pizza Bella Lanester Google/Maps presence instead of embedding stale scraped review text.

## Editing Notes

- Keep navigation links relative: `index.html`, `menu.html`.
- Keep menu item content in the HTML so search engines can index it without JavaScript.
- Add search aliases in each card's `data-keywords` attribute when customers may type alternate terms.
- The notepad uses `localStorage` only; it does not transmit orders.
