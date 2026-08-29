/* Fenn & Wren — pill-nav active-link highlight.
   Appearance-on-scroll, footer-reveal, section themes and the marquee's
   reduced-motion handling all live in shared/motion.css + motion.js. */
(function () {
  "use strict";

  /* ---- Pill-nav active-link highlight ---- */
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
