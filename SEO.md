# SEO notes

This site is deployed at `kohlhofer.com/books`, a subdirectory of a personal
portfolio. That shared domain is the whole reason this file exists: what the
book catalog does in search affects how the portfolio is judged.

## The problem (measured 2026-08-03, 90-day window)

| | pages with impressions | impressions | clicks | CTR |
|---|---|---|---|---|
| `/books/*` | 104 | 1,753 | **0** | 0.00% |
| rest of kohlhofer.com | 17 | 2,072 | 58 | 2.80% |
| **domain total** | 121 | 3,825 | 58 | **1.52%** |

The catalog was 86% of the domain's indexed pages and 46% of its impressions,
and had never produced a single click. It halved the domain's measured CTR.

The generated author pages ranked around position 46–70 for queries like
`christopher paolini`, `hugh howey`, `orson scott card` — page 5–7 of the
results, against Goodreads, Amazon and Wikipedia, for authors this site has no
claim on. 293 of the top 300 queries were zero-click. The relevance cost was
the bigger one: Google was being taught that `kohlhofer.com` is a mediocre book
catalog rather than a product-and-design portfolio.

The content itself explains the ranking. 373 of 468 author pages list exactly
one book. On a page like `/books/authors/homer.html`, the unique content is
about fifteen words; the other 7.4 KB is navigation boilerplate shared with
every other page.

## The fix

Every generated page emits `<meta name="robots" content="noindex, follow">`.
Only the landing page, `/books/`, stays indexable. `follow` is deliberate —
Google still traverses the links, it just doesn't index the destinations.

This is driven by `indexable` in the page data in `build-handlebars.js`;
the tag itself lives in `templates/layouts/main.hbs`, which is the single
`<head>` for all 536 pages.

Production builds also emit self-referencing canonicals. GitHub Pages serves
both `/authors/homer.html` and `/authors/homer` with a `200`, so the canonical
names the preferred form. (As of 2026-08-03 Google had only ever discovered the
`.html` variant, so this is a guard, not a live fix.)

## ⚠️ Do not add `Disallow: /books/` to robots.txt

`robots.txt` lives in the parent repo (`kohlhofer.github.com`) and must keep
saying `Allow: /` until the old pages have drained out of the index.

Blocking the crawl is the intuitive move and it backfires: Google can't see a
`noindex` on a page it isn't allowed to fetch, so the pages would stay indexed
indefinitely as URL-only entries. Disallow is only safe *after* the index is
clean, and by then it's redundant.

## ⚠️ `dist/sitemap.xml` is temporary — delete it when done

Generated only in production builds, at the end of `build()`.

It lists all 536 URLs with a fresh `lastmod` even though every one of them is
`noindex`. That is the point: Google can't act on a `noindex` until it
recrawls, and it had last touched some of these pages two months prior. The
sitemap is the only lever available to pull it back sooner.

**Search Console will report "Submitted URL marked 'noindex'" for these. That
warning is the mechanism working.** Don't fix it.

Once the pages are out of the index (see below), remove the sitemap block from
`build-handlebars.js` and delete the submission:

```sh
cd ../kohlhofer.github.com
node scripts/gsc.mjs delete-sitemap https://kohlhofer.com/books/sitemap.xml
```

## Checking progress

The GSC CLI lives in the parent repo and authenticates as a service account
(key at `~/.config/nsct-gsc/key.json`, outside both repos).

```sh
cd ../kohlhofer.github.com

# How many /books pages still draw impressions? Baseline was 104.
node scripts/gsc.mjs query --dim page --days 28 --limit 200

# Is a specific page still indexed? Baseline: "Submitted and indexed".
node scripts/gsc.mjs inspect https://kohlhofer.com/books/authors/christopher-paolini.html

# Sitemap status, including the noindex warnings described above.
node scripts/gsc.mjs sitemaps
```

**What success looks like.** `/books` impressions fall toward zero over roughly
one to three months while non-`/books` clicks hold steady. Total impressions
dropping by ~1,753 per 90 days is the fix working, not a regression — those
impressions were worth no clicks. Domain CTR should move from 1.52% toward
2.80% as the denominator shrinks.

**Baseline to compare against (2026-08-03):** 104 `/books` pages with
impressions, 1,753 impressions, 0 clicks. Landing page `/books/` was
"Crawled – currently not indexed" — Google had declined the landing page while
indexing 104 of the thin pages beneath it.

## Known bug: slug collisions

`generateSlug()` lowercases, so names differing only by case collide and one
page overwrites the other. The build prints a warning listing them. Currently:

- `Self-help` vs `Self-Help` → both write `/categories/self-help.html`
- `unknown,unknown` vs `Unknown,Unknown` → both write `/authors/unknown-unknown.html`

66 categories produce 65 files; 469 authors produce 468. The books on the
overwritten page are unreachable by that route.

The source of the problem is inconsistent casing in `books/*.csv`. Fixing it
means either normalizing the CSVs or grouping case-insensitively — the latter
changes category counts and the author list, so it's a content decision, not a
mechanical one. No SEO impact while these pages are `noindex`.
