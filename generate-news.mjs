import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_NAME = "INC";
const TEMPLATE_PATH = path.join(__dirname, "article-page.template.html");

const LANG_CONFIG = {
  ja: {
    contentDir: path.join(__dirname, "content", "ja", "news"),
    topPagePath: path.join(__dirname, "index.html"),
    articleDir: path.join(__dirname, "news"),
    markdownPrefix: "../content/ja/news",
    topArticlePrefix: "./news",
    assetBase: "../assets/",
    homeLink: "../index.html",
    headerHomeLink: "../index.html",
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
    homeLink: "../index.html",
    headerHomeLink: "../index.html",
    topAssetPrefix: "../assets/",
    topCtaLabel: "Read article",
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

async function loadEntriesForLanguage(lang) {
  const { contentDir } = LANG_CONFIG[lang];
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
  const { topArticlePrefix, topAssetPrefix, topCtaLabel } = LANG_CONFIG[lang];
  const href = `${topArticlePrefix}/${entry.slug}.html`;

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

async function updateTopPageNews(entries, lang) {
  const { topPagePath } = LANG_CONFIG[lang];
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

function renderArticlePage(entry, pair, template) {
  const isEnglish = entry.lang === "en";
  const counterpart = isEnglish ? pair.ja : pair.en;
  const pageTitle = `${entry.title} | ${SITE_NAME}`;
  const replacements = {
    LANG: entry.lang,
    PAGE_TITLE: escapeHtml(pageTitle),
    DESCRIPTION: escapeHtml(entry.description),
    ASSET_BASE: LANG_CONFIG[entry.lang].assetBase,
    MARKDOWN_SRC: `${LANG_CONFIG[entry.lang].markdownPrefix}/${entry.slug}.md`,
    HOME_LINK: LANG_CONFIG[entry.lang].homeLink,
    HEADER_HOME_LINK: LANG_CONFIG[entry.lang].headerHomeLink,
    JP_LINK: isEnglish
      ? `../../news/${pair.ja.slug}.html`
      : `../news/${entry.slug}.html`,
    EN_LINK: isEnglish
      ? `./${entry.slug}.html`
      : `../en/news/${counterpart.slug}.html`,
    FALLBACK_MARKDOWN: escapeScriptText(entry.body),
  };

  return Object.entries(replacements).reduce((html, [key, value]) => {
    return html.replaceAll(`{{${key}}}`, value);
  }, template);
}

async function writeArticlePages(entries, translationMap) {
  const template = await readFile(TEMPLATE_PATH, "utf8");

  for (const entry of entries) {
    const pair = translationMap.get(entry.translationKey);
    const outputPath = path.join(
      LANG_CONFIG[entry.lang].articleDir,
      `${entry.slug}.html`
    );
    const html = renderArticlePage(entry, pair, template);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html, "utf8");
  }
}

async function ensureArticleDirectories() {
  const dirs = new Set();
  Object.values(LANG_CONFIG).forEach((config) => {
    dirs.add(config.articleDir);
  });

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }
}

async function main() {
  const allEntries = [];

  for (const lang of Object.keys(LANG_CONFIG)) {
    const entries = await loadEntriesForLanguage(lang);
    entries
      .filter((entry) => !entry.draft)
      .forEach((entry) => allEntries.push(entry));
  }

  const translationMap = buildTranslationMap(allEntries);

  await ensureArticleDirectories();

  for (const lang of Object.keys(LANG_CONFIG)) {
    const languageEntries = sortEntries(
      allEntries.filter((entry) => entry.lang === lang)
    );
    await updateTopPageNews(languageEntries, lang);
    await writeArticlePages(languageEntries, translationMap);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
