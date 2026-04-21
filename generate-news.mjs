import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_NAME = "INC";
const TEMPLATE_PATH = path.join(__dirname, "article-page.template.html");
const RESOURCE_CATEGORIES_PATH = path.join(__dirname, "assets", "json", "resource-categories.json");

const NEWS_LANG_CONFIG = {
  ja: {
    contentDir: path.join(__dirname, "content", "ja", "news"),
    topPagePath: path.join(__dirname, "index.html"),
    articleDir: path.join(__dirname, "news"),
    markdownPrefix: "../content/ja/news",
    topArticlePrefix: "./news",
    assetBase: "../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "./assets/",
    topCtaLabel: "記事を読む",
  },
  en: {
    contentDir: path.join(__dirname, "content", "en", "news"),
    topPagePath: path.join(__dirname, "en", "index.html"),
    articleDir: path.join(__dirname, "en", "news"),
    markdownPrefix: "../../content/en/news",
    topArticlePrefix: "../news",
    assetBase: "../../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "../assets/",
    topCtaLabel: "Read article",
  },
};

const EVENT_LANG_CONFIG = {
  ja: {
    contentDir: path.join(__dirname, "content", "ja", "events"),
    topPagePath: path.join(__dirname, "index.html"),
    articleDir: path.join(__dirname, "events"),
    markdownPrefix: "../content/ja/events",
    topArticlePrefix: "./events",
    assetBase: "../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "./assets/",
    topCtaLabel: "詳細を見る",
  },
  en: {
    contentDir: path.join(__dirname, "content", "en", "events"),
    topPagePath: path.join(__dirname, "en", "index.html"),
    articleDir: path.join(__dirname, "en", "events"),
    markdownPrefix: "../../content/en/events",
    topArticlePrefix: "../events",
    assetBase: "../../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "../assets/",
    topCtaLabel: "Read more",
  },
};

const DOC_LANG_CONFIG = {
  ja: {
    contentDir: path.join(__dirname, "content", "ja", "docs"),
    topPagePath: path.join(__dirname, "resources", "index.html"),
    articleDir: path.join(__dirname, "docs"),
    markdownPrefix: "../content/ja/docs",
    topArticlePrefix: "../docs",
    assetBase: "../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "../assets/",
    topCtaLabel: "詳細を見る",
  },
  en: {
    contentDir: path.join(__dirname, "content", "en", "docs"),
    topPagePath: path.join(__dirname, "en", "resources", "index.html"),
    articleDir: path.join(__dirname, "en", "docs"),
    markdownPrefix: "../../content/en/docs",
    topArticlePrefix: "../docs",
    assetBase: "../../assets/",
    homeLink: "../",
    headerHomeLink: "../",
    topAssetPrefix: "../../assets/",
    topCtaLabel: "Read more",
  },
};

const REQUIRED_FIELDS = [
  "title",
  "date",
  "dateLabel",
  "description",
  "slug",
  "lang",
  "translationKey",
  "summary",
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeScriptText(value) {
  return String(value).replace(/<\/script/gi, "<\\/script");
}

async function loadResourceCategories() {
  try {
    const raw = await readFile(RESOURCE_CATEGORIES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : parsed.categories;
    if (Array.isArray(list)) {
      return list.filter((item) => item && item.id).map((item) => ({
        id: String(item.id),
        ja: String(item.ja || item.id),
        en: String(item.en || item.id),
      }));
    }
  } catch (error) {
    if (!error || error.code !== "ENOENT") {
      throw error;
    }
  }
  return [];
}

function categoryLabel(categories, id, lang) {
  const found = categories.find((item) => item.id === id);
  return found ? (found[lang] || found.id) : id;
}

function pageAssetPath(value, langConfig) {
  const image = String(value || "");
  if (image.startsWith("/assets/")) {
    return `${langConfig.topAssetPrefix}${image.slice("/assets/".length)}`;
  }
  return image;
}

function parseFrontMatter(rawMarkdown, filePath) {
  const normalized = rawMarkdown.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`Missing front matter in ${filePath}`);
  }

  const attributes = {};
  const lines = match[1].split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid front matter line "${line}" in ${filePath}`);
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (value === "true") {
      attributes[key] = true;
      return;
    }

    if (value === "false") {
      attributes[key] = false;
      return;
    }

    attributes[key] = value;
  });

  return {
    attributes,
    body: match[2].trim(),
  };
}

async function loadEntriesForConfig(lang, langConfig) {
  const { contentDir } = langConfig;
  let files = [];
  try {
    files = (await readdir(contentDir)).filter((file) => file.endsWith(".md"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const entries = [];

  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const rawMarkdown = await readFile(filePath, "utf8");
    const { attributes, body } = parseFrontMatter(rawMarkdown, filePath);

    REQUIRED_FIELDS.forEach((field) => {
      if (attributes[field] === undefined || attributes[field] === "") {
        throw new Error(`Missing "${field}" in ${filePath}`);
      }
    });

    if (attributes.lang !== lang) {
      throw new Error(
        `Front matter lang "${attributes.lang}" does not match folder language "${lang}" in ${filePath}`
      );
    }

    entries.push({
      ...attributes,
      draft: Boolean(attributes.draft),
      body,
      sourcePath: filePath,
    });
  }

  return entries;
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftOrder = Number.parseInt(left.order || "", 10);
    const rightOrder = Number.parseInt(right.order || "", 10);
    const leftHasOrder = Number.isFinite(leftOrder);
    const rightHasOrder = Number.isFinite(rightOrder);
    if (leftHasOrder || rightHasOrder) {
      if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      if (leftHasOrder !== rightHasOrder) {
        return leftHasOrder ? -1 : 1;
      }
    }

    const leftDate = new Date(left.date).getTime();
    const rightDate = new Date(right.date).getTime();

    if (Number.isNaN(leftDate) || Number.isNaN(rightDate)) {
      throw new Error("Invalid date in front matter.");
    }

    return rightDate - leftDate;
  });
}

function buildTranslationMap(entries) {
  const byKey = new Map();

  entries.forEach((entry) => {
    if (!byKey.has(entry.translationKey)) {
      byKey.set(entry.translationKey, {});
    }

    const current = byKey.get(entry.translationKey);
    current[entry.lang] = entry;
  });

  if (byKey.size === 0) {
    return byKey;
  }

  byKey.forEach((pair, translationKey) => {
    if (!pair.ja || !pair.en) {
      throw new Error(
        `Missing JP/EN pair for translationKey "${translationKey}".`
      );
    }
  });

  return byKey;
}

function renderNewsItem(entry, lang) {
  const { topArticlePrefix, topAssetPrefix, topCtaLabel } = NEWS_LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}`;

  return [
    '            <li class="news-item is-link" data-more="">',
    `              <div class="news-date">${escapeHtml(entry.dateLabel)}</div>`,
    '              <div class="news-text">',
    `                <div class="news-title">${escapeHtml(entry.summary)}</div>`,
    `                <a href="${href}" class="link">`,
    `                  ${topCtaLabel}<span class="ico"`,
    "                    ><svg viewBox=\"0 0 14 12\">",
    `                      <use xlink:href="${topAssetPrefix}images/ico/splite.svg#ico-link"></use></svg></span`,
    "                ></a>",
    "              </div>",
    "            </li>",
  ].join("\n");
}

const DEFAULT_THUMB_REL = "images/ico/grouplink_icon.png";

function renderEventItem(entry, lang) {
  const { topArticlePrefix, topAssetPrefix, topCtaLabel } = EVENT_LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}`;
  const imageSrc = entry.image
    ? pageAssetPath(entry.image, EVENT_LANG_CONFIG[lang])
    : `${topAssetPrefix}${DEFAULT_THUMB_REL}`;

  const lines = [
    '            <li class="event-card" data-more="">',
    `              <a href="${href}" class="event-card-inner">`,
    '                <div class="event-card-img">',
    `                  <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(entry.title)}" />`,
    "                </div>",
  ];

  lines.push(
    '                <div class="event-card-body">',
    `                  <div class="event-date">${escapeHtml(entry.dateLabel)}</div>`,
    `                  <h3 class="event-title">${escapeHtml(entry.title)}</h3>`,
    `                  <p class="event-desc">${escapeHtml(entry.summary)}</p>`,
    "                </div>",
    "              </a>",
    "            </li>"
  );

  return lines.join("\n");
}

function renderDocItem(entry, lang) {
  const { topArticlePrefix, topAssetPrefix } = DOC_LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}`;
  const imageSrc = entry.image
    ? pageAssetPath(entry.image, DOC_LANG_CONFIG[lang])
    : `${topAssetPrefix}${DEFAULT_THUMB_REL}`;
  const lines = [
    '            <li class="event-card resources-doc-card" data-more="">',
    `              <a href="${href}" class="event-card-inner">`,
    '                <div class="event-card-img">',
    `                  <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(entry.title)}" loading="lazy" />`,
    "                </div>",
  ];
  lines.push(
    '                <div class="event-card-body">',
    `                  <div class="event-date">${escapeHtml(entry.dateLabel)}</div>`,
    `                  <h3 class="event-title">${escapeHtml(entry.title)}</h3>`,
    `                  <p class="event-desc">${escapeHtml(entry.summary)}</p>`,
    "                </div>",
    "              </a>",
    "            </li>"
  );
  return lines.join("\n");
}

function articleTypeLabel(dirName, lang) {
  const labels = {
    news: { ja: "ニュース", en: "News" },
    events: { ja: "イベント", en: "Events" },
    docs: { ja: "ドキュメント", en: "Documentation" },
  };
  return (labels[dirName] && labels[dirName][lang]) || dirName;
}

function articleIndexHref(dirName, lang) {
  if (dirName === "news") {
    return lang === "en" ? "../#news" : "../#news";
  }
  if (dirName === "events") {
    return lang === "en" ? "../#events" : "../#events";
  }
  return "../resources/#documentation";
}

function renderArticleBreadcrumb(entry, dirName, categories) {
  const items = [
    { label: articleTypeLabel(dirName, entry.lang), href: articleIndexHref(dirName, entry.lang) },
  ];
  if (dirName === "docs" && entry.category) {
    items.push({
      label: categoryLabel(categories || [], entry.category, entry.lang),
      href: `../resources/#docs-${entry.category}`,
    });
  }
  items.push({ label: entry.title, href: `./${entry.slug}` });
  return [
    '<nav class="article-breadcrumb" aria-label="Article location">',
    items
      .map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`)
      .join('<span aria-hidden="true">/</span>'),
    "</nav>",
  ].join("");
}

async function loadDocEntriesForConfig(lang, langConfig) {
  const entries = await loadEntriesForConfig(lang, langConfig);
  for (const entry of entries) {
    if (!entry.category) {
      throw new Error(`Missing "category" in ${entry.sourcePath}`);
    }
  }
  return entries;
}

function renderDocCategoryGroup(category, entries, lang, categories) {
  const label = categoryLabel(categories, category, lang);
  const sorted = sortEntries(entries);
  const itemsMarkup = sorted.map((e) => renderDocItem(e, lang)).join("\n");
  return [
    `          <div class="resources-category-group" id="docs-${escapeHtml(category)}">`,
    `            <h3>${escapeHtml(label)}</h3>`,
    '          <ul class="resources-card-grid">',
    itemsMarkup,
    "          </ul>",
    "          </div>",
  ].join("\n");
}

function cleanupLegacyDocSections(page) {
  return page.replace(
    /\s*<section[\s\S]*?Generated by generate-news\.mjs \(docs:(?!documentation\))[\s\S]*?<\/section>/g,
    ""
  );
}

async function updateTopPageDocs(entries, lang, categories) {
  const { topPagePath } = DOC_LANG_CONFIG[lang];
  let page = cleanupLegacyDocSections(await readFile(topPagePath, "utf8"));

  const byCategory = new Map();
  for (const entry of entries) {
    const cat = entry.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(entry);
  }

  const categoryOrder = [
    ...categories.map((item) => item.id).filter((id) => byCategory.has(id)),
    ...[...byCategory.keys()].filter((id) => !categories.some((item) => item.id === id)),
  ];
  const groupsMarkup = categoryOrder
    .map((category) => renderDocCategoryGroup(category, byCategory.get(category), lang, categories))
    .join("\n");

  const openMarker = "Generated by generate-news.mjs (docs:documentation). Edit Markdown files instead.";
  const closeMarker = "Generated by generate-news.mjs (docs:documentation)";
  const pattern = new RegExp(
    `[ \\t]*<!-- ${openMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->[\\s\\S]*?<!-- /${closeMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} -->`
  );
  const replacement = [
    `          <!-- ${openMarker} -->`,
    groupsMarkup,
    `          <!-- /${closeMarker} -->`,
  ].join("\n");
  if (!pattern.test(page)) {
    throw new Error(`Could not find documentation marker in ${topPagePath}`);
  }
  page = page.replace(pattern, replacement);

  await writeFile(topPagePath, page, "utf8");
}

async function updateTopPageNews(entries, lang) {
  const { topPagePath } = NEWS_LANG_CONFIG[lang];
  const itemsMarkup = entries.map((entry) => renderNewsItem(entry, lang)).join("\n");
  const generatedMarkup = [
    "            <!-- Generated by generate-news.mjs. Edit Markdown files instead. -->",
    itemsMarkup,
    "            <!-- /Generated by generate-news.mjs -->",
  ].join("\n");
  const page = await readFile(topPagePath, "utf8");
  const listPattern = /<ul class="news-li-wrapp">[\s\S]*?<\/ul>/;
  if (!listPattern.test(page)) {
    throw new Error(`Could not find news list in ${topPagePath}`);
  }
  const updated = page.replace(
    listPattern,
    `<ul class="news-li-wrapp">\n${generatedMarkup}\n          </ul>`
  );

  await writeFile(topPagePath, updated, "utf8");
}

async function updateTopPageEvents(entries, lang) {
  const { topPagePath } = EVENT_LANG_CONFIG[lang];
  const itemsMarkup = entries.map((entry) => renderEventItem(entry, lang)).join("\n");
  const generatedMarkup = [
    "            <!-- Generated by generate-news.mjs (events). Edit Markdown files instead. -->",
    itemsMarkup,
    "            <!-- /Generated by generate-news.mjs (events) -->",
  ].join("\n");
  const page = await readFile(topPagePath, "utf8");
  const listPattern = /<ul class="event-grid">[\s\S]*?<\/ul>/;
  if (!listPattern.test(page)) {
    throw new Error(`Could not find event grid in ${topPagePath}`);
  }
  const updated = page.replace(
    listPattern,
    `<ul class="event-grid">\n${generatedMarkup}\n          </ul>`
  );

  await writeFile(topPagePath, updated, "utf8");
}

function renderArticlePage(entry, pair, template, dirName, langConfig, categories = []) {
  const isEnglish = entry.lang === "en";
  const counterpart = isEnglish ? pair.ja : pair.en;
  const pageTitle = `${entry.title} | ${SITE_NAME}`;
  const entryLangConfig = langConfig[entry.lang];

  const replacements = {
    LANG: entry.lang,
    PAGE_TITLE: escapeHtml(pageTitle),
    DESCRIPTION: escapeHtml(entry.description),
    ASSET_BASE: entryLangConfig.assetBase,
    MARKDOWN_SRC: `${entryLangConfig.markdownPrefix}/${entry.slug}.md`,
    HOME_LINK: entryLangConfig.homeLink,
    HEADER_HOME_LINK: entryLangConfig.headerHomeLink,
    JP_LINK: isEnglish
      ? `../../${dirName}/${pair.ja.slug}`
      : `../${dirName}/${entry.slug}`,
    EN_LINK: isEnglish
      ? `./${entry.slug}`
      : `../en/${dirName}/${counterpart.slug}`,
    ARTICLE_BREADCRUMB: renderArticleBreadcrumb(entry, dirName, categories),
    FALLBACK_MARKDOWN: escapeScriptText(entry.body),
  };

  return Object.entries(replacements).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value);
  }, template);
}

async function writeArticlePages(entries, translationMap, dirName, langConfig, template, categories = []) {
  for (const entry of entries) {
    const pair = translationMap.get(entry.translationKey);
    const outputPath = path.join(
      langConfig[entry.lang].articleDir,
      `${entry.slug}.html`
    );
    const html = renderArticlePage(entry, pair, template, dirName, langConfig, categories);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, "utf8");
  }
}

async function ensureArticleDirectories() {
  const dirs = new Set();
  [NEWS_LANG_CONFIG, EVENT_LANG_CONFIG, DOC_LANG_CONFIG].forEach((config) => {
    Object.values(config).forEach(({ articleDir }) => {
      dirs.add(articleDir);
    });
  });

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}

async function main() {
  const template = await readFile(TEMPLATE_PATH, "utf8");
  await ensureArticleDirectories();

  // Process news
  const newsAllEntries = [];
  for (const lang of Object.keys(NEWS_LANG_CONFIG)) {
    const entries = await loadEntriesForConfig(lang, NEWS_LANG_CONFIG[lang]);
    entries
      .filter((entry) => !entry.draft)
      .forEach((entry) => newsAllEntries.push(entry));
  }
  const newsTranslationMap = buildTranslationMap(newsAllEntries);
  for (const lang of Object.keys(NEWS_LANG_CONFIG)) {
    const languageEntries = sortEntries(
      newsAllEntries.filter((entry) => entry.lang === lang)
    );
    await updateTopPageNews(languageEntries, lang);
  }
  await writeArticlePages(newsAllEntries, newsTranslationMap, "news", NEWS_LANG_CONFIG, template);

  // Process events
  const eventAllEntries = [];
  for (const lang of Object.keys(EVENT_LANG_CONFIG)) {
    const entries = await loadEntriesForConfig(lang, EVENT_LANG_CONFIG[lang]);
    entries
      .filter((entry) => !entry.draft)
      .forEach((entry) => eventAllEntries.push(entry));
  }
  const eventTranslationMap = buildTranslationMap(eventAllEntries);
  for (const lang of Object.keys(EVENT_LANG_CONFIG)) {
    const languageEntries = sortEntries(
      eventAllEntries.filter((entry) => entry.lang === lang)
    );
    await updateTopPageEvents(languageEntries, lang);
  }
  await writeArticlePages(eventAllEntries, eventTranslationMap, "events", EVENT_LANG_CONFIG, template);

  // Process docs
  const resourceCategories = await loadResourceCategories();
  const docAllEntries = [];
  for (const lang of Object.keys(DOC_LANG_CONFIG)) {
    const entries = await loadDocEntriesForConfig(lang, DOC_LANG_CONFIG[lang]);
    entries
      .filter((entry) => !entry.draft)
      .forEach((entry) => docAllEntries.push(entry));
  }
  for (const lang of Object.keys(DOC_LANG_CONFIG)) {
    const languageEntries = docAllEntries.filter((entry) => entry.lang === lang);
    await updateTopPageDocs(languageEntries, lang, resourceCategories);
  }
  if (docAllEntries.length > 0) {
    const docTranslationMap = buildTranslationMap(docAllEntries);
    await writeArticlePages(docAllEntries, docTranslationMap, "docs", DOC_LANG_CONFIG, template, resourceCategories);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
