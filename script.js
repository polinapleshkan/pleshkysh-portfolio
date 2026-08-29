/* Портфолио: живые превью кейсов + модалка «окно браузера» */
(function () {
  "use strict";

  // Фейковые адреса для строки браузера по каждому кейсу
  var URLS = {
    "pilates-studio/index.html": "harmony.studio",
    "buildpro/index.html": "buildpro.ru",
    "aesthetic-clinic/index.html": "lumea.ae",
    "real-estate/index.html": "meridianproperties.ae",
    "interior-studio/index.html": "fennwren.studio",
    "language-school/index.html": "lingway.school",
    "vibekotik/index.html": "vibekotik.ru"
  };

  var PREVIEW_W = 1280; // ширина, с которой рендерим десктоп-версию в превью

  /* ---- Живые мини-превью в карточках ---- */
  function buildPreview(frame) {
    var src = frame.getAttribute("data-preview");
    if (!src) return;
    var iframe = document.createElement("iframe");
    iframe.setAttribute("src", src);
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("loading", "lazy");
    frame.appendChild(iframe);

    function fit() {
      var scale = frame.clientWidth / PREVIEW_W;
      iframe.style.width = PREVIEW_W + "px";
      iframe.style.height = Math.ceil(frame.clientHeight / scale) + "px";
      iframe.style.transform = "scale(" + scale + ")";
    }
    fit();
    // пересчёт при ресайзе
    if (window.ResizeObserver) {
      new ResizeObserver(fit).observe(frame);
    } else {
      window.addEventListener("resize", fit);
    }
  }

  var frames = document.querySelectorAll(".thumb-frame[data-preview]");
  for (var i = 0; i < frames.length; i++) buildPreview(frames[i]);

  /* ---- Модалка «окно браузера» ---- */
  var viewer = document.getElementById("viewer");
  var frame = document.getElementById("viewer-frame");
  var urlEl = document.getElementById("viewer-url");
  var lastFocus = null;

  function openCase(path) {
    lastFocus = document.activeElement;
    urlEl.textContent = URLS[path] || "preview";
    frame.setAttribute("src", path); // грузим сайт только сейчас
    viewer.hidden = false;
    document.body.classList.add("viewer-open");
    document.getElementById("viewer-close").focus();
  }

  function closeCase() {
    viewer.hidden = true;
    document.body.classList.remove("viewer-open");
    frame.setAttribute("src", "about:blank"); // выгружаем, чтобы не жрал ресурсы
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  var cases = document.querySelectorAll(".case.is-live");
  for (var c = 0; c < cases.length; c++) {
    (function (el) {
      var path = el.getAttribute("data-case");
      el.addEventListener("click", function () { openCase(path); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCase(path); }
      });
    })(cases[c]);
  }

  var closers = viewer.querySelectorAll("[data-close]");
  for (var k = 0; k < closers.length; k++) closers[k].addEventListener("click", closeCase);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !viewer.hidden) closeCase();
  });
})();
