/* ============================================================
   motion.js — общий движок анимаций для всех кейсов портфолио.
   Правится ТОЛЬКО здесь, в кейсы разносится через sync.sh.

   Принцип: анимации ОБЪЯВЛЯЮТСЯ В РАЗМЕТКЕ через data-anim,
   а не пишутся отдельным куском JS на каждую секцию.
   Добавить новый эффект = одна строка в объекте ANIMS.

   Подключать ПОСЛЕ gsap.min.js и ScrollTrigger.min.js.
   Работает и без них (деградирует на IntersectionObserver).
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_GSAP = typeof window.gsap !== "undefined";
  var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Класс ставим только сейчас: до этой строки элементы видимы,
     поэтому упавший скрипт не оставит пустую страницу. */
  document.documentElement.classList.add("js-anim");

  if (HAS_GSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ----------------------------------------------------------
     1. Разбивка заголовков на слова для wipe-эффекта
     ---------------------------------------------------------- */
  function splitWords(el) {
    if (el.dataset.split === "done") return;
    var text = el.textContent;
    var base = parseInt(el.dataset.wdBase || "0", 10);
    var parts = text.split(/(\s+)/);
    var html = "";
    var i = 0;
    parts.forEach(function (p) {
      if (!p.trim()) { html += p; return; }
      html += '<span class="w-word" style="--wd:' + (base + i * 45) + 'ms">' +
              '<span class="w-inner">' + p + "</span></span>";
      i++;
    });
    /* Скринридер должен прочитать фразу целиком, а не по словам */
    el.setAttribute("aria-label", text.trim());
    el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll(".w-word"), function (w) {
      w.setAttribute("aria-hidden", "true");
    });
    el.dataset.split = "done";
  }

  document.querySelectorAll('[data-anim="wipe"]').forEach(splitWords);

  /* Переключатель языка переписывает textContent и стирает разбивку.
     Кейс сообщает о смене языка событием, здесь пересобираем.
     Класс .in не снимаем: текст уже был на экране, прятать его
     заново при смене языка было бы дёрганьем. */
  document.addEventListener("lang:changed", function () {
    document.querySelectorAll('[data-anim="wipe"]').forEach(function (el) {
      el.dataset.split = "";
      splitWords(el);
      el.classList.add("in");
    });
  });

  /* ----------------------------------------------------------
     2. Появление при скролле
     ---------------------------------------------------------- */
  var targets = document.querySelectorAll("[data-anim]");

  function showAll() {
    targets.forEach(function (el) { el.classList.add("in"); });
  }

  if (REDUCED || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (el) { io.observe(el); });

    /* Страховка: что бы ни случилось, через 2.5 с всё видно */
    setTimeout(showAll, 2500);
  }

  /* ----------------------------------------------------------
     3. Параллакс на скролле (только с GSAP)
     ---------------------------------------------------------- */
  if (HAS_GSAP && window.ScrollTrigger && !REDUCED) {
    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var amount = parseFloat(el.dataset.parallax) || -12;
      gsap.to(el, {
        yPercent: amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  /* ----------------------------------------------------------
     4. Магнитные элементы
     Один слушатель на документ, rect кэшируется: вызывать
     getBoundingClientRect() на каждый pointermove = reflow 60 раз в секунду.
     ---------------------------------------------------------- */
  if (FINE_POINTER && !REDUCED) {
    var magnets = Array.prototype.slice.call(document.querySelectorAll(".magnetic"));
    if (magnets.length) {
      var rects = [];
      var RADIUS = 110;
      var PULL = 0.32;

      function measure() {
        rects = magnets.map(function (el) {
          var r = el.getBoundingClientRect();
          return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
        });
      }
      measure();
      window.addEventListener("resize", measure, { passive: true });
      window.addEventListener("scroll", measure, { passive: true });

      document.addEventListener("pointermove", function (e) {
        for (var i = 0; i < magnets.length; i++) {
          var r = rects[i];
          if (!r) continue;
          var dx = e.clientX - r.cx;
          var dy = e.clientY - r.cy;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < RADIUS) {
            var f = (1 - d / RADIUS) * PULL;
            magnets[i].style.setProperty("--mx", (dx * f).toFixed(1) + "px");
            magnets[i].style.setProperty("--my", (dy * f).toFixed(1) + "px");
          } else {
            magnets[i].style.setProperty("--mx", "0px");
            magnets[i].style.setProperty("--my", "0px");
          }
        }
      }, { passive: true });
    }
  }

  /* ----------------------------------------------------------
     5. Нижний док
     Два наблюдателя, два флага, одна функция синхронизации.
     Док вылезает после первого экрана и прячется у формы.
     ---------------------------------------------------------- */
  (function dock() {
    var dockEl = document.querySelector("[data-dock]");
    var first = document.querySelector("[data-dock-after]");
    var stops = document.querySelectorAll("[data-dock-stop]");
    if (!dockEl || !first || !("IntersectionObserver" in window)) return;

    var past = false;
    /* Зон, где док должен молчать, может быть несколько: секция с ценами
       и финальный экран. Держим флаг на каждую, состояние в памяти. */
    var stopList = Array.prototype.slice.call(stops);
    var seen = stopList.map(function () { return false; });

    function anyStopVisible() {
      for (var i = 0; i < seen.length; i++) if (seen[i]) return true;
      return false;
    }
    function sync() { dockEl.classList.toggle("up", past && !anyStopVisible()); }

    new IntersectionObserver(function (e) {
      past = !e[0].isIntersecting;
      sync();
    }, { threshold: 0, rootMargin: "-45% 0px 0px 0px" }).observe(first);

    if (stopList.length) {
      var stopIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var i = stopList.indexOf(e.target);
          if (i !== -1) seen[i] = e.isIntersecting;
        });
        sync();
      }, { threshold: 0.12 });
      stopList.forEach(function (s) { stopIO.observe(s); });
    }
  })();

  /* ----------------------------------------------------------
     6. Подвал, выезжающий из-под страницы
     Распорка-близнец удлиняет документ ровно на высоту подвала.
     ---------------------------------------------------------- */
  (function footerReveal() {
    var twin = document.querySelector(".footer-twin");
    var foot = document.querySelector(".site-footer");
    var page = document.querySelector(".page-wrap");
    if (!twin || !foot || !page || !("IntersectionObserver" in window)) return;

    function setHeight() { twin.style.height = foot.offsetHeight + "px"; }
    setHeight();
    if ("ResizeObserver" in window) new ResizeObserver(setHeight).observe(foot);
    else window.addEventListener("resize", setHeight, { passive: true });

    if (REDUCED) return;
    new IntersectionObserver(function (e) {
      page.classList.toggle("lifted", e[0].intersectionRatio > 0.02);
    }, { threshold: [0, 0.02, 0.5, 1] }).observe(twin);
  })();

  /* ----------------------------------------------------------
     7. Смена темы страницы по секции
     Каждая секция объявляет свою тему через data-theme, наблюдатель
     переносит её на <html>, чтобы шапка, док и фон подстроились.
     rootMargin сжимает зону срабатывания до узкой полосы по центру:
     тема меняется когда секция реально в фокусе, а не когда край показался.
     ---------------------------------------------------------- */
  (function themeSwitch() {
    /* Ищем ТОЛЬКО внутри body: сам <html> тоже несёт data-theme
       (это активная тема страницы), и попади он в наблюдение,
       получился бы цикл — он всегда пересекает экран. */
    var sections = document.body.querySelectorAll("[data-theme]");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var meta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(name, el) {
      if (document.documentElement.dataset.theme === name) return;
      document.documentElement.dataset.theme = name;
      /* Полоса браузера на iOS тоже должна догонять фон */
      if (meta) {
        var bg = getComputedStyle(el).backgroundColor;
        if (bg) meta.setAttribute("content", bg);
      }
    }

    applyTheme(sections[0].dataset.theme, sections[0]);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) applyTheme(e.target.dataset.theme, e.target);
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  })();

  /* ----------------------------------------------------------
     8. Word-ticker в финальном CTA
     ---------------------------------------------------------- */
  (function ticker() {
    document.querySelectorAll(".ticker").forEach(function (t) {
      var words = t.querySelectorAll("span");
      if (words.length < 2) return;
      var i = 0;
      words[0].classList.add("on");
      if (REDUCED) return;
      setInterval(function () {
        words[i].classList.remove("on");
        i = (i + 1) % words.length;
        words[i].classList.add("on");
      }, 2200);
    });
  })();
})();
