# Guide

This is the working guide for this repository.
It is meant for AI editors and human maintainers who need to update the current `inc.github.io` site safely.

## Purpose

Use this guide when you need to:

- update Japanese or English copy
- add or edit news articles
- understand how generated article pages work
- keep JP and EN pages aligned
- avoid breaking navigation, relative paths, or deployment

## Current Structure

Main files and directories:

- Japanese top page: `index.html`
- English top page: `en/index.html`
- Generated Japanese article pages: `news/<slug>.html`
- Generated English article pages: `en/news/<slug>.html`
- Japanese article Markdown: `content/ja/news/<slug>.md`
- English article Markdown: `content/en/news/<slug>.md`
- Shared generated article template: `article-page.template.html`
- News generator: `generate-news.mjs`
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

News content is authored in Markdown with front matter.
Generated files should not be manually edited in normal operation.

Edit these:

- `content/ja/news/<slug>.md`
- `content/en/news/<slug>.md`
- `article-page.template.html` only if you want to change generated article layout
- `generate-news.mjs` only if you want to change generation logic

Do not normally edit these by hand:

- `news/<slug>.html`
- `en/news/<slug>.html`
- generated `NEWS` list items in `index.html`
- generated `NEWS` list items in `en/index.html`

## Front Matter

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

Required fields:

- `title`
- `date`
- `dateLabel`
- `description`
- `slug`
- `lang`
- `translationKey`
- `summary`

Field meaning:

- `title`: article page title
- `date`: sorting date
- `dateLabel`: visible date string for the news list
- `description`: meta description for the generated page
- `slug`: generated article file name and public article path
- `lang`: `ja` or `en`
- `translationKey`: ties JP and EN versions together
- `summary`: text shown in the top-page `NEWS` list

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

### Dropdown sections

For `nav-drop` sections, the number of tab items and content slides must match:

- `.tab-wrapp`
- `.mySwiper2 .swiper-wrapper`

### Generated news list

The top-page `NEWS` list keeps this structure:

- `<li class="news-item is-link" data-more="">`

That structure is preserved because `script.js` relies on it for the existing "more" behavior.

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
- bold
- italic
- fenced code blocks

Avoid assuming support for:

- tables
- advanced nested list formatting
- custom embedded HTML layouts
- complex markdown extensions

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
- article pages are generated from Markdown
- top-page article links omit `.html`
- home links avoid explicit `index.html`
- GitHub Actions generates pages during deployment
- `Rules / Events / Groups` is still placeholder content
- `Contact` is still placeholder content
