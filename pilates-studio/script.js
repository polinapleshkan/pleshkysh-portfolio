/* Harmony — переключатель языка и подсветка активного пункта меню.
   Общие анимации живут в shared/motion.js и подключаются после этого файла. */
(function () {
  "use strict";

  var STORAGE_KEY = "harmony-lang";
  var supported = ["en", "ru"];

  function getInitialLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && supported.indexOf(saved) !== -1) return saved;
    } catch (e) { /* приватный режим, читать нельзя */ }
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return nav === "ru" ? "ru" : "en";
  }

  function applyLang(lang, notify) {
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll("[data-en]");
    for (var i = 0; i < nodes.length; i++) {
      var val = nodes[i].getAttribute("data-" + lang);
      if (val !== null) nodes[i].textContent = val;
    }

    var opts = document.querySelectorAll(".lang-opt");
    for (var j = 0; j < opts.length; j++) {
      opts[j].classList.toggle("active", opts[j].getAttribute("data-lang") === lang);
    }

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* игнорируем */ }

    /* Смена текста стирает разбивку заголовков на слова.
       Сообщаем движку, чтобы он пересобрал её. */
    if (notify) document.dispatchEvent(new CustomEvent("lang:changed"));
  }

  var current = getInitialLang();
  applyLang(current, false);

  var toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      current = current === "en" ? "ru" : "en";
      applyLang(current, true);
    });
  }

  var opts = document.querySelectorAll(".lang-opt");
  for (var k = 0; k < opts.length; k++) {
    opts[k].addEventListener("click", function (e) {
      e.stopPropagation();
      current = this.getAttribute("data-lang");
      applyLang(current, true);
    });
  }

  /* Подсветка пункта меню, соответствующего видимой секции */
  (function activeLink() {
    var links = document.querySelectorAll(".pill-nav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });

    /* Узкая полоса по центру экрана: пункт загорается, когда секция
       реально в фокусе внимания, а не когда её край показался. */
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

  /* Контакты в демо не кликабельны */
  var demoLinks = document.querySelectorAll('a[href="#!"]');
  for (var d = 0; d < demoLinks.length; d++) {
    demoLinks[d].addEventListener("click", function (e) { e.preventDefault(); });
  }
})();
