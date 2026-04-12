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

  function renderInline(text) {
    let html = escapeHtml(text);
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (_, alt, src) =>
        `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(
          alt
        )}" loading="lazy" />`
    );
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html;
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const html = [];

    let paragraph = [];
    let listType = null;
    let listItems = [];
    let inCodeBlock = false;
    let codeLines = [];

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

    function flushCodeBlock() {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trimEnd();

      if (line.startsWith("```")) {
        flushParagraph();
        flushList();

        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLines = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(rawLine);
        return;
      }

      if (!line.trim()) {
        flushParagraph();
        flushList();
        return;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        return;
      }

      const unorderedMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (unorderedMatch) {
        flushParagraph();
        if (listType && listType !== "ul") {
          flushList();
        }
        listType = "ul";
        listItems.push(unorderedMatch[1]);
        return;
      }

      const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (orderedMatch) {
        flushParagraph();
        if (listType && listType !== "ol") {
          flushList();
        }
        listType = "ol";
        listItems.push(orderedMatch[1]);
        return;
      }

      flushList();
      paragraph.push(line.trim());
    });

    flushParagraph();
    flushList();

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
      if (heading.tagName === "H3") {
        item.classList.add("article-nav-child");
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
    const headings = articleRoot.querySelectorAll("h2, h3");
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
