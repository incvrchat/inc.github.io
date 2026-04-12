# AI Template Guide

This document is the working guide for AI agents and new editors who maintain this repository.
It is not a generic template manual. It describes how the current `inc.github.io` site is actually structured today and what should be preserved when editing it.

## Purpose

Use this guide when you need to:

- update copy on the Japanese or English site
- add or revise news items
- create matching JP and EN pages
- edit article body content stored in Markdown
- avoid breaking the existing navigation and layout logic

## Base References

The site originated from these template references:

- GitHub Pages manual
  - <https://academeia.github.io/web_template.github.io/githubpages>
- Web template editing manual
  - <https://academeia.github.io/web_template.github.io/webtemplate>

The current repository is a simplified, customized version of that template. Do not assume the original template structure still matches this repo exactly.

## Current Site Structure

Main files currently in use:

- Japanese top page: `index.html`
- English top page: `en/index.html`
- Generated Japanese news pages: `news/<slug>.html`
- Generated English news pages: `en/news/<slug>.html`
- Japanese article Markdown: `content/ja/news/<slug>.md`
- English article Markdown: `content/en/news/<slug>.md`
- Shared article page template: `article-page.template.html`
- News generator script: `generate-news.mjs`
- Generator command: `npm run generate:news`
- GitHub Pages workflow: `.github/workflows/static.yml`
- Shared stylesheet: `assets/css/style.css`
- Shared top-page script: `assets/js/script.js`
- Shared article-page script: `assets/js/article.js`
- Shared assets: `assets/images/...`

## Current Information Architecture

### Japanese top page

The current sections on `index.html` are:

- `NEWS`
- `ワールド概要`
- `ルール・イベント・紹介グループ`
- `Contact`

At the moment, the rules/events/groups section and the contact section are effectively placeholders.

### English top page

The current sections on `en/index.html` are:

- `NEWS`
- `World Overview`
- `Rules / Events / Groups`
- `Contact`

The English site mirrors the Japanese structure and should generally stay aligned with it.

### Article pages

The article HTML files are generated wrappers.
The actual body content and article metadata are stored in Markdown and rendered by JavaScript.

Current pattern:

- JP article page HTML: `news/...`
- EN article page HTML: `en/news/...`
- JP article Markdown: `content/ja/news/...`
- EN article Markdown: `content/en/news/...`

Do not manually maintain article wrapper HTML during normal content work.
Change the Markdown files, `article-page.template.html`, or `generate-news.mjs` instead.

## Deployment Workflow

The site is deployed through GitHub Actions and GitHub Pages.

Current deployment model:

- push to `main`
- GitHub Actions runs `.github/workflows/static.yml`
- the workflow installs Node.js dependencies
- the workflow runs `npm run build`
- the workflow uploads the generated static site to GitHub Pages

Important implication:

- for normal publishing, you do not need to generate article HTML locally before pushing
- the deployed site still needs generated HTML, but GitHub Actions creates it during deployment
- `content/` must remain in the deployed artifact because `assets/js/article.js` fetches Markdown at runtime

## What Editors Should Usually Change

Safe and common edits include:

- replacing text content
- revising headings
- adding or removing news articles through Markdown
- updating links
- editing Markdown article bodies
- updating metadata such as title and description
- pushing Markdown changes so GitHub Actions can generate and deploy the site
- optionally running `npm run generate:news` for local preview

## What Editors Should Avoid Breaking

Do not casually change these unless you also understand the related JavaScript and CSS:

- section `id` values
- section `data-title`
- section `data-class`
- section `data-accordion`
- existing major class names
- navigation-related HTML structure
- shared layout assumptions in `assets/css/style.css`
- navigation generation logic in `assets/js/script.js`
- article rendering logic in `assets/js/article.js`

Why this matters:

- the global navigation is generated from `<section>` elements
- anchor links depend on stable section IDs
- dropdown navigation depends on specific structure and attributes
- class name changes can silently break styling or scripted behavior

## Critical Implementation Rules

### 1. Top-page navigation is generated from sections

`assets/js/script.js` scans the page for `<section>` elements and builds the navigation automatically.

Each top-page section must provide:

- `id`
- `data-title`
- `data-class`
- `data-accordion`

If you add a new section and forget one of these, the navigation may render incorrectly or fail to behave as expected.

### 2. `nav-drop` sections must keep tabs and slides in sync

For sections such as `Rules / Events / Groups`, the dropdown and content panels are linked by order.

These counts must stay aligned:

- number of items inside `.tab-wrapp`
- number of slides inside `.mySwiper2 .swiper-wrapper`

If those counts drift apart, the tab-to-content mapping breaks.

### 3. Top-page news items are generated

The `NEWS` section uses list items like:

- `<li class="news-item is-link" data-more="">`

Do not hand-edit those list items in normal operation.
They are generated by `generate-news.mjs` from Markdown front matter.

The "more" behavior still relies on that structure and on `data-more=""`, so the generator preserves it.

### 4. Article pages load Markdown through `data-markdown-src`

Article bodies are not meant to be hard-coded directly into the main article container.

Instead:

- the generated HTML wrapper sets `body[data-markdown-src]`
- `assets/js/article.js` fetches the Markdown file
- the script strips front matter before rendering
- the script renders headings, paragraphs, lists, links, emphasis, code blocks, and basic Markdown images

### 5. Article pages include a generated fallback block

Because `fetch()` can fail when opening a file directly with `file://`, generated article pages include:

- `#article-markdown-fallback`

The generator keeps that fallback block in sync automatically.

### 6. Article page navigation is also script-driven

`assets/js/article.js` builds article navigation from rendered headings and includes:

- a home link
- language switch links
- a heading-based table of contents

If you remove the expected article structure or heading hierarchy, the sidebar navigation becomes less useful.

## Language Switching Rules

### Top pages

- Japanese top page: `index.html`
- English top page: `en/index.html`

Language switching links live inside the menu area, below the generated navigation.

Relevant classes:

- `.nav-language`
- `.nav-language-label`
- `.nav-language-links`

### News article pages

- Japanese articles: `news/...`
- English articles: `en/news/...`

Each article page should link to its counterpart.
The generator uses `translationKey` in front matter to connect JP and EN pages.

## Relative Path Rules

This repo depends heavily on correct relative paths.
Always recalculate paths based on directory depth before creating or copying pages.

Typical asset path bases:

- root page: `./assets/...`
- `news/` page: `../assets/...`
- `en/` page: `../assets/...`
- `en/news/` page: `../../assets/...`

### `data-asset-base`

`assets/js/script.js` uses `body[data-asset-base]` when generating some navigation assets.

Examples:

- root page: `<body data-asset-base="./assets/">`
- `en/` page: `<body data-asset-base="../assets/">`
- `news/` page: `<body data-asset-base="../assets/">`
- `en/news/` page: `<body data-asset-base="../../assets/">`

If `data-asset-base` is wrong, icons and some generated UI details will break.

### `data-home-link`

Article pages also use `body[data-home-link]` for the return link in the article navigation.

Examples:

- JP news page: `data-home-link="../index.html"`
- EN news page: `data-home-link="../index.html"`

This is set by the generator for article pages.

## Markdown Content Rules

Current Markdown rendering in `assets/js/article.js` supports:

- YAML-style front matter at the top of the file
- headings using `#` through `######`
- paragraphs
- unordered lists
- ordered lists
- inline code using backticks
- Markdown links
- Markdown images using `![alt](path)`
- bold using `**text**`
- italic using `*text*`
- fenced code blocks

### Front matter rules

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

Notes:

- `title` is used for the article page title
- `description` is used for the page meta description
- `summary` is used for the top-page news list item
- `slug` determines the generated article URL
- `translationKey` must match between JP and EN versions of the same article

Avoid assuming support for advanced Markdown features such as:

- tables
- nested lists with custom styling
- blockquotes with special formatting
- raw embedded HTML layouts

If you need richer article formatting, confirm that `article.js` supports it before relying on it.

## Design and Content Conventions

Current conventions in this repo:

- keep the site relatively simple and content-focused
- do not reintroduce removed template-only footer branding
- keep JP and EN structures parallel where possible
- for unfinished areas, leaving the section in place with placeholder text is acceptable
- avoid adding entirely new layout systems unless necessary

For article pages specifically:

- do not add a separate "Back" content section in the main article body
- use the existing article navigation/sidebar model

## Recommended Workflow for Adding a News Article

1. Create the Japanese Markdown file in `content/ja/news/<slug>.md`.
2. Create the English Markdown file in `content/en/news/<slug>.md`.
3. Add the required front matter to both files.
4. Write the article body below the front matter.
5. Commit and push the Markdown changes.
6. Let GitHub Actions run `npm run build` and deploy the generated site.
7. Confirm that the deployed `index.html`, `en/index.html`, `news/<slug>.html`, and `en/news/<slug>.html` were updated correctly.
8. Confirm JP and EN pages link to each other correctly.

For local preview, you can still run `npm run generate:news` manually before pushing.

## Recommended Workflow for Creating Any New Page

1. For normal content pages, start by copying the closest existing page in the same directory depth.
2. Update the `<html lang="...">` value.
3. Fix all CSS, JS, image, and icon relative paths.
4. Set the correct `body[data-asset-base]`.
5. If it is a generated article page, edit `article-page.template.html` or `generate-news.mjs` instead of editing the output file directly.
6. Update language switch links when working on non-generated pages.
7. Check that JP and EN counterparts point to each other correctly.
8. Verify the page both visually and structurally after editing.

## Quick Verification Checklist

After editing, verify these points:

- the page loads without broken CSS or missing images
- navigation still appears
- top-page section links still scroll correctly
- dropdown tabs still match their content
- the language switch points to the correct counterpart
- article Markdown loads correctly
- fallback content still exists when needed
- no relative path was broken by the file's directory depth

## Useful Instructions to Give an AI Editor

These prompts work well for this repository:

- "Update the copy only. Do not change the HTML structure."
- "Keep Japanese and English pages in sync."
- "Do not change section IDs, classes, or data attributes unless necessary."
- "Preserve relative paths and `data-asset-base`."
- "Add the JP and EN Markdown files and let GitHub Actions generate the news pages."
- "Do not manually edit generated news HTML."

## Current Status Notes

As of the current site state:

- both JP and EN top pages exist
- both JP and EN news article pages exist
- article bodies and article metadata are stored in Markdown front matter plus body content
- top-page news items and article wrapper HTML are generated by `generate-news.mjs`
- GitHub Actions runs the generator during Pages deployment
- `Rules / Events / Groups` is still placeholder content
- `Contact` is still placeholder content

When updating this guide in the future, prefer describing the actual live repository structure rather than the original template's assumptions.
