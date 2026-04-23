(() => {
  "use strict";

  function escapeAttribute(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const IMAGE_MARKDOWN_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)(?:\{([^}]*)\})?/g;

  function normalizeCssSize(value) {
    const size = String(value || "").trim();
    if (!size || size.toLowerCase() === "auto") {
      return "";
    }
    if (/^\d+(?:\.\d+)?$/.test(size)) {
      return `${size}px`;
    }
    if (/^\d+(?:\.\d+)?(?:px|%|rem|em|vw|vh)$/.test(size)) {
      return size;
    }
    return "";
  }

  function parseImageTarget(rawTarget) {
    const target = String(rawTarget || "").trim();
    const sizeMatch = target.match(
      /^(.*?)\s+=([0-9.]+(?:px|%|rem|em|vw|vh)?)?x([0-9.]+(?:px|%|rem|em|vw|vh)?)?$/
    );

    if (!sizeMatch) {
      return {
        src: target,
        width: "",
        height: "",
      };
    }

    return {
      src: sizeMatch[1].trim(),
      width: normalizeCssSize(sizeMatch[2]),
      height: normalizeCssSize(sizeMatch[3]),
    };
  }

  function parseImageAttributes(rawAttributes) {
    const options = {
      width: "",
      height: "",
    };

    String(rawAttributes || "")
      .trim()
      .split(/\s+/)
      .forEach((attribute) => {
        const match = attribute.match(/^(width|height|w|h)=["']?([^"']+)["']?$/i);
        if (!match) {
          return;
        }

        const key = match[1].toLowerCase();
        const value = normalizeCssSize(match[2]);
        if (!value) {
          return;
        }

        if (key === "width" || key === "w") {
          options.width = value;
        } else {
          options.height = value;
        }
      });

    return options;
  }

  function renderImage(alt, rawTarget, rawAttributes) {
    const target = parseImageTarget(rawTarget);
    const attributes = parseImageAttributes(rawAttributes);
    const width = attributes.width || target.width;
    const height = attributes.height || target.height;
    const style = [
      width ? `--article-image-width:${width}` : "",
      height ? `--article-image-height:${height}` : "",
    ]
      .filter(Boolean)
      .join(";");
    const styleAttribute = style ? ` style="${escapeAttribute(style)}"` : "";
    if (/\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i.test(target.src)) {
      return [
        `<span class="article-video"${styleAttribute}>`,
        `<video controls playsinline preload="metadata" src="${escapeAttribute(
          target.src
        )}"></video>`,
        "</span>",
      ].join("");
    }

    return [
      `<span class="article-image"${styleAttribute}>`,
      `<img src="${escapeAttribute(target.src)}" alt="${escapeAttribute(
        alt
      )}" loading="lazy" />`,
      "</span>",
    ].join("");
  }

  function parseImageOnlyLine(line) {
    const trimmed = line.trim();
    const images = [];
    let cursor = 0;
    let match;

    IMAGE_MARKDOWN_PATTERN.lastIndex = 0;
    while ((match = IMAGE_MARKDOWN_PATTERN.exec(trimmed))) {
      const separator = trimmed.slice(cursor, match.index).trim();
      if (separator && separator !== "|") {
        return [];
      }

      images.push(renderImage(match[1], match[2], match[3]));
      cursor = IMAGE_MARKDOWN_PATTERN.lastIndex;
    }

    const tail = trimmed.slice(cursor).trim();
    if (tail || !images.length) {
      return [];
    }

    return images;
  }

  function renderImageGroup(images) {
    if (images.length === 1) {
      return images[0];
    }

    return `<div class="article-image-row">${images.join("")}</div>`;
  }

  function isImageRowFence(line) {
    return /^:::\s*(?:images?|image-row|gallery)\s*$/i.test(line.trim());
  }

  function renderInline(text) {
    let html = escapeHtml(text);
    html = html.replace(
      IMAGE_MARKDOWN_PATTERN,
      (_, alt, src, attributes) => renderImage(alt, src, attributes)
    );
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, href) =>
        `<a href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`
    );
    html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html;
  }

  function isHorizontalRule(line) {
    return /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line);
  }

  function isTableRow(line) {
    return line.includes("|") && !isHorizontalRule(line);
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    if (!isTableRow(line)) {
      return false;
    }
    return splitTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function renderTable(headerLine, separatorLine, bodyLines) {
    const headers = splitTableRow(headerLine);
    const aligns = splitTableRow(separatorLine).map((cell) => {
      const left = cell.startsWith(":");
      const right = cell.endsWith(":");
      if (left && right) return "center";
      if (right) return "right";
      if (left) return "left";
      return "";
    });
    const rows = bodyLines.map(splitTableRow);

    const alignAttr = (index) =>
      aligns[index] ? ` style="text-align:${aligns[index]}"` : "";

    return [
      "<div class=\"article-table-wrap\"><table>",
      "<thead><tr>",
      headers
        .map((cell, index) => `<th${alignAttr(index)}>${renderInline(cell)}</th>`)
        .join(""),
      "</tr></thead>",
      "<tbody>",
      rows
        .map((row) =>
          `<tr>${headers
            .map((_, index) => `<td${alignAttr(index)}>${renderInline(row[index] || "")}</td>`)
            .join("")}</tr>`
        )
        .join(""),
      "</tbody>",
      "</table></div>",
    ].join("");
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const html = [];

    let paragraph = [];
    let listType = null;
    let listItems = [];
    let inCodeBlock = false;
    let codeLines = [];
    let quoteLines = [];

    function flushParagraph() {
      if (!paragraph.length) {
        return;
      }
      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }

    function flushList() {
      if (!listType) {
        return;
      }
      html.push(`<${listType}>`);
      listItems.forEach((item) => {
        html.push(`<li>${renderInline(item)}</li>`);
      });
      html.push(`</${listType}>`);
      listType = null;
      listItems = [];
    }

    function flushQuote() {
      if (!quoteLines.length) {
        return;
      }
      const inner = quoteLines
        .join("\n")
        .split(/\n{2,}/)
        .map((part) => `<p>${renderInline(part.trim()).replace(/\n/g, "<br>")}</p>`)
        .join("");
      html.push(`<blockquote>${inner}</blockquote>`);
      quoteLines = [];
    }

    function flushCodeBlock() {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
    }

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index];
      const line = rawLine.trimEnd();

      if (line.startsWith("```")) {
        flushParagraph();
        flushList();
        flushQuote();

        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(rawLine);
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        flushList();
        flushQuote();
        continue;
      }

      if (isHorizontalRule(line)) {
        flushParagraph();
        flushList();
        flushQuote();
        html.push("<hr />");
        continue;
      }

      if (isImageRowFence(line)) {
        flushParagraph();
        flushList();
        flushQuote();
        const images = [];
        index += 1;

        while (index < lines.length && !/^:::\s*$/.test(lines[index].trim())) {
          images.push(...parseImageOnlyLine(lines[index]));
          index += 1;
        }

        if (images.length) {
          html.push(renderImageGroup(images));
        }
        continue;
      }

      const imageOnlyLine = parseImageOnlyLine(line);
      if (imageOnlyLine.length) {
        flushParagraph();
        flushList();
        flushQuote();
        const images = [...imageOnlyLine];

        while (
          index + 1 < lines.length &&
          lines[index + 1].trim() &&
          parseImageOnlyLine(lines[index + 1]).length
        ) {
          index += 1;
          images.push(...parseImageOnlyLine(lines[index]));
        }

        html.push(renderImageGroup(images));
        continue;
      }

      if (isTableRow(line) && lines[index + 1] && isTableSeparator(lines[index + 1])) {
        flushParagraph();
        flushList();
        flushQuote();
        const separatorLine = lines[index + 1];
        const bodyLines = [];
        index += 2;
        while (index < lines.length && lines[index].trim() && isTableRow(lines[index])) {
          bodyLines.push(lines[index]);
          index += 1;
        }
        index -= 1;
        html.push(renderTable(line, separatorLine, bodyLines));
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        flushQuote();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        continue;
      }

      const quoteMatch = line.match(/^ {0,3}>\s?(.*)$/);
      if (quoteMatch) {
        flushParagraph();
        flushList();
        quoteLines.push(quoteMatch[1]);
        continue;
      }

      const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (unorderedMatch) {
        flushParagraph();
        flushQuote();
        if (listType && listType !== "ul") {
          flushList();
        }
        listType = "ul";
        listItems.push(unorderedMatch[1]);
        continue;
      }

      const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (orderedMatch) {
        flushParagraph();
        flushQuote();
        if (listType && listType !== "ol") {
          flushList();
        }
        listType = "ol";
        listItems.push(orderedMatch[1]);
        continue;
      }

      flushList();
      flushQuote();
      paragraph.push(line.trim());
    }

    flushParagraph();
    flushList();
    flushQuote();

    if (inCodeBlock) {
      flushCodeBlock();
    }

    return html.join("\n");
  }

  function getFallbackMarkdown() {
    const fallback = document.getElementById("article-markdown-fallback");
    return fallback ? fallback.textContent || "" : "";
  }

  function stripFrontMatter(markdown) {
    const normalized = markdown.replace(/\r\n?/g, "\n");
    const match = normalized.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
    return match ? match[1].trim() : normalized.trim();
  }

  function buildMenu(headings, navRoot, homeLink, homeLabel) {
    if (!navRoot) {
      return [];
    }

    const navList = document.createElement("ul");
    const trackedItems = [];

    const homeItem = document.createElement("li");
    homeItem.className = "nav-default";
    homeItem.innerHTML = `<a href="${homeLink}">${homeLabel}</a>`;
    navList.appendChild(homeItem);

    headings.forEach((heading) => {
      const item = document.createElement("li");
      item.className = "nav-default";
      const level = Number(heading.tagName.replace("H", ""));
      if (level) {
        item.classList.add(`article-nav-level-${level}`);
      }

      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      item.appendChild(link);
      navList.appendChild(item);

      trackedItems.push({
        item,
        heading,
      });
    });

    navRoot.innerHTML = "";
    navRoot.appendChild(navList);
    return trackedItems;
  }

  function setupMenuBehavior() {
    const trigger = document.getElementById("burger");
    const nav = document.getElementById("g-nav");
    const navInner = document.querySelector(".nav-inner");
    const overlay = document.querySelector(".overlay");
    const body = document.body;

    if (!trigger || !nav || !navInner || !overlay) {
      return {
        closeMenu: () => {},
        isMenuOpen: () => false,
      };
    }

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      body.style.overflow = "hidden";
      body.classList.add("nav-open");
      nav.style.display = "block";

      requestAnimationFrame(() => {
        overlay.style.opacity = 1;
        navInner.style.transform = "translate3d(0, 0, 0)";
      });
    }

    function closeMenu() {
      isOpen = false;
      body.style.overflow = "";
      body.classList.remove("nav-open");
      overlay.style.opacity = 0;
      navInner.style.transform = "translate3d(100%, 0, 0)";

      setTimeout(() => {
        if (window.innerWidth <= 768) {
          nav.style.display = "none";
        }
      }, 250);
    }

    trigger.addEventListener("click", () => {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener("click", closeMenu);

    function syncDesktopNav() {
      if (window.innerWidth >= 769) {
        nav.style.display = "block";
        navInner.style.transform = "translate3d(0, 0, 0)";
        overlay.style.opacity = 0;
        body.style.overflow = "";
        body.classList.remove("nav-open");
        isOpen = false;
      } else if (!isOpen) {
        nav.style.display = "none";
        navInner.style.transform = "translate3d(100%, 0, 0)";
        overlay.style.opacity = 0;
      }
    }

    window.addEventListener("resize", syncDesktopNav);
    window.addEventListener("load", syncDesktopNav);
    syncDesktopNav();

    return {
      closeMenu,
      isMenuOpen: () => isOpen,
    };
  }

  function setupSmoothScroll(menuController) {
    const links = document.querySelectorAll('#nav-list a[href^="#"]');

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        const target = document.querySelector(targetId);
        if (!target) {
          return;
        }

        event.preventDefault();
        const header = document.getElementById("header");
        const headerHeight = header ? header.offsetHeight : 0;
        const top =
          target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top,
          behavior: "smooth",
        });

        if (window.innerWidth <= 768 && menuController.isMenuOpen()) {
          menuController.closeMenu();
        }
      });
    });
  }

  function setupCurrentState(trackedItems) {
    if (!trackedItems.length) {
      return;
    }

    function updateCurrent() {
      const header = document.getElementById("header");
      const headerHeight = header ? header.offsetHeight : 0;
      const scroll = Math.round(window.scrollY + headerHeight + 10);
      let currentIndex = 0;

      trackedItems.forEach(({ heading }, index) => {
        if (heading.offsetTop <= scroll) {
          currentIndex = index;
        }
      });

      trackedItems.forEach(({ item }, index) => {
        item.classList.toggle("current", index === currentIndex);
      });
    }

    window.addEventListener("scroll", updateCurrent);
    window.addEventListener("resize", updateCurrent);
    updateCurrent();
  }

  function assignHeadingIds(articleRoot) {
    const headings = articleRoot.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading, index) => {
      heading.id = `article-section-${index + 1}`;
    });
    return Array.from(headings);
  }

  function syncPcLogo() {
    const spLogo = document.querySelector(".logo-university img");
    const pcLogo = document.querySelector(".logo-university-pc img");
    if (spLogo && pcLogo && !pcLogo.getAttribute("src")) {
      pcLogo.setAttribute("src", spLogo.getAttribute("src"));
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const body = document.body;
    const markdownSrc = body.dataset.markdownSrc;
    const homeLink = body.dataset.homeLink || "./";
    const homeLabel =
      document.documentElement.lang === "ja" ? "ホームへ戻る" : "Back to Home";
    const articleRoot = document.getElementById("article-content");
    const navRoot = document.getElementById("nav-list");

    if (!markdownSrc || !articleRoot || !navRoot) {
      return;
    }

    syncPcLogo();

    let markdown = "";

    try {
      const response = await fetch(markdownSrc);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown: ${response.status}`);
      }
      markdown = await response.text();
    } catch (error) {
      console.error(error);
      markdown = getFallbackMarkdown();
    }

    if (!markdown.trim()) {
      articleRoot.innerHTML =
        '<p class="article-error">記事の読み込みに失敗しました。</p>';
      return;
    }

    articleRoot.innerHTML = renderMarkdown(stripFrontMatter(markdown));

    const headings = assignHeadingIds(articleRoot);
    const trackedItems = buildMenu(headings, navRoot, homeLink, homeLabel);
    const menuController = setupMenuBehavior();
    setupSmoothScroll(menuController);
    setupCurrentState(trackedItems);
  });
})();
