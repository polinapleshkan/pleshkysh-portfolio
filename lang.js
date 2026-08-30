/* pleshkysh — переключатель языка для обёртки портфолио и страницы цен.
   Обычный текст переключается через data-en/data-ru (textContent).
   Бегущая строка ниш — отдельно: там текст вперемешку с разделителями
   ✦, textContent на весь узел не подходит, поэтому список ниш переведён
   тут же и подставляется через innerHTML при смене языка.
   Подключать ДО shared/motion.js — он слушает событие lang:changed,
   чтобы пересобрать wipe-заголовки после смены текста. */
(function () {
  "use strict";

  var STORAGE_KEY = "pleshkysh-lang";
  var supported = ["en", "ru"];

  var NICHES_RU = ["Пилатес", "Стройка", "Медицина", "Недвижимость", "Интерьеры", "Нейросети", "Рестораны", "Салоны красоты", "Юристы", "Фитнес", "Стоматология", "Психология", "Кофейни", "Автосервис", "Флористика", "Образование", "Турагентства", "Барбершопы", "Клининг", "Мода", "Кондитерские", "Фотографы", "Спа", "Финансы"];
  var NICHES_EN = ["Pilates", "Construction", "Medicine", "Real Estate", "Interiors", "AI Tools", "Restaurants", "Beauty Salons", "Lawyers", "Fitness", "Dentistry", "Psychology", "Coffee Shops", "Auto Service", "Florists", "Education", "Travel Agencies", "Barbershops", "Cleaning", "Fashion", "Bakeries", "Photographers", "Spa", "Finance"];

  function buildNichesHTML(list) {
    var html = "";
    for (var i = 0; i < list.length; i++) html += list[i] + "<i>✦</i>";
    return html;
  }

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

    var tracks = document.querySelectorAll(".niches-track span");
    if (tracks.length) {
      var html = buildNichesHTML(lang === "ru" ? NICHES_RU : NICHES_EN);
      for (var t = 0; t < tracks.length; t++) tracks[t].innerHTML = html;
    }

    var opts = document.querySelectorAll(".lang-opt");
    for (var j = 0; j < opts.length; j++) {
      opts[j].classList.toggle("active", opts[j].getAttribute("data-lang") === lang);
    }

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* игнорируем */ }

    /* Смена текста стирает разбивку wipe-заголовков на слова.
       Сообщаем движку в _shared/motion.js, чтобы он пересобрал её. */
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
})();
