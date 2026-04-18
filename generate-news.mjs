import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_NAME = "INC";
const TEMPLATE_PATH = path.join(__dirname, "article-page.template.html");

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
    topCtaLabel: "記事を見る",
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

function renderEventItem(entry, lang) {
  const { topArticlePrefix, topAssetPrefix, topCtaLabel } = EVENT_LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}`;

  const lines = [
    '            <li class="event-card" data-more="">',
    `              <a href="${href}" class="event-card-inner">`,
  ];

  if (entry.image) {
    lines.push(
      '                <div class="event-card-img">',
      `                  <img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title)}" />`,
      "                </div>"
    );
  }

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
  const { topArticlePrefix, topCtaLabel } = DOC_LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}`;
  return [
    '            <li class="resources-card">',
    `              <h3>${escapeHtml(entry.title)}</h3>`,
    `              <p>${escapeHtml(entry.summary)}</p>`,
    `              <a href="${href}" class="resources-card-link">${topCtaLabel}</a>`,
    "            </li>",
  ].join("\n");
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

async function updateTopPageDocs(entries, lang) {
  const { topPagePath } = DOC_LANG_CONFIG[lang];
  let page = await readFile(topPagePath, "utf8");

  const byCategory = new Map();
  for (const entry of entries) {
    const cat = entry.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(entry);
  }

  for (const [category, catEntries] of byCategory) {
    const sorted = sortEntries(catEntries);
    const itemsMarkup = sorted.map((e) => renderDocItem(e, lang)).join("\n");
    const openMarker = `Generated by generate-news.mjs (docs:${category}). Edit Markdown files instead.`;
    const closeMarker = `Generated by generate-news.mjs (docs:${category})`;
    const replacement = [
          `<!-- ${openMarker} -->`,
          '          <ul class="resources-card-grid">',
          itemsMarkup,
          "          </ul>",
          `          <!-- /${closeMarker} -->`,
    ].join("\n");

    const escapedOpen = openMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedClose = closeMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `[ \\t]*<!-- ${escapedOpen} -->[\\s\\S]*?<!-- /${escapedClose} -->`
    );
    if (!pattern.test(page)) {
      throw new Error(
        `Could not find docs marker for category "${category}" in ${topPagePath}`
      );
    }
    page = page.replace(pattern, replacement);
  }

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

function renderArticlePage(entry, pair, template, dirName, langConfig) {
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
    FALLBACK_MARKDOWN: escapeScriptText(entry.body),
  };

  return Object.entries(replacements).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value);
  }, template);
}

async function writeArticlePages(entries, translationMap, dirName, langConfig, template) {
  for (const entry of entries) {
    const pair = translationMap.get(entry.translationKey);
    const outputPath = path.join(
      langConfig[entry.lang].articleDir,
      `${entry.slug}.html`
    );
    const html = renderArticlePage(entry, pair, template, dirName, langConfig);
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
  const docAllEntries = [];
  for (const lang of Object.keys(DOC_LANG_CONFIG)) {
    const entries = await loadDocEntriesForConfig(lang, DOC_LANG_CONFIG[lang]);
    entries
      .filter((entry) => !entry.draft)
      .forEach((entry) => docAllEntries.push(entry));
  }
  if (docAllEntries.length > 0) {
    const docTranslationMap = buildTranslationMap(docAllEntries);
    for (const lang of Object.keys(DOC_LANG_CONFIG)) {
      const languageEntries = docAllEntries.filter((entry) => entry.lang === lang);
      if (languageEntries.length > 0) {
        await updateTopPageDocs(languageEntries, lang);
      }
    }
    await writeArticlePages(docAllEntries, docTranslationMap, "docs", DOC_LANG_CONFIG, template);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
