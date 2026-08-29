/* Meridian Properties — search widget, off-plan scroller, drag-to-pan
   areas gallery, stat counters, pill-nav highlight. Appearance-on-scroll
   and section themes live in shared/motion.js. */
(function () {
  "use strict";

  /* ---- Hero search widget: Buy / Rent / Off-Plan tabs ---- */
  var searchTabs = document.querySelectorAll(".search-tab[data-search-mode]");
  var searchCount = document.querySelector(".search-count");
  function setSearchMode(mode) {
    searchTabs.forEach(function (b) {
      var active = b.getAttribute("data-search-mode") === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (searchCount) {
      var val = searchCount.getAttribute("data-count-" + mode);
      if (val) searchCount.textContent = val;
    }
  }
  if (searchTabs.length) {
    searchTabs.forEach(function (b) {
      b.addEventListener("click", function () { setSearchMode(b.getAttribute("data-search-mode")); });
    });
  }
  var searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) { e.preventDefault(); });
  }

  /* ---- Horizontal scroller nav (off-plan launches) ---- */
  var scrollBtns = document.querySelectorAll("[data-scroll]");
  scrollBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-scroll"));
      var dir = parseInt(btn.getAttribute("data-dir"), 10) || 1;
      if (target) target.scrollBy({ left: dir * 320, behavior: "smooth" });
    });
  });

  /* ---- Areas: click-and-drag horizontal pan (not scroll-snap buttons,
     a genuinely different feel from the off-plan scroller above) ---- */
  (function areasDrag() {
    var drag = document.getElementById("areasDrag");
    if (!drag) return;
    var isDown = false;
    var startX = 0;
    var startScroll = 0;
    var moved = false;

    drag.addEventListener("pointerdown", function (e) {
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = drag.scrollLeft;
      drag.classList.add("is-dragging");
      drag.setPointerCapture(e.pointerId);
    });
    drag.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      drag.scrollLeft = startScroll - dx;
    });
    function endDrag() {
      isDown = false;
      drag.classList.remove("is-dragging");
    }
    drag.addEventListener("pointerup", endDrag);
    drag.addEventListener("pointercancel", endDrag);
    drag.addEventListener("pointerleave", endDrag);
    /* a drag that moved the track shouldn't also fire a click on a tile */
    drag.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  })();

  /* ---- Trust stats count up from zero when they enter view ---- */
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
        return Math.round(val).toLocaleString("en-US");
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

  /* ---- Hero video: seamless loop via crossfade ----
     The clip is a short slow push-in toward the Burj Khalifa. Looping one
     element snaps hard back to the wide shot at the cut. Instead two copies of
     the SAME file alternate: shortly before the playing one ends, the other
     restarts from zero and the pair crossfades. Because both show identical
     footage, nothing unrelated can appear at the seam. */
  (function heroVideo() {
    var vids = Array.prototype.slice.call(document.querySelectorAll("[data-hero-video]"));
    if (vids.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var SPEED = 0.6;   /* slower than real time, so the push-in reads cinematic */
    var LEAD = 1.2;    /* media-seconds before the end to bring the other copy in */
    var active = 0;
    var swapping = false;

    function rate(v) { v.playbackRate = SPEED; }
    vids.forEach(function (v) {
      rate(v);
      v.addEventListener("loadedmetadata", function () { rate(v); });
      /* no loop attribute: if a swap is ever missed, restart rather than freeze */
      v.addEventListener("ended", function () { v.currentTime = 0; play(v); });
    });

    function play(v) {
      var p = v.play();
      if (p && typeof p.catch === "function") p.catch(function () { /* browser declined */ });
    }

    function swap() {
      if (swapping) return;
      swapping = true;
      var out = vids[active];
      var next = vids[active === 0 ? 1 : 0];
      next.currentTime = 0;
      rate(next);
      play(next);
      next.classList.add("is-on");
      out.classList.remove("is-on");
      active = active === 0 ? 1 : 0;
      /* park the outgoing copy once it has faded out, ready for its next turn */
      setTimeout(function () {
        out.pause();
        out.currentTime = 0;
        swapping = false;
      }, 1500);
    }

    vids.forEach(function (v) {
      v.addEventListener("timeupdate", function () {
        if (v !== vids[active] || !v.duration) return;
        if (v.duration - v.currentTime <= LEAD) swap();
      });
    });

    /* Play only while the hero is actually on screen: avoids decoding two
       video streams nobody is looking at, and keeps the browser from fighting
       us over background media. */
    var host = document.querySelector(".hero-bg");
    if (host && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) play(vids[active]);
          else vids.forEach(function (v) { if (!v.paused) v.pause(); });
        });
      }, { threshold: 0.05 }).observe(host);
    } else {
      play(vids[active]);
    }
  })();

  /* ---- Book a viewing: date/time picker ----
     Genuinely fresh interaction for this case (none of the other portfolio
     sites have a real booking widget). Days are computed from today so the
     dates are always live, not hardcoded and stale. */
  (function bookingWidget() {
    var daysEl = document.getElementById("bookDays");
    var slotsEl = document.getElementById("bookSlots");
    var summaryEl = document.getElementById("bookSummary");
    var confirmBtn = document.getElementById("bookConfirm");
    var successEl = document.getElementById("bookSuccess");
    var successLine = document.getElementById("bookSuccessLine");
    var widget = document.querySelector(".book-widget");
    if (!daysEl || !slotsEl) return;

    var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var HOURS = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

    var days = [];
    var today = new Date();
    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    var selectedDay = 0;
    var selectedSlot = null;

    function dayLabel(d) { return DOW[d.getDay()] + ", " + d.getDate() + " " + MONTH[d.getMonth()]; }

    function renderDays() {
      daysEl.innerHTML = "";
      days.forEach(function (d, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "book-day" + (i === selectedDay ? " is-active" : "");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", i === selectedDay ? "true" : "false");
        b.innerHTML = '<span class="book-day-dow">' + (i === 0 ? "Today" : DOW[d.getDay()]) + '</span><span class="book-day-num">' + d.getDate() + "</span>";
        b.addEventListener("click", function () {
          if (selectedDay === i) return;
          selectedDay = i;
          selectedSlot = null;
          renderDays();
          renderSlots();
          updateSummary();
        });
        daysEl.appendChild(b);
      });
    }

    function renderSlots() {
      slotsEl.innerHTML = "";
      /* a couple of slots per day read as already taken, so the calendar
         feels like a real one rather than infinitely open availability */
      var takenA = (selectedDay * 2) % HOURS.length;
      var takenB = (selectedDay * 2 + 3) % HOURS.length;

      HOURS.forEach(function (h, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "book-slot";
        b.textContent = h;
        var taken = i === takenA || i === takenB;
        if (taken) b.disabled = true;
        b.style.transitionDelay = (i * 35) + "ms";
        b.addEventListener("click", function () {
          selectedSlot = h;
          Array.prototype.forEach.call(slotsEl.children, function (c) { c.classList.remove("is-active"); });
          b.classList.add("is-active");
          updateSummary();
        });
        slotsEl.appendChild(b);
        /* stagger the reveal in on the next frame so the transition fires */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { b.classList.add("in"); });
        });
      });
    }

    function updateSummary() {
      if (selectedSlot) {
        summaryEl.textContent = dayLabel(days[selectedDay]) + " at " + selectedSlot + ".";
        confirmBtn.disabled = false;
      } else {
        summaryEl.textContent = "Select a day and a time above.";
        confirmBtn.disabled = true;
      }
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (!selectedSlot || !widget) return;
        successLine.textContent = "Booked for " + dayLabel(days[selectedDay]) + ", " + selectedSlot + ".";
        Array.prototype.forEach.call(widget.querySelectorAll(".book-days, .book-slots, .book-footer"), function (el) {
          el.hidden = true;
        });
        successEl.hidden = false;
      });
    }

    renderDays();
    renderSlots();
  })();

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
