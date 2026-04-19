# Guide

This is the working guide for this repository.
It is meant for AI editors and human maintainers who need to update the current `inc.github.io` site safely.

## Purpose

Use this guide when you need to:

- update Japanese or English copy
- add or edit news articles
- understand how generated article pages work
- understand how the resources hub is organized
- keep JP and EN pages aligned
- avoid breaking navigation, relative paths, or deployment

## Current Structure

Main files and directories:

- Japanese top page: `index.html`
- English top page: `en/index.html`
- Japanese resources hub: `resources/index.html`
- English resources hub: `en/resources/index.html`
- Generated Japanese news article pages: `news/<slug>.html`
- Generated English news article pages: `en/news/<slug>.html`
- Generated Japanese event pages: `events/<slug>.html`
- Generated English event pages: `en/events/<slug>.html`
- Japanese news Markdown: `content/ja/news/<slug>.md`
- English news Markdown: `content/en/news/<slug>.md`
- Japanese event Markdown: `content/ja/events/<slug>.md`
- English event Markdown: `content/en/events/<slug>.md`
- Shared generated article template: `article-page.template.html`
- News/event generator: `generate-news.mjs`
- GitHub Pages workflow: `.github/workflows/static.yml`
- Shared top-page script: `assets/js/script.js`
- Shared article-page script: `assets/js/article.js`
- Shared stylesheet: `assets/css/style.css`
- Shared assets: `assets/images/...`

## Deployment Model

The site is deployed through GitHub Actions to GitHub Pages.

Current flow:

1. Edit Markdown files.
2. Push to `main`.
3. `.github/workflows/static.yml` runs.
4. The workflow installs dependencies and runs `npm run build`.
5. `generate-news.mjs` rebuilds the top-page news lists and article HTML files.
6. GitHub Pages deploys the generated static site.

Important:

- You do not need to hand-write article HTML files for normal content work.
- Generated HTML is still required at deploy time, but Actions creates it.
- `content/` must stay in the deployed artifact because `assets/js/article.js` fetches Markdown at runtime.

## Authoring Model

News and event content is authored in Markdown with front matter.
Generated files should not be manually edited in normal operation.

Edit these:

- `content/ja/news/<slug>.md`
- `content/en/news/<slug>.md`
- `content/ja/events/<slug>.md`
- `content/en/events/<slug>.md`
- `article-page.template.html` only if you want to change generated article layout
- `generate-news.mjs` only if you want to change generation logic

Do not normally edit these by hand:

- `news/<slug>.html`
- `en/news/<slug>.html`
- `events/<slug>.html`
- `en/events/<slug>.html`
- generated list items in `index.html`
- generated list items in `en/index.html`

## Front Matter

### News front matter

Each news Markdown file should start with front matter like this:

```yaml
---
title: Website Launched
date: 2026-04-12
dateLabel: 2026.04.12
description: Announcement for the launch of the INC website.
slug: homepage-opened
lang: en
translationKey: homepage-opened
summary: Our website is now live. We will keep updating this page with the latest information about INC.
---
```

### Event front matter

Event Markdown files use the same required fields, plus an optional `image` field:

```yaml
---
title: Opening Event
date: 2026-04-12
dateLabel: 2026.04.12
description: Details for the opening event.
slug: opening-event
lang: en
translationKey: opening-event
summary: We are planning an opening event to celebrate the launch of the INC world.
image: /assets/images/world/p01.png
---
```

The `image` field is optional. If present, it is shown as the card image on the top page.
Use root-relative paths starting with `/` (e.g., `/assets/images/world/p01.png`) so the path works from both JP and EN top pages.

Required fields (both news and events):

- `title`
- `date`
- `dateLabel`
- `description`
- `slug`
- `lang`
- `translationKey`
- `summary`

Optional fields (events only):

- `image`: root-relative path to the card image

Field meaning:

- `title`: article page title
- `date`: sorting date
- `dateLabel`: visible date string for the list
- `description`: meta description for the generated page
- `slug`: generated article file name and public article path
- `lang`: `ja` or `en`
- `translationKey`: ties JP and EN versions together
- `summary`: text shown in the top-page list card
- `image`: (events only) card image shown on the top page

## URL Rules

Public-facing links are intentionally cleaner than the underlying file names.

Current behavior:

- top JP home link: `./`
- top EN home link: `./`
- JP/EN top language switch: `./`, `./en/`, `../`
- public article links omit `.html`
  - example: `./news/homepage-opened`
  - example: `../news/homepage-opened`
- generated files still exist as `news/<slug>.html` and `en/news/<slug>.html`

Resources hub paths:

- JP resources hub from top page: `./resources/`
- EN resources hub from top page: `./resources/`
- JP resources hub file: `resources/index.html`
- EN resources hub file: `en/resources/index.html`

For article pages:

- Japanese article home link: `../`
- English article home link: `../`
- article language switch links also omit `.html`

## Relative Path Rules

Asset paths still depend on directory depth.

- root page assets: `./assets/...`
- `en/` page assets: `../assets/...`
- `news/` page assets: `../assets/...`
- `en/news/` page assets: `../../assets/...`

`body[data-asset-base]` must stay correct or generated UI assets can break.

Examples:

- root page: `<body data-asset-base="./assets/">`
- `en/`: `<body data-asset-base="../assets/">`
- `news/`: `<body data-asset-base="../assets/">`
- `en/news/`: `<body data-asset-base="../../assets/">`

## Navigation Rules

### Top-page navigation

`assets/js/script.js` builds navigation from `<section>` elements.
Each top-page section must keep:

- `id`
- `data-title`
- `data-class`
- `data-accordion`

Do not casually rename these.

### Current top-page structure

The current top-page sections are:

- `NEWS`
- `ワールド概要 / World Overview`
- `関連情報 / Resources`
- `Contact`

The former `Rules / Events / Groups` tab section is intentionally not present on the top page right now.

### Dropdown sections

If a future page uses `nav-drop`, the number of tab items and content slides must match:

- `.tab-wrapp`
- `.mySwiper2 .swiper-wrapper`

### Generated news list

The top-page `NEWS` list keeps this structure:

- `<li class="news-item is-link" data-more="">`

That structure is preserved because `script.js` relies on it for the existing "more" behavior.

### Resources hub

The resources hub is the main expansion point for future non-news information.

Current hub pages:

- `resources/index.html`
- `en/resources/index.html`

Current categories:

- `Documentation`
- `Links`

## Article Rendering Rules

`assets/js/article.js` currently supports:

- YAML-style front matter stripping
- headings
- paragraphs
- unordered lists
- ordered lists
- inline code
- Markdown links
- Markdown images with `![alt](path)`
- Image width/height options with `![alt](path){width=320}` or `![alt](path =320x180)`
- Side-by-side image rows with `::: images`
- bold
- italic
- fenced code blocks

Avoid assuming support for:

- tables
- advanced nested list formatting
- custom embedded HTML layouts
- complex markdown extensions

Image examples:

```md
![Wide image](/assets/images/example.png){width=640}
![Half width](/assets/images/example.png){width=50%}

::: images
![Left](/assets/images/left.png)
![Right](/assets/images/right.png)
:::
```

## Generator Notes

`generate-news.mjs` currently handles:

- reading Markdown entries from `content/ja/news` and `content/en/news`
- tolerating missing news directories by treating them as empty
- creating article output directories before writing files
- generating top-page `NEWS` items
- generating article HTML from `article-page.template.html`

Supporting placeholder files exist so empty directories remain in git:

- `content/ja/news/.gitkeep`
- `content/en/news/.gitkeep`
- `news/.gitkeep`
- `en/news/.gitkeep`

## Recommended Workflow

### Add or update a news article

1. Create or edit `content/ja/news/<slug>.md`.
2. Create or edit `content/en/news/<slug>.md`.
3. Keep `translationKey` aligned between JP and EN.
4. Commit and push.
5. Let GitHub Actions generate and deploy the site.

For local preview, you can still run:

```bash
npm run build
```

### Change generated article layout

1. Edit `article-page.template.html`.
2. If needed, update `generate-news.mjs`.
3. Run `npm run build` locally to verify generated output.

### Expand the resources area

1. Update `resources/index.html` and `en/resources/index.html` when adding new hub categories.
2. Add new linked pages under `resources/` and `en/resources/` as needed.
3. Keep JP and EN structures parallel unless there is a clear reason not to.

## What To Avoid Breaking

Avoid casual changes to:

- section IDs and section `data-*` values
- major class names used by CSS and JS
- `data-asset-base`
- generated article path conventions
- `translationKey` pairing logic
- GitHub Pages workflow assumptions

## Quick Checklist

After making changes, verify:

- top-page navigation still works
- generated `NEWS` links point to the intended article
- article home links go to `../`
- JP/EN article switch links point to the counterpart article
- no relative paths were broken
- `npm run build` succeeds locally when needed

## Current Status

As of the current repo state:

- JP and EN top pages exist
- JP and EN resources hub pages exist
- article pages are generated from Markdown
- top-page article links omit `.html`
- home links avoid explicit `index.html`
- GitHub Actions generates pages during deployment
- `Resources` is now the preferred entry point for documentation and related links
- `Contact` is still placeholder content
