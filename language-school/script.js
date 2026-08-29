/* Lingway — скроллеры, переключатели формата, форма, подсветка меню.
   Появление при скролле и тема секций живут в shared/motion.js. */
(function () {
  "use strict";

  /* ---- Horizontal scroller nav (goals) ---- */
  var scrollBtns = document.querySelectorAll("[data-scroll]");
  scrollBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-scroll"));
      var dir = parseInt(btn.getAttribute("data-dir"), 10) || 1;
      if (target) target.scrollBy({ left: dir * 230, behavior: "smooth" });
    });
  });

  /* ---- Schedule: online/offline toggle ---- */
  var modeBtns = document.querySelectorAll(".mode-btn[data-mode]");
  var slots = document.querySelectorAll(".slot[data-mode]");
  function setMode(mode) {
    modeBtns.forEach(function (b) {
      var active = b.getAttribute("data-mode") === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    slots.forEach(function (s) {
      s.classList.toggle("is-visible", s.getAttribute("data-mode") === mode);
    });
  }
  if (modeBtns.length) {
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
    });
    setMode("online");
  }

  /* ---- Pricing: online/offline price swap ---- */
  var priceBtns = document.querySelectorAll(".mode-btn[data-price-mode]");
  var priceNums = document.querySelectorAll(".price-num");
  function setPriceMode(mode) {
    priceBtns.forEach(function (b) {
      var active = b.getAttribute("data-price-mode") === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    priceNums.forEach(function (n) {
      var val = n.getAttribute("data-" + mode);
      if (val) n.textContent = val;
    });
  }
  if (priceBtns.length) {
    priceBtns.forEach(function (b) {
      b.addEventListener("click", function () { setPriceMode(b.getAttribute("data-price-mode")); });
    });
  }

  /* ---- Lead form: prevent the default GET-reload on this static demo ---- */
  var leadForm = document.getElementById("leadForm");
  if (leadForm) {
    leadForm.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  /* ---- Цифры статистики считаются вверх от нуля при появлении ---- */
  (function statCounters() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nums = document.querySelectorAll(".stat-num");
    if (!nums.length || reduce || !("IntersectionObserver" in window)) return;

    function animate(el) {
      var raw = el.textContent.trim();
      var suffix = raw.indexOf("+") !== -1 ? "+" : "";
      var digits = raw.replace(/[^\d.]/g, "");
      var isDecimal = digits.indexOf(".") !== -1;
      var target = parseFloat(digits);
      if (isNaN(target)) return;

      var dur = 1100;
      var start = null;
      function format(val) {
        if (isDecimal) return val.toFixed(1);
        return Math.round(val).toLocaleString("ru-RU");
      }
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = raw;
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animate(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---- Подсветка пункта пилюли-меню, соответствующего видимой секции ---- */
  (function activeLink() {
    var links = document.querySelectorAll(".pill-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("on"); });
        var a = map[e.target.id];
        if (a) a.classList.add("on");
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  })();
})();
