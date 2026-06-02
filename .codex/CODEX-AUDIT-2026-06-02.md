# Codex audit handoff - 2026-06-02

## Scope inspected

- Astro site data layer, layouts, dynamic work pages, structured data, and build output behavior.
- Public content/config docs.
- Dependency audit posture.

## Checks run

- `npm ci`
- `npm run build`
- `npm audit --audit-level=moderate`

Build passed. Audit still reports Astro advisories requiring a major-version upgrade decision.

## Confident fixes made

- Escaped text before applying emphasis markup in `src/data/site.ts`, so CMS/content strings cannot inject raw HTML through the `emphasize()` helper.
- Escaped `<` in JSON-LD serialization for the base layout and work detail pages before using `set:html`, preventing script-tag breakouts from structured data.

## Human decisions / next-agent notes

- `npm audit` reports Astro advisories and recommends upgrading to Astro 6.x. Treat that as a planned framework upgrade with visual/regression checks rather than a blind audit-force change from the current Astro 5.x site.
- Content-driven HTML should stay centralized through safe helpers. Avoid adding new `set:html` call sites unless the input is escaped or sanitized.
- Re-run visual checks after the Astro upgrade because the site uses generated images/assets and content-driven pages.
