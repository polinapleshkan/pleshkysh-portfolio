/* BuildPro — gallery filter + steps carousel + hammer + lens + card stack + planks.
   Appearance-on-scroll and section themes live in shared/motion.js. classList "js"
   is still needed here: the hammer swing and plank scroll @keyframes in style.css
   are gated behind html.js (independent of shared/motion.js's own html.js-anim). */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---- Gallery filter ---- */
  var filterBtns = document.querySelectorAll(".gf-btn");
  var projects = document.querySelectorAll(".proj");
  var emptyMsg = document.querySelector(".gallery-empty");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
        var filter = btn.getAttribute("data-filter");
        var visibleCount = 0;
        projects.forEach(function (p) {
          var match = filter === "all" || p.getAttribute("data-cat") === filter;
          p.classList.toggle("is-hidden", !match);
          if (match) visibleCount++;
        });
        if (emptyMsg) emptyMsg.hidden = visibleCount > 0;
      });
    });
  }

  /* ---- Hammer hitting "Строим" (continuous loop, ~400ms after load) ---- */
  var hammerWrap = document.querySelector(".hammer-wrap");
  if (hammerWrap) {
    setTimeout(function () { hammerWrap.classList.add("play"); }, 400);
  }

  /* ---- Lens: magnifier that follows the cursor over the hero photo ---- */
  var lensTarget = document.getElementById("heroLens");
  if (lensTarget && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var lens = document.createElement("div");
    lens.className = "lens";
    lens.setAttribute("aria-hidden", "true");
    lensTarget.appendChild(lens);

    var ZOOM = 1.3;
    var SIZE = 170;
    var heroImgUrl = "url(assets/hero.jpg)";
    lens.style.backgroundImage = heroImgUrl;

    lensTarget.addEventListener("mousemove", function (e) {
      var rect = lensTarget.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      lens.classList.add("is-active");
      lens.style.left = (x - SIZE / 2) + "px";
      lens.style.top = (y - SIZE / 2) + "px";
      lens.style.backgroundSize = (rect.width * ZOOM) + "px " + (rect.height * ZOOM) + "px";
      lens.style.backgroundPosition = -(x * ZOOM - SIZE / 2) + "px " + -(y * ZOOM - SIZE / 2) + "px";
    });
    lensTarget.addEventListener("mouseleave", function () {
      lens.classList.remove("is-active");
    });
  }

  /* ---- Categories: Tinder-style swipeable card stack ---- */
  var catStack = document.getElementById("catStack");
  if (catStack) {
    var catCards = Array.prototype.slice.call(catStack.querySelectorAll("[data-cat-card]"));
    var catOrder = catCards.map(function (_, i) { return i; });

    function renderCatStack() {
      catOrder.forEach(function (cardIndex, pos) {
        var card = catCards[cardIndex];
        card.dataset.pos = pos;
        card.style.zIndex = catOrder.length - pos;
        card.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
      });
    }
    renderCatStack();

    function cycleNext() {
      catOrder.push(catOrder.shift());
      renderCatStack();
    }
    function cyclePrev() {
      catOrder.unshift(catOrder.pop());
      renderCatStack();
    }

    var catNextBtn = document.getElementById("catNext");
    var catPrevBtn = document.getElementById("catPrev");
    if (catNextBtn) catNextBtn.addEventListener("click", cycleNext);
    if (catPrevBtn) catPrevBtn.addEventListener("click", cyclePrev);

    var drag = null;
    var DRAG_THRESHOLD = 90;

    /* kill the browser's native image drag so it can't hijack the swipe */
    catStack.addEventListener("dragstart", function (e) { e.preventDefault(); });

    catStack.addEventListener("pointerdown", function (e) {
      var card = e.target.closest("[data-cat-card]");
      if (!card || card.dataset.pos !== "0") return;
      e.preventDefault();
      drag = { card: card, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
      card.classList.add("is-dragging");
      card.setPointerCapture(e.pointerId);
    });

    catStack.addEventListener("pointermove", function (e) {
      if (!drag) return;
      drag.dx = e.clientX - drag.startX;
      drag.dy = e.clientY - drag.startY;
      var rot = drag.dx / 20;
      drag.card.style.transform = "translate(" + drag.dx + "px," + drag.dy + "px) rotate(" + rot + "deg)";
      drag.card.style.opacity = String(1 - Math.min(Math.abs(drag.dx) / 400, 0.5));
    });

    function endDrag() {
      if (!drag) return;
      var card = drag.card;
      var dx = drag.dx;
      card.style.opacity = "";

      if (Math.abs(dx) > DRAG_THRESHOLD) {
        card.classList.add(dx > 0 ? "swipe-right" : "swipe-left");
        setTimeout(function () {
          card.classList.remove("swipe-left", "swipe-right");
          card.classList.add("is-dragging");
          card.style.transform = "";
          cycleNext();
          void card.offsetWidth; /* flush layout with transition disabled before re-enabling it */
          card.classList.remove("is-dragging");
        }, 260);
      } else {
        card.style.transform = "";
        card.classList.remove("is-dragging");
      }
      drag = null;
    }

    catStack.addEventListener("pointerup", endDrag);
    catStack.addEventListener("pointercancel", endDrag);
  }

  /* ---- Gallery wooden planks scrolling endlessly (some up, some down) ---- */
  var beams = document.getElementById("galleryBeams");
  if (beams) {
    var plankCount = window.innerWidth < 760 ? 5 : 9;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < plankCount; i++) {
      var plank = document.createElement("div");
      plank.className = "plank";

      var dur = 14 + Math.random() * 12;            /* 14-26s per loop, varied speeds */
      var up = i % 2 === 0;                          /* strictly alternate: up, down, up, down... */
      var bgx = plankCount > 1 ? (i / (plankCount - 1)) * 100 : 50; /* different slice per column */

      var track = document.createElement("div");
      track.className = "plank-track";
      track.style.cssText =
        "--dur:" + dur.toFixed(2) + "s;" +
        "--adir:" + (up ? "normal" : "reverse") + ";";

      /* 4 tiles, mirror-alternated, so the seam between copies is invisible */
      for (var t = 0; t < 4; t++) {
        var tile = document.createElement("div");
        tile.className = "wtile" + (t % 2 === 1 ? " flip" : "");
        tile.style.setProperty("--bgx", bgx.toFixed(1) + "%");
        track.appendChild(tile);
      }
      plank.appendChild(track);
      frag.appendChild(plank);
    }
    beams.appendChild(frag);
  }

  /* ---- Horizontal scroller nav (process steps) ---- */
  var scrollBtns = document.querySelectorAll("[data-scroll]");
  scrollBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-scroll"));
      var dir = parseInt(btn.getAttribute("data-dir"), 10) || 1;
      if (target) target.scrollBy({ left: dir * 280, behavior: "smooth" });
    });
  });

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
