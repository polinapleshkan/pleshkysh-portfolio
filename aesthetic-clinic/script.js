/* Lumea — liquid metal, before/after gallery, carousels, pill-nav highlight.
   Appearance-on-scroll and section themes live in shared/motion.js. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- Liquid metal (hero) ---------- */
  var svg = document.querySelector(".liquid");
  var hero = document.querySelector(".hero");
  if (svg && hero && !reduce) {
    var VW = 900, VH = 700;
    var blobG = svg.querySelector(".liquid-blobs");
    var specG = svg.querySelector(".liquid-specs");
    /* lay blobs out on a spaced 3x3 grid so each floats in its own lane and never clumps */
    var N = 9, blobs = [];
    /* spread blobs across the whole hero (they float over the text too, by request) */
    var COLS = 3, ROWS = 3, xStart = VW * 0.06, xSpan = VW * 0.88, cellH = VH / ROWS, idx = 0;
    for (var gy = 0; gy < ROWS; gy++) {
      for (var gx = 0; gx < COLS && idx < N; gx++) {
        var r = 17 + Math.random() * 20;                       /* 17-37px, smaller max so neighbours don't touch */
        var b = {
          bx: xStart + xSpan * ((gx + 0.5) / COLS) + (Math.random() - 0.5) * (xSpan / COLS) * 0.28,
          by: cellH * (gy + 0.5) + (Math.random() - 0.5) * cellH * 0.28,
          r: r, ph: Math.random() * 6.28,
          spx: 0.35 + Math.random() * 0.4,
          spy: 0.3 + Math.random() * 0.4,
          ampx: 10 + Math.random() * 14,                        /* small drift: stays inside its cell */
          ampy: 10 + Math.random() * 14, x: 0, y: 0
        };
        b.x = b.bx; b.y = b.by;
        var c = document.createElementNS(NS, "circle"); c.setAttribute("r", r.toFixed(1)); blobG.appendChild(c); b.el = c;
        var sp = document.createElementNS(NS, "ellipse"); sp.setAttribute("rx", (r * 0.4).toFixed(1)); sp.setAttribute("ry", (r * 0.26).toFixed(1)); sp.setAttribute("fill", "url(#spec)"); specG.appendChild(sp); b.spec = sp;
        blobs.push(b);
        idx++;
      }
    }
    /* track cursor in viewBox coords; blobs FOLLOW it, but a separation pass keeps them apart */
    var mx = -999, my = -999, cursorOn = false;
    hero.addEventListener("pointermove", function (e) {
      var rc = svg.getBoundingClientRect();
      mx = (e.clientX - rc.left) / rc.width * VW;
      my = (e.clientY - rc.top) / rc.height * VH;
      cursorOn = true;
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { cursorOn = false; });

    var SEP_GAP = 16;       /* min empty space kept between any two blobs */
    var CURSOR_R = 170;     /* cursor only affects blobs within this radius (local reaction) */
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    var t = 0;
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      t += 0.016;

      /* 1) each blob floats on its own home orbit; the cursor only tugs blobs that are
            NEAR it (local, proximity-gated) so they react one by one as it passes,
            instead of all collecting at the cursor */
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var hx = b.bx + Math.cos(t * b.spx + b.ph) * b.ampx;
        var hy = b.by + Math.sin(t * b.spy + b.ph) * b.ampy;
        b.x += (hx - b.x) * 0.06;                   /* return to own orbit (dominant) */
        b.y += (hy - b.y) * 0.06;
        if (cursorOn) {
          var dx = mx - b.x, dy = my - b.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < CURSOR_R) {                        /* only nearby blobs feel it */
            var pull = (1 - d / CURSOR_R) * 0.16;    /* stronger the closer it is */
            b.x += dx * pull;
            b.y += dy * pull;
          }
        }
      }

      /* 2) separation: push apart any two blobs that get too close, so they never merge */
      for (var pass = 0; pass < 3; pass++) {
        for (var a = 0; a < blobs.length; a++) {
          for (var c = a + 1; c < blobs.length; c++) {
            var b1 = blobs[a], b2 = blobs[c];
            var dx = b1.x - b2.x, dy = b1.y - b2.y;
            var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
            var minD = b1.r + b2.r + SEP_GAP;
            if (d < minD) {
              var o = (minD - d) / 2, ux = dx / d, uy = dy / d;
              b1.x += ux * o; b1.y += uy * o;
              b2.x -= ux * o; b2.y -= uy * o;
            }
          }
        }
      }

      /* 3) write positions */
      for (var k = 0; k < blobs.length; k++) {
        var bb = blobs[k];
        bb.el.setAttribute("cx", bb.x.toFixed(1)); bb.el.setAttribute("cy", bb.y.toFixed(1));
        bb.spec.setAttribute("cx", (bb.x - bb.r * 0.24).toFixed(1)); bb.spec.setAttribute("cy", (bb.y - bb.r * 0.34).toFixed(1));
      }
    })();
  }

  /* ---------- Before / after sliders (multiple) ---------- */
  var bas = document.querySelectorAll(".ba");
  function setupBA(ba) {
    var before = ba.querySelector(".ba-before");
    var inner = before.querySelector(".ba-inner");
    var handle = ba.querySelector(".ba-handle");
    var dragging = false;
    function sizeInner() { inner.style.width = ba.clientWidth + "px"; }
    function setPct(p) { p = Math.max(0, Math.min(100, p)); before.style.width = p + "%"; handle.style.left = p + "%"; ba.setAttribute("aria-valuenow", Math.round(p)); }
    function pct(clientX) { var r = ba.getBoundingClientRect(); return ((clientX - r.left) / r.width) * 100; }
    sizeInner(); setPct(50);
    ba.addEventListener("pointerdown", function (e) { dragging = true; ba.setPointerCapture(e.pointerId); setPct(pct(e.clientX)); });
    ba.addEventListener("pointermove", function (e) { if (dragging) { e.preventDefault(); setPct(pct(e.clientX)); } });
    ba.addEventListener("pointerup", function () { dragging = false; });
    ba.addEventListener("pointercancel", function () { dragging = false; });
    ba.addEventListener("keydown", function (e) {
      var cur = parseFloat(ba.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft") { setPct(cur - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setPct(cur + 4); e.preventDefault(); }
    });
    window.addEventListener("resize", sizeInner);
  }
  for (var bi = 0; bi < bas.length; bi++) setupBA(bas[bi]);

  /* ---------- Carousel arrows ---------- */
  var cbtns = document.querySelectorAll(".cbtn");
  for (var k = 0; k < cbtns.length; k++) {
    cbtns[k].addEventListener("click", function () {
      var scroller = document.getElementById(this.getAttribute("data-scroll"));
      if (!scroller) return;
      var dir = parseFloat(this.getAttribute("data-dir")) || 1;
      var card = scroller.querySelector(".scroller-inner > *");
      var step = card ? card.getBoundingClientRect().width + 22 : 320;
      scroller.scrollBy({ left: dir * step, behavior: "smooth" });
    });
  }

  /* ---------- Demo links ---------- */
  var demo = document.querySelectorAll('a[href="#!"]');
  for (var d = 0; d < demo.length; d++) demo[d].addEventListener("click", function (e) { e.preventDefault(); });

  /* ---------- Pill-nav active-link highlight ---------- */
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
