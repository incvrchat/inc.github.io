(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // @@@ 大学ロゴを違う要素に複製する
    const targetLogo = document.querySelector(".logo-university img");
    const targetLogoPcImg = document.querySelector(".logo-university-pc img");
    const src = targetLogo.getAttribute("src");
    if (targetLogo) {
      targetLogoPcImg.setAttribute("src", src);
    }

    // @@@@ コンテンツのセクションを見てグローバルナビに項目を生成
    const globalNav = document.getElementById("nav-list");
    const sections = document.querySelectorAll("section");
    const dropLists = document.querySelectorAll(".tab-wrapp div");
    function createGlobalNav() {
      const navList = document.createElement("ul");
      sections.forEach((section, index) => {
        const sectionTitle = section.getAttribute("data-title");
        const sectionUniqeClass = section.getAttribute("data-class");
        const sectionIsAccordion = section.getAttribute("data-accordion");

        const navItem = document.createElement("li");
        navItem.classList.add(sectionUniqeClass, sectionIsAccordion);
        const link = document.createElement("a");
        link.href = `#${section.id}`;
        link.textContent = sectionTitle;

        if (sectionIsAccordion === "nav-drop") {
          const dropDiv = document.createElement("div");
          dropDiv.classList.add("nav-drop-main");
          dropDiv.appendChild(link);

          const dropdownImg = document.createElement("div");
          dropdownImg.innerHTML =
            '<img src="./assets/images/ico/no-farames/ico-dropdown.svg">';

          const ul = document.createElement("ul");

          navItem.appendChild(dropDiv);
          dropDiv.appendChild(dropdownImg);
          navItem.appendChild(ul);
        } else {
          navItem.appendChild(link);
        }

        navList.appendChild(navItem);
      });

      globalNav.appendChild(navList);
    }

    createGlobalNav();

    const hashTarget = document.querySelector(".nav-drop-main a");
    const hash = hashTarget.getAttribute("href");

    dropLists.forEach((dropList, index) => {
      const accordionWrapp = document.querySelector(".nav-drop ul");
      const acoItem = document.createElement("li");
      const acoHref = document.createElement("a");
      acoHref.href = hash;
      acoHref.textContent = dropList.getAttribute("data-index");
      acoItem.setAttribute("data-slide", index + 1);
      acoItem.appendChild(acoHref);
      accordionWrapp.appendChild(acoItem);
    });

    // @@@@@ windowリサイズ時にリロードをさせる
    const breakPoint = 769;
    let resizeFlag;
    window.addEventListener(
      "load",
      () => {
        if (breakPoint < window.innerWidth) {
          resizeFlag = false;
        } else {
          resizeFlag = true;
        }
        resizeWindow();
      },
      false
    );
    const resizeWindow = () => {
      window.addEventListener(
        "resize",
        () => {
          if (breakPoint < window.innerWidth && resizeFlag) {
            window.location.reload();
            resizeFlag = false;
          } else if (breakPoint >= window.innerWidth && !resizeFlag) {
            resizeFlag = true;
          }
        },
        false
      );
    };

    // バーガーメニュー
    const trigger = document.getElementById("burger");
    const nav = document.getElementById("g-nav");
    const navInner = document.querySelector(".nav-inner");
    const closeTrigger = document.querySelectorAll("[data-close]");
    const lay = document.querySelector(".overlay");
    const body = document.body;
    let isOpen = false;

    trigger.addEventListener("click", toggleMenu, false);

    function toggleMenu() {
      isOpen = !isOpen;
      if (isOpen) {
        openMenu();
      } else {
        closeMenu();
      }
    }

    function wait() {
      body.classList.add("wait");
    }
    function able() {
      body.classList.remove("wait");
    }

    function setDisplay() {
      return new Promise((resolve) => {
        nav.style.display = "block";
        resolve();
      });
    }

    function fadeIn() {
      return new Promise((resolve) => {
        lay.style.opacity = 1;
        lay.addEventListener("transitionend", resolve, { once: true });
      });
    }

    function moveHorizontally() {
      return new Promise((resolve) => {
        navInner.style.transition = navInner.style.transform =
          "translate3d(0, 0, 0)";
        navInner.addEventListener("transitionend", resolve, { once: true });
      });
    }

    function moveNavInner() {
      return new Promise((resolve) => {
        navInner.style.transform = "translate3d(100%, 0, 0)";
        navInner.addEventListener("transitionend", resolve, { once: true });
      });
    }

    function fadeOutLay() {
      return new Promise((resolve) => {
        lay.style.opacity = 0;
        lay.addEventListener("transitionend", resolve, { once: true });
      });
    }

    function setNavDisplayNone() {
      nav.style.display = "none";
      return Promise.resolve();
    }

    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function openMenu() {
      isOpen = true;
      body.style.overflow = "hidden";
      body.classList.add("nav-open");
      setDisplay()
        .then(wait)
        .then(() => delay(200))
        .then(fadeIn)
        .then(moveHorizontally)
        .then(() => {
          able();
        });
    }

    function closeMenu() {
      isOpen = false;
      body.style.overflow = null;
      body.classList.remove("nav-open");
      setDisplay()
        .then(wait)
        .then(moveNavInner)
        .then(fadeOutLay)
        .then(() => delay(200))
        .then(setNavDisplayNone)
        .then(() => {
          able();
        });
    }

    const spMenus = document.querySelectorAll(".nav-default a");
    const windowSm = 768;

    function closeMenuOnMobile() {
      if (window.innerWidth <= windowSm) {
        spMenus.forEach((spMenu, i) => {
          spMenu.addEventListener("click", function (event) {
            if (isOpen) {
              event.preventDefault();
              closeMenu();
            }
          });
        });
      }
    }
    window.addEventListener("resize", closeMenuOnMobile);
    window.addEventListener("load", closeMenuOnMobile);

    // @@@@ ナビゲーションをセクションのスクロールと連動させてカレントを付け替える
    // 基準点の準備
    var elemTop = [];

    // 現在地を取得するための設定を関数でまとめる
    function PositionCheck() {
      // headerの高さを取得
      var header = document.getElementById("header");
      var headerH = header.offsetHeight;

      // .scroll-pointクラスがついたエリアの位置を取得する設定
      var scrollPoints = document.querySelectorAll(".scroll-point");
      scrollPoints.forEach(function (point, i) {
        var rect = point.getBoundingClientRect();
        elemTop[i] = Math.round(rect.top + window.scrollY - headerH);
      });
    }

    // ナビゲーションに現在地のクラスをつけるための設定
    function ScrollAnime() {
      // スクロール値を取得
      var scroll = Math.round(window.scrollY);
      var navItems = document.querySelectorAll("#g-nav .nav-default");

      // 全てのナビゲーションの現在地クラスを除去
      navItems.forEach(function (item) {
        item.classList.remove("current");
      });

      for (var i = 0; i < elemTop.length - 1; i++) {
        if (scroll >= elemTop[i] && scroll < elemTop[i + 1]) {
          navItems[i].classList.add("current");
          break;
        }
      }
      if (scroll >= elemTop[elemTop.length - 1]) {
        navItems[elemTop.length - 1].classList.add("current");
      }
    }

    // ナビゲーションをクリックした際のスムーススクロール
    var navLinks = document.querySelectorAll("#g-nav a");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        var elmHash = this.getAttribute("href");
        var header = document.getElementById("header");
        var headerH = header.offsetHeight;
        var pos = Math.round(
          document.querySelector(elmHash).getBoundingClientRect().top +
            window.scrollY -
            headerH
        );
        window.scrollTo({
          top: pos,
          behavior: "smooth",
        });
      });
    });

    window.addEventListener("scroll", function () {
      ScrollAnime();
    });
    setTimeout(() => {
      PositionCheck();
    }, 400);

    ScrollAnime();

    window.addEventListener("resize", function () {
      PositionCheck();
    });

    // @@@@@ アコーディオン
    const accordionButtons = document.querySelectorAll(".nav-drop-main");

    accordionButtons.forEach((accordionBtn, index) => {
      accordionBtn.addEventListener("click", (e) => {
        const parentLi = e.target.closest("li");
        const content = parentLi.querySelector("ul");
        const isOpen = parentLi.classList.toggle("is-active");
        if (isOpen) {
          content.style.height = "auto";
          const h = content.offsetHeight;
          content.style.height = "0";
          content.style.transition = "height 300ms";
          content.offsetHeight;
          content.style.height = h + "px";
        } else {
          content.style.height = "0";
        }
        accordionButtons.forEach((btn, i) => {
          if (i !== index) {
            btn.closest("li").classList.remove("is-active");
            btn.nextElementSibling.style.height = "0";
          }
        });
        const container = parentLi.closest(".scroll-control");
        if (container !== null) {
          container.classList.toggle("is-active", isOpen);
        }
      });
    });

    // @@@@ タブスライド
    var pvs;
    var tabLength = document.querySelectorAll(".mySwiper .swiper-slide").length;

    if (tabLength > 4) {
      pvs = "4.5";
    } else {
      pvs = tabLength;
    }

    var swiper = new Swiper(".mySwiper", {
      slidesPerView: pvs,
      watchSlidesProgress: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      on: {
        init: () => {
          const navLinks = document.querySelectorAll(".nav-drop ul li");
          navLinks.forEach((link) => {
            link.addEventListener("click", (event) => {
              event.preventDefault();
              const slideNumber = link.getAttribute("data-slide");
              swiper2.slideTo(slideNumber - 1);
            });
          });
          // moreボタン
        },
      },
    });
    var swiper2 = new Swiper(".mySwiper2", {
      spaceBetween: 10,
      autoHeight: true,
      simulateTouch: false,
      thumbs: {
        swiper: swiper,
      },
    });

    const num = 6;
    const swiperWrap = document.querySelectorAll(".swiper-slide");

    for (var i = 0; i < swiperWrap.length; i++) {
      const swiperItemLists = swiperWrap[i].querySelectorAll(
        ".swiper-slide ul li"
      );
      // listを一旦非表示
      for (var e = num; e < swiperItemLists.length; e++) {
        swiperItemLists[e].classList.add("is-hidden");
      }
    }
    const swiperBtns = document.querySelectorAll(".load-more");
    swiperBtns.forEach((swiperBtn, i) => {
      swiperBtn.addEventListener("click", () => {
        const wrap = swiperBtn.parentElement.querySelector("ul");
        const hiddenItems = wrap.querySelectorAll("li.is-hidden");
        for (var i = 0; i < num && i < hiddenItems.length; i++) {
          hiddenItems[i].classList.remove("is-hidden");
        }
        if (wrap.querySelectorAll("li.is-hidden").length === 0) {
          swiperBtn.style.display = "none";
        }
      });
    });

    setTimeout(() => {
      swiper2.update();
    }, 450);

    // function initSlideMoreButton(slideIndex) {
    //   const currentSlide = swiper2.slides[slideIndex];
    //   const loadMoreButton = currentSlide.querySelector(".load-more");
    //   const listItems = currentSlide.querySelectorAll(".list-item");
    //   const itemsToShow = 6;
    //   let currentItemIndex = itemsToShow;

    //   if (listItems.length <= itemsToShow) {
    //     loadMoreButton.style.display = "none";
    //   }

    //   function toggleListItems() {
    //     for (let i = 0; i < listItems.length; i++) {
    //       if (i < currentItemIndex) {
    //         listItems[i].style.display = "block";
    //       } else {
    //         listItems[i].style.display = "none";
    //       }
    //     }
    //   }

    //   toggleListItems();

    //   loadMoreButton.addEventListener("click", function () {
    //     currentItemIndex += itemsToShow;
    //     toggleListItems();
    //     if (currentItemIndex >= listItems.length) {
    //       loadMoreButton.style.display = "none";
    //     }
    //   });
    // }

    // initSlideMoreButton(0); // 初期化

    // initSlideMoreButton(swiper2.activeIndex);

    // function initSlideMoreButton(slideIndex) {
    //   const currentSlide = swiper2.slides[slideIndex];
    //   const loadMoreButton = currentSlide.querySelector(".load-more");
    //   const listItems = currentSlide.querySelectorAll(".list-item");
    //   const itemsToShow = 6; // 1回に表示するアイテム数
    //   let currentItemIndex = itemsToShow;

    //   if (listItems.length <= itemsToShow) {
    //     loadMoreButton.style.display = "none";
    //   }

    //   function toggleListItems() {
    //     for (let i = 0; i < listItems.length; i++) {
    //       if (i < currentItemIndex) {
    //         listItems[i].style.display = "block";
    //       } else {
    //         listItems[i].style.display = "none";
    //       }
    //     }
    //   }

    //   toggleListItems(); // 初期表示

    //   loadMoreButton.addEventListener("click", function () {
    //     currentItemIndex += itemsToShow;
    //     toggleListItems();
    //     if (currentItemIndex >= listItems.length) {
    //       loadMoreButton.style.display = "none";
    //     }
    //   });
    // }

    // @@@@ もっと見るボタン
    function setupMoreButton(sectionSelector, moreNum) {
      var section = document.querySelector(sectionSelector);
      var listItems = section.querySelectorAll("[data-more]");
      var listBtn = section.querySelector(".more-btn");

      for (var i = moreNum; i < listItems.length; i++) {
        listItems[i].classList.add("is-hidden");
      }

      listBtn.addEventListener("click", function () {
        var hiddenItems = section.querySelectorAll("[data-more].is-hidden");

        for (var i = 0; i < moreNum && i < hiddenItems.length; i++) {
          hiddenItems[i].classList.remove("is-hidden");
          hiddenItems[i].classList.add("is-visible");
          hiddenItems[i].style.display = "block";
          hiddenItems[i].style.opacity = 1;
        }

        if (section.querySelectorAll("[data-more].is-hidden").length === 0) {
          listBtn.style.display = "none";
        }
      });

      document.addEventListener("DOMContentLoaded", function () {
        var list = section.querySelectorAll(".list li").length;
        if (list < moreNum) {
          listBtn.classList.add("is-btn-hidden");
        }
      });
    }
    setupMoreButton("#news", 3);
    setupMoreButton("#member", 2);

    // @@@@@ メールのコピー
    const copyButton = document.getElementById("contact-btn");
    const tagText = document.getElementById("tagText");
    const message = document.getElementById("message");

    copyButton.addEventListener("click", () => {
      const tagValue = tagText.value;
      copyToClipboard(tagValue);
    });

    async function copyToClipboard(tagValue) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(tagValue);
        } else {
          document.execCommand("copy");
        }

        messageActive();
      } catch (error) {
        console.error("クリップボードへのコピーに失敗しました:", error);
      }
    }

    function messageActive() {
      message.classList.add("is-active");
      setTimeout(() => {
        message.classList.remove("is-active");
      }, 1600);
    }
  });
})();
