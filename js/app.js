const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const bookmarks = () => store.get("ms-saves", []);
const ratings = () => store.get("ms-rates", {});

function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function streamById(id) {
  return STREAMS.find((item) => item.id === id);
}
function seriesById(id) {
  return SERIES.find((item) => item.id === id);
}
function filmById(id) {
  return FILMS.find((item) => item.id === id);
}
function filmsWithReaction() {
  return FILMS.filter((item) => item.reaction);
}
function hasFilmScore(score) {
  if (score == null || score === "") return false;
  return !/не\s*помнит/i.test(String(score));
}
function filmsScoresOnly() {
  return FILMS.filter((item) => !item.reaction && !item.stub && hasFilmScore(item.score))
    .slice()
    .sort((a, b) => String(b.votedAt || "").localeCompare(String(a.votedAt || "")));
}
function releaseById(id) {
  return RELEASES.find((item) => item.id === id);
}

function posterStyle(item) {
  const photo = item.image ? `--photo:url("${item.image}");` : "";
  return `${photo}--c1:${item.c1 || "#1c1c1c"};--c2:${item.c2 || "#0b0b0b"}`;
}

function card(item, index) {
  const saved = bookmarks().includes(item.id);
  const title = index ? `${index}. ${item.title}` : item.title;
  return `<article class="card">
    <div class="poster ${item.photo ? "photo" : ""}" style="${posterStyle(item)}">
      <a class="poster-link" href="stream.html?id=${esc(item.id)}" aria-label="${esc(item.title)}"></a>
      <button class="ribbon ${saved ? "on" : ""}" type="button" data-save="${esc(item.id)}" aria-label="В список">+</button>
      <span class="poster-kicker">${esc(item.kicker)}</span>
      <span class="poster-title">${esc(item.poster)}</span>
    </div>
    <div class="card-body">
      <h3><a href="stream.html?id=${esc(item.id)}">${esc(title)}</a></h3>
      <a class="btn" href="stream.html?id=${esc(item.id)}">+ Открыть</a>
      <a class="btn" href="${esc(item.watch)}" target="_blank" rel="noopener noreferrer">Смотреть</a>
    </div>
  </article>`;
}

function fanworkCard(item) {
  const kicker = item.kind === "art" ? "Арт" : "Фан-клип";
  if (item.stub) {
    return `<article class="card stub fanwork">
      <div class="poster stub-poster">
        <span class="poster-kicker">${esc(kicker)}</span>
        <span class="poster-title">Скоро</span>
      </div>
      <div class="card-body">
        <h3>${esc(item.title || kicker)}</h3>
        <span class="btn disabled">Скоро</span>
      </div>
    </article>`;
  }
  return `<article class="card fanwork">
    <div class="poster thumb">
      <img src="${esc(item.thumb)}" alt="" loading="lazy">
      <a class="poster-link" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)}"></a>
      <span class="poster-kicker">${esc(kicker)}</span>
    </div>
    <div class="card-body">
      <h3><a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
      <a class="btn pink" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">Открыть</a>
    </div>
  </article>`;
}

function linkCard(item) {
  const cls = ["link-card", item.card].filter(Boolean).join(" ");
  return `<a class="${cls}" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">
      ${item.badge ? `<span class="link-badge">${esc(item.badge)}</span>` : ""}
      <strong>${esc(item.title)}</strong>
      <span>${esc(item.text)}</span>
    </a>`;
}

function merchCard(item) {
  const sold = item.soldOut ? `<span class="merch-sold">Sold out</span>` : "";
  const price = item.text
    ? `<div class="merch-meta"><span class="merch-price">${esc(item.text)}</span>${sold}</div>`
    : sold
      ? `<div class="merch-meta">${sold}</div>`
      : "";
  const note = item.note ? `<span class="merch-note">${esc(item.note)}</span>` : "";
  const body = `<div class="merch-photo"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div>
      <div class="merch-body">
        <strong>${esc(item.title)}</strong>
        ${price}
        ${note}
      </div>`;
  if (item.unavailable || !item.href) {
    return `<button type="button" class="merch-item" data-merch-unavailable>
      ${body}
    </button>`;
  }
  return `<a class="merch-item" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">
      ${body}
    </a>`;
}

function channelCard(item) {
  return `<a class="channel-card" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">
      <div class="channel-photo"><img src="${esc(item.image)}" alt="" loading="lazy"></div>
      <div class="channel-body">
        <strong>${esc(item.title)}</strong>
        <span>${esc(item.handle)}</span>
      </div>
    </a>`;
}

function musicClipsSolo() {
  return MUSIC_CLIPS.filter((item) => !item.feat);
}

function musicClipsFeat() {
  return MUSIC_CLIPS.filter((item) => item.feat);
}

function musicClipsBlocks() {
  return `
    <div class="film-strip clip-strip">
      <h3 class="strip-title">Сольные</h3>
      ${scrollerRow(musicClipsSolo().map((item) => watchCard(item)).join(""))}
    </div>
    <div class="film-strip clip-strip">
      <h3 class="strip-title">Совместные</h3>
      ${scrollerRow(musicClipsFeat().map((item) => watchCard(item)).join(""))}
    </div>`;
}

function watchCard(item, index) {
  if (item.stub) {
    return `<article class="card stub">
      <div class="poster stub-poster">
        <span class="poster-kicker">${index} место</span>
        <span class="poster-title">Скоро</span>
      </div>
      <div class="card-body">
        <h3>В процессе разработки</h3>
        <span class="btn disabled">Скоро</span>
      </div>
    </article>`;
  }
  return `<article class="card clip-card">
    <div class="poster thumb">
      <img src="${esc(item.thumb)}" alt="" loading="lazy">
      <a class="poster-link" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)}"></a>
    </div>
    <div class="card-body">
      <h3><a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
      <a class="btn pink" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">Смотреть</a>
    </div>
  </article>`;
}

function scrollerRow(html, kind = "") {
  const cls = ["scroller", kind].filter(Boolean).join(" ");
  return `<div class="scroller-wrap${kind ? ` is-${kind}` : ""}">
    <button type="button" class="scroller-nav prev" data-scroll="-1" aria-label="Назад">‹</button>
    <div class="${cls}">${html}</div>
    <button type="button" class="scroller-nav next" data-scroll="1" aria-label="Вперёд">›</button>
  </div>`;
}

function bindScrollers(root = document) {
  $$(".scroller-wrap", root).forEach((wrap) => {
    if (wrap.dataset.bound === "1") return;
    wrap.dataset.bound = "1";
    const scroller = $(".scroller", wrap);
    if (!scroller) return;
    wrap.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-scroll]");
      if (!btn || !wrap.contains(btn)) return;
      event.preventDefault();
      const dir = Number(btn.dataset.scroll) || 1;
      const card = scroller.querySelector(".card, .film-card, .film");
      const step = card ? card.getBoundingClientRect().width + 14 : Math.max(scroller.clientWidth * 0.8, 220);
      scroller.scrollBy({ left: dir * step * 2, behavior: "smooth" });
    });
  });
}

function sectionTitle(text, href, label = "Смотреть больше") {
  return `<div class="section-head">
    <h2>${esc(text)}</h2>
    ${href ? `<a class="more arrow" href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>` : ""}
  </div>`;
}

function seriesPoster(item, { href } = {}) {
  const kind = item.stub ? "stub" : item.image ? "has-img" : item.photo ? "photo" : "";
  const inner = item.image
    ? `<img src="${esc(item.image)}" alt="${esc(item.title || "")}">`
    : item.stub ? "Скоро" : esc(item.title || "");
  const cls = `series-poster ${kind}`.trim();
  if (href) return `<a class="${cls}" href="${esc(href)}" style="${posterStyle(item)}">${inner}</a>`;
  return `<div class="${cls}" style="${posterStyle(item)}">${inner}</div>`;
}

function seriesActions(item, { detail = false } = {}) {
  if (item.links) {
    return `<div class="actions playlist-actions">${item.links.map((link) =>
      `<a class="btn playlist-btn" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`
    ).join("")}</div>`;
  }
  if (detail) {
    return `<div class="actions"><a class="btn pink" href="${SITE.twitch}" target="_blank" rel="noopener noreferrer">Смотреть на Twitch</a></div>`;
  }
  return `<a class="btn pink" href="series.html?id=${esc(item.id)}" style="width:160px">Смотреть</a>`;
}

function mountChrome(active) {
  $("#chrome-header").innerHTML = `
    <a class="skip" href="#page">К содержанию</a>
    <header class="header">
      <a class="brand" href="index.html"><span class="brand-mark"></span>MellSher</a>
      <button class="menu-btn" type="button" aria-label="Меню" data-menu>☰</button>
      <nav class="nav" aria-label="Разделы сайта">
        <a href="index.html" class="${active === "home" ? "active" : ""}">Главная</a>
        <a href="streams.html" class="${active === "streams" ? "active" : ""}">Нарезки</a>
        <div class="drop">
          <button type="button" data-drop>Для стримов</button>
          <div class="drop-menu">
            <a href="for.html#commands">Команды чата</a>
            <a href="for.html#rules">Правила</a>
            <a href="for.html#where">Где смотреть</a>
          </div>
        </div>
        <a href="music.html" class="${active === "music" ? "active" : ""}">Музыка</a>
        <a href="films.html" class="${active === "films" ? "active" : ""}">Фильмы</a>
      </nav>
      <form class="search" role="search" data-search>
        <input type="search" placeholder="Поиск..." aria-label="Поиск по стримам и релизам" autocomplete="off" />
        <div class="search-pop"></div>
      </form>
    </header>`;

  $("#chrome-footer").innerHTML = `
    <footer class="footer">
      <div class="wrap footer-grid">
        <div>
          <h2>MellSher</h2>
          <p class="lede">Стримы, нарезки и релизы. Это полка эфиров и музыки, а не официальный кабинет площадок.</p>
        </div>
        <nav aria-label="Мои соцсети">
          <h2>Соцсети</h2>
          <a href="${SITE.telegram}" target="_blank" rel="noopener noreferrer">Telegram</a>
          <a href="${SITE.private}" target="_blank" rel="noopener noreferrer">Приватка</a>
          <a href="${SITE.twitch}" target="_blank" rel="noopener noreferrer">Twitch</a>
          <a href="${SITE.youtube}" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href="${SITE.music}" target="_blank" rel="noopener noreferrer">Яндекс Музыка</a>
          <a href="${SITE.merch}" target="_blank" rel="noopener noreferrer">Мерч · kapusta.shop</a>
          <a href="index.html#links">Все ссылки</a>
        </nav>
        <nav aria-label="Разделы">
          <h2>На сайте</h2>
          <a href="streams.html">Где смотреть нарезки</a>
          <a href="films.html">Рецензии фильмов</a>
          <a href="index.html#tour">Прощальный тур</a>
          <a href="index.html#merch">Мерч</a>
          <a href="index.html#links">Ссылки</a>
        </nav>
      </div>
      <div class="wrap legal"><span>© MellSher</span><span>Фан-сайт зрителей</span></div>
      <a class="credit" href="https://band.link/snodipidi" target="_blank" rel="noopener noreferrer">
        <span>Разработка</span>
        <b>snodipidi</b>
      </a>
    </footer>
    <button class="to-top" type="button" data-top aria-label="Наверх">↑</button>`;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="toast" id="toast" role="status"></div>`);
}

function bindChrome() {
  const header = $(".header");
  const onScroll = () => {
    header.classList.toggle("solid", window.scrollY > 20);
    $("[data-top]").classList.toggle("show", window.scrollY > 700);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  $("[data-top]").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  $("[data-menu]").addEventListener("click", () => $(".nav").classList.toggle("open"));
  $("[data-drop]").addEventListener("click", (event) => {
    event.currentTarget.parentElement.classList.toggle("open");
  });

  const input = $(".search input");
  const pop = $(".search-pop");
  const renderSearch = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      pop.classList.remove("show");
      pop.innerHTML = "";
      return;
    }
    const clips = MUSIC_CLIPS
      .filter((item) => !item.stub && `${item.title} ${item.kicker || ""}`.toLowerCase().includes(q))
      .slice(0, 6);
    const channels = CLIP_CHANNELS
      .filter((item) => `${item.title} ${item.handle}`.toLowerCase().includes(q))
      .slice(0, 4);
    const streams = STREAMS.filter((item) => `${item.title} ${item.blurb}`.toLowerCase().includes(q)).slice(0, 4);
    const releases = RELEASES.filter((item) => !item.stub && `${item.title} ${item.kind || ""}`.toLowerCase().includes(q)).slice(0, 3);
    const series = SERIES.filter((item) => !item.stub && item.title?.toLowerCase().includes(q)).slice(0, 3);
    const merch = MERCH.filter((item) => `${item.title} ${item.text}`.toLowerCase().includes(q)).slice(0, 3);
    const films = FILMS.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 3);
    const rows = [
      ...clips.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Клип</small></a>`),
      ...channels.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Нарезки</small></a>`),
      ...streams.map((item) => `<a href="stream.html?id=${esc(item.id)}"><b>${esc(item.title)}</b><small>Эфир</small></a>`),
      ...series.map((item) => `<a href="series.html?id=${esc(item.id)}"><b>${esc(item.title)}</b><small>Сериал шоу</small></a>`),
      ...merch.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Мерч</small></a>`),
      ...releases.map((item) => `<a href="music.html#${esc(item.id)}"><b>${esc(item.title)}</b><small>${esc(item.kind)}</small></a>`),
      ...films.map((item) => {
        const href = item.text || item.reaction ? `film.html?id=${esc(item.id)}` : `films.html#${esc(item.id)}`;
        return `<a href="${href}"><b>${esc(item.title)}</b><small>Фильм · ${esc(item.score)}</small></a>`;
      }),
    ];
    pop.innerHTML = rows.join("") || `<div class="search-empty">Ничего не нашлось</div>`;
    pop.classList.add("show");
  };
  $("[data-search]").addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", renderSearch);
  document.addEventListener("click", (event) => {
    if (!$("[data-search]").contains(event.target)) pop.classList.remove("show");
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== input) {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape") pop.classList.remove("show");
  });
}

function toggleSave(id) {
  const list = bookmarks();
  const next = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  store.set("ms-saves", next);
  toast(list.includes(id) ? "Убрано из списка" : "В списке «буду смотреть»");
  $$("[data-save]").forEach((btn) => {
    if (btn.dataset.save === id) btn.classList.toggle("on", next.includes(id));
  });
}

function rate(id) {
  const current = ratings()[id];
  const box = document.createElement("div");
  box.className = "modal-back show";
  box.innerHTML = `<form class="modal">
    <h3>Оценка</h3>
    <p>${esc(streamById(id)?.title || "Стрим")} · выберите от 1 до 10</p>
    <div class="stars">${Array.from({ length: 10 }, (_, i) => `<button type="button" data-n="${i + 1}" class="${current === i + 1 ? "on" : ""}">${i + 1}</button>`).join("")}</div>
    <div class="actions"><button class="btn" type="button" data-close>Закрыть</button></div>
  </form>`;
  document.body.appendChild(box);
  box.addEventListener("click", (event) => {
    if (event.target === box || event.target.dataset.close !== undefined && event.target.closest("[data-close]")) {
      box.remove();
    }
    const n = event.target.dataset.n;
    if (!n) return;
    const all = ratings();
    all[id] = Number(n);
    store.set("ms-rates", all);
    toast(`Оценка ${n}/10`);
    box.remove();
    const note = $(`[data-your="${id}"]`);
    if (note) note.textContent = `Ваша оценка ${n}/10`;
  });
}

function bindActions(root = document) {
  root.addEventListener("click", (event) => {
    const save = event.target.closest("[data-save]");
    if (save) {
      event.preventDefault();
      event.stopPropagation();
      toggleSave(save.dataset.save);
      return;
    }
    const merchGone = event.target.closest("[data-merch-unavailable]");
    if (merchGone) {
      event.preventDefault();
      toast("На Kapusta Shop пока не продаётся");
      return;
    }
    const rateBtn = event.target.closest("[data-rate]");
    if (rateBtn) {
      event.preventDefault();
      rate(rateBtn.dataset.rate);
    }
  });
}

function filmScore(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /не\s*помнит/i.test(raw)) return `<b>—</b>`;
  const n = Number(raw.replace(",", "."));
  if (Number.isFinite(n)) return `<b><i style="color:var(--star)">★</i> ${n.toFixed(1)}</b>`;
  return `<b>${esc(raw)}</b>`;
}

function filmCard(item) {
  if (item.stub) {
    return `<article class="card clip-card film-card score-only stub">
      <div class="poster stub-poster"><span class="poster-title">Скоро</span></div>
      <div class="card-body">
        <h3>Скоро</h3>
        <div class="film-scores"><span>MellSher <b>—</b></span><span>Кинопоиск <b>—</b></span></div>
      </div>
    </article>`;
  }
  const open = item.reaction || item.text;
  const title = item.short || item.title;
  const href = open ? `film.html?id=${esc(item.id)}` : "";
  const poster = item.image
    ? `<img src="${esc(item.image)}" alt="" loading="lazy">`
    : "";
  const inner = `
    <div class="poster thumb film-thumb">
      ${poster}
      ${href ? `<span class="poster-link" aria-hidden="true"></span>` : ""}
    </div>
    <div class="card-body">
      <h3 title="${esc(item.title)}">${esc(title)}</h3>
      <div class="film-scores"><span>MellSher ${filmScore(item.score)}</span><span>Кинопоиск ${filmScore(item.kp)}</span></div>
    </div>`;
  if (href) {
    return `<a class="card clip-card film-card is-link" id="${esc(item.id)}" href="${href}">${inner}</a>`;
  }
  return `<article class="card clip-card film-card score-only" id="${esc(item.id)}">${inner}</article>`;
}

function tourCards() {
  return TOUR.map((show) => `<a class="tour-card" href="${esc(show.href)}" target="_blank" rel="noopener noreferrer">
    <span class="tour-main">
      <span class="tour-date">${esc(show.date)}</span>
      <strong class="tour-city">${esc(show.city)}</strong>
    </span>
    <span class="tour-btn"><span>→</span> Билеты</span>
  </a>`).join("");
}

function renderHome() {
  $("#page").innerHTML = `
    <section class="hero">
      <img src="assets/hero.png" alt="MellSher с микрофоном на сцене" />
      <div class="hero-shade"></div>
      <h1 class="hero-title">MELLSHER</h1>
      <button class="scroll-cue" type="button" data-down>Крутите вниз</button>
    </section>
    <div class="wrap">
      <section class="section" id="tour">
        ${sectionTitle("Прощальный тур", "https://xxl.tours/", "Все даты")}
        <div class="tour-row">${tourCards()}</div>
      </section>
      <section class="section" id="merch">
        ${sectionTitle("Мерч", SITE.merch, "Весь магазин")}
        <div class="merch-grid">${MERCH.map(merchCard).join("")}</div>
      </section>
      <section class="section" id="releases">
        ${sectionTitle("Релизы", "music.html")}
        <div class="release-grid">
          ${RELEASES.filter((item) => !item.stub).slice(0, 5).map((item) => releaseCard(item, { teaser: true })).join("")}
        </div>
      </section>
      <section class="section" id="music-clips">
        ${sectionTitle("Клипы", "music.html#clips", "Все клипы")}
        ${musicClipsBlocks()}
      </section>
      <section class="section" id="clips">
        ${sectionTitle("Где смотреть нарезки?", "streams.html", "Все каналы")}
        <div class="channel-grid">${CLIP_CHANNELS.map(channelCard).join("")}</div>
      </section>
      <section class="section" id="films">
        ${sectionTitle("Рецензии фильмов", "films.html")}
        <div class="film-strip">
          <h3 class="strip-title">С реакциями</h3>
          <p class="lede">Оценки MellSher рядом с оценкой Кинопоиска.</p>
          ${scrollerRow(filmsWithReaction().map(filmCard).join(""))}
        </div>
        <div class="film-strip">
          <h3 class="strip-title">Только оценки</h3>
          <p class="lede">Фильмы без реакции — пока только оценки.</p>
          ${scrollerRow(filmsScoresOnly().map(filmCard).join(""))}
        </div>
        <div class="center"><a class="pill" href="films.html">Все рецензии</a></div>
      </section>
      <section class="section" id="links">
        ${sectionTitle("Ссылки")}
        <div class="links-grid">${LINKS.map(linkCard).join("")}</div>
      </section>
      <section class="section" id="fans">
        ${sectionTitle("Творчество подписчиков")}
        <p class="lede">Фан-клипы и арты от комьюнити — пока заглушки, контент появится позже.</p>
        <div class="scroller">${FANWORKS.map(fanworkCard).join("")}</div>
      </section>
    </div>
    <section class="live wrap" id="live">
      <h2 class="block-title" style="justify-content:center">Трансляция <span class="dot" style="margin-left:8px"></span></h2>
      <p>Плеер канала mellsher. Если эфира нет, Twitch покажет офлайн — анонсы лежат в телеграме.</p>
      <div class="live-frame"><iframe title="Трансляция MellSher на Twitch" allowfullscreen></iframe></div>
    </section>`;

  $("[data-down]").addEventListener("click", () => $("#tour").scrollIntoView({ behavior: "smooth" }));
  bindScrollers($("#page"));
  const frame = $(".live-frame iframe");
  const host = location.hostname || "localhost";
  frame.src = `https://player.twitch.tv/?channel=mellsher&parent=${encodeURIComponent(host)}&muted=true`;
}

function seriesDirection(from, to) {
  const len = SERIES.length;
  const forward = (to - from + len) % len;
  const backward = (from - to + len) % len;
  return forward <= backward ? 1 : -1;
}

function renderSeries(index, direction = 0) {
  const item = SERIES[index];
  const anim = direction > 0 ? "is-in-next" : direction < 0 ? "is-in-prev" : "";
  const body = item.stub
    ? `<article class="series-card stub ${anim}">
        ${seriesPoster(item)}
        <div>
          <h3>В процессе разработки</h3>
          <div class="series-meta"><span>—</span><span>скоро</span><span>—</span></div>
          <p>Этот формат ещё собирается — загляните позже.</p>
          <div class="actions playlist-actions">
            <span class="btn disabled playlist-btn">Скоро</span>
            <span class="btn disabled playlist-btn">Скоро</span>
          </div>
        </div>
      </article>`
    : `<article class="series-card ${anim}">
        ${seriesPoster(item)}
        <div>
          <h3>${esc(item.title)}</h3>
          <div class="series-meta"><span>${item.year}</span><span>${esc(item.meta)}</span><span>${esc(item.age)}</span></div>
          <p>${esc(item.text)}</p>
          ${seriesActions(item)}
        </div>
      </article>`;
  const frame = $("[data-series]");
  frame.classList.add("series-frame");
  frame.innerHTML = body;
  $("[data-dots]").innerHTML = SERIES.map((_, i) => `<button type="button" class="${i === index ? "on" : ""}" data-dot="${i}" aria-label="Сериал ${i + 1}"></button>`).join("");
  $("[data-prev]").onclick = () => renderSeries((index - 1 + SERIES.length) % SERIES.length, -1);
  $("[data-next]").onclick = () => renderSeries((index + 1) % SERIES.length, 1);
  $$("[data-dot]").forEach((btn) => {
    btn.onclick = () => {
      const next = Number(btn.dataset.dot);
      renderSeries(next, seriesDirection(index, next));
    };
  });
}

function renderStreams() {
  document.title = "Где смотреть нарезки? — MellSher";
  $("#page").innerHTML = `
    <div class="wrap page">
      <h1 class="page-title">Где смотреть нарезки?</h1>
      <p class="lede">Каналы с нарезками стримов MellSher.</p>
      <div class="channel-grid channel-grid-page">${CLIP_CHANNELS.map(channelCard).join("")}</div>
    </div>`;
}

function renderStream() {
  const id = new URLSearchParams(location.search).get("id");
  const item = streamById(id);
  if (!item) {
    $("#page").innerHTML = `<div class="wrap page"><h1 class="page-title">Эфир не найден</h1><p class="lede"><a class="text-link" href="streams.html">Вернуться к рейтингу</a></p></div>`;
    return;
  }
  document.title = `${item.title} — MellSher`;
  const saved = bookmarks().includes(item.id);
  const related = STREAMS.filter((other) => other.id !== item.id && other.cat === item.cat).slice(0, 4);
  $("#page").innerHTML = `
    <div class="wrap page">
      <div class="detail">
        <div class="detail-poster ${item.photo ? "photo" : ""}" style="${posterStyle(item)}">
          <span class="kicker">${esc(item.kicker)} · ${item.year}</span>
          <strong>${esc(item.poster)}</strong>
        </div>
        <div>
          <p class="kicker">${esc(item.kicker)}</p>
          <h1 class="page-title">${esc(item.title)}</h1>
          <p class="lede">${esc(item.text)}</p>
          <div class="actions">
            <a class="btn pink" href="${esc(item.watch)}" target="_blank" rel="noopener noreferrer">Смотреть</a>
            <button class="btn" type="button" data-save="${esc(item.id)}">${saved ? "В списке" : "+ Буду смотреть"}</button>
          </div>
        </div>
      </div>
      <section class="section">
        ${sectionTitle("Ещё эфиры")}
        <div class="scroller">${related.map((other) => card(other)).join("")}</div>
      </section>
    </div>`;
}

function renderSeriesPage() {
  const id = new URLSearchParams(location.search).get("id");
  const item = id ? seriesById(id) : null;
  if (id && !item) {
    $("#page").innerHTML = `<div class="wrap page"><h1 class="page-title">Сериал не найден</h1><a href="series.html">Все сериалы</a></div>`;
    return;
  }
  if (!item) {
    $("#page").innerHTML = `
      <div class="wrap page">
        <h1 class="page-title">Сериалы шоу</h1>
        <p class="lede">Длинные форматы канала: не один эфир, а сезон, который имеет смысл смотреть по порядку.</p>
        <div class="stack">
          ${SERIES.map((series) => {
            if (series.stub) {
              return `<article class="series-card stub">
                ${seriesPoster(series)}
                <div>
                  <h3>В процессе разработки</h3>
                  <div class="series-meta"><span>—</span><span>скоро</span><span>—</span></div>
                  <p>Этот формат ещё собирается — загляните позже.</p>
                  <div class="actions playlist-actions">
                    <span class="btn disabled playlist-btn">Скоро</span>
                    <span class="btn disabled playlist-btn">Скоро</span>
                  </div>
                </div>
              </article>`;
            }
            return `<article class="series-card">
              ${seriesPoster(series, { href: `series.html?id=${series.id}` })}
              <div>
                <div class="series-meta"><span>${series.year}</span><span>${esc(series.meta)}</span><span>${esc(series.age)}</span></div>
                <h3><a href="series.html?id=${esc(series.id)}">${esc(series.title)}</a></h3>
                <p>${esc(series.text)}</p>
                ${seriesActions(series)}
              </div>
            </article>`;
          }).join("")}
        </div>
      </div>`;
    return;
  }
  if (item.stub) {
    $("#page").innerHTML = `<div class="wrap page"><h1 class="page-title">В процессе разработки</h1><p class="lede"><a class="text-link" href="series.html">Ко всем сериалам</a></p></div>`;
    return;
  }
  document.title = `${item.title} — MellSher`;
  const episodes = item.episodes?.length
    ? `<ol class="episodes">${item.episodes.map((episode, index) => `<li><i>${String(index + 1).padStart(2, "0")}</i><span>${esc(episode)}</span></li>`).join("")}</ol>`
    : "";
  const poster = item.image
    ? `<div class="detail-poster has-img"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div>`
    : `<div class="detail-poster ${item.photo ? "photo" : ""}" style="${posterStyle(item)}"><strong>${esc(item.title)}</strong></div>`;
  $("#page").innerHTML = `
    <div class="wrap page">
      <div class="detail">
        ${poster}
        <div>
          <p class="kicker"><a href="series.html">Сериалы</a> · ${item.year} · ${esc(item.age)}</p>
          <h1 class="page-title">${esc(item.title)}</h1>
          <p class="series-meta"><span>${esc(item.meta)}</span></p>
          <p class="lede">${esc(item.text)}</p>
          ${episodes}
          ${seriesActions(item, { detail: true })}
        </div>
      </div>
    </div>`;
}

function releaseCover(item) {
  if (!item.cover) return "";
  return `<div class="release-cover"><img src="${esc(item.cover)}" alt="${esc(item.title)}"></div>`;
}

function releaseCard(item, { teaser = false } = {}) {
  if (item.stub) {
    return `<article class="release stub ${item.cover ? "has-cover" : ""}" id="${esc(item.id)}">
      ${releaseCover(item)}
      <div class="release-body">
        <h3>${esc(item.title)}</h3>
        <div class="kind">Скоро</div>
        <p>В процессе разработки</p>
        <span class="btn disabled">Скоро</span>
      </div>
    </article>`;
  }
  const badge = item.badge || (item.featured ? "Новый релиз" : "");
  const sentences = item.text.split(/(?<=\.)\s+/);
  const text = teaser || item.featured
    ? sentences.slice(0, 2).join(" ")
    : sentences.slice(0, 3).join(" ");
  return `<article class="release ${item.featured ? "featured" : ""} ${item.cover ? "has-cover" : ""}" id="${esc(item.id)}">
    ${releaseCover(item)}
    <div class="release-body">
      ${badge ? `<span class="release-badge">${esc(badge)}</span>` : ""}
      <h3>${esc(item.title)}</h3>
      <div class="kind">${esc(item.kind)}${item.year ? ` · ${item.year}` : ""}</div>
      <p>${esc(text)}</p>
      <a class="btn ${item.featured ? "pink" : ""}" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">Слушать</a>
    </div>
  </article>`;
}

function trackIsSolo(item) {
  return /сольн/i.test(item.kind || "");
}

function sortTracks(tracks, mode = "solo") {
  const ranked = tracks.map((item, index) => ({ item, index }));
  const byNew = (a, b) => (b.item.year || 0) - (a.item.year || 0) || a.index - b.index;
  const byOld = (a, b) => (a.item.year || 0) - (b.item.year || 0) || b.index - a.index;
  const bySolo = (a, b) => Number(trackIsSolo(b.item)) - Number(trackIsSolo(a.item)) || byNew(a, b);
  const byFeat = (a, b) => Number(trackIsSolo(a.item)) - Number(trackIsSolo(b.item)) || byNew(a, b);
  const sorter = { solo: bySolo, new: byNew, old: byOld, feat: byFeat }[mode] || bySolo;
  return ranked.sort(sorter).map(({ item }) => item);
}

function renderTrackGrid(mode = "solo") {
  const tracks = sortTracks(RELEASES.filter((item) => item.type === "track"), mode);
  const grid = $("[data-tracks-grid]");
  if (!grid) return;
  grid.innerHTML = tracks.map((item) => releaseCard(item)).join("");
}

function renderMusic() {
  const albums = RELEASES.filter((item) => item.type === "album");
  $("#page").innerHTML = `
    <div class="wrap page">
      <div class="music-hero">
        <div class="music-lead has-live">
          <div class="music-lead-copy">
            <span class="kicker">Музыка</span>
            <h2>Релизы MellSher</h2>
            <p>Сольники и совместные треки с 5opka — свежие релизы и то, что уже успело осесть в плейлистах.</p>
            <a class="btn pink" href="#albums">К релизам</a>
          </div>
        </div>
        <div class="stack">
          <article class="panel">
            <h3>Он умеет петь?</h3>
            <p>Да, ниже - различные треки и альбомы Игоря.</p>
            <a class="btn yellow" href="${SITE.music}" target="_blank" rel="noopener noreferrer">Яндекс Музыка</a>
          </article>
          <article class="panel">
            <h3>Разгром</h3>
            <p>Новый сольный сингл — лид к третьему альбому, с отсылкой к «Бойцовскому клубу».</p>
            <a class="btn pink" href="https://music.thefence.me/psrazgromlsh" target="_blank" rel="noopener noreferrer">Слушать сингл</a>
          </article>
        </div>
      </div>
      <section class="section" id="albums">
        ${sectionTitle("Альбомы")}
        <div class="music-grid albums-grid">
          ${albums.map(releaseCard).join("")}
        </div>
      </section>
      <section class="section" id="tracks">
        <div class="section-head">
          <h2>Треки</h2>
          <label class="track-sort">
            <span>Сортировка</span>
            <select data-track-sort>
              <option value="solo" selected>Сначала сольные</option>
              <option value="new">Сначала новые</option>
              <option value="old">Сначала старые</option>
              <option value="feat">Сначала фиты</option>
            </select>
          </label>
        </div>
        <div class="music-grid tracks-grid" data-tracks-grid></div>
      </section>
      <section class="section" id="clips">
        ${sectionTitle("Клипы")}
        ${musicClipsBlocks()}
      </section>
    </div>`;
  renderTrackGrid("solo");
  $("[data-track-sort]").addEventListener("change", (event) => {
    renderTrackGrid(event.target.value);
  });
  if (location.hash === "#clips") {
    requestAnimationFrame(() => $("#clips")?.scrollIntoView({ behavior: "smooth" }));
  }
}

function renderFor() {
  $("#page").innerHTML = `
    <div class="wrap page">
      <h1 class="page-title">Для стримов</h1>
      <p class="lede">Коротко, чтобы не спрашивать одно и то же в первые десять минут эфира.</p>
      <section class="section" id="commands">
        <h2 class="block-title">Команды чата</h2>
        <div class="stack">
          ${COMMANDS.map((item) => `<div class="cmd"><code>${esc(item.cmd)}</code><span>${esc(item.text)}</span></div>`).join("")}
        </div>
      </section>
      <section class="section" id="rules">
        <h2 class="block-title">Правила</h2>
        <ol class="rules">${RULES.map((rule) => `<li>${esc(rule)}</li>`).join("")}</ol>
      </section>
      <section class="section" id="where">
        <h2 class="block-title">Где смотреть</h2>
        <div class="release-grid">
          <a class="release" href="${SITE.twitch}" target="_blank" rel="noopener noreferrer"><h3>Twitch</h3><p>Основной эфир: шоу, кукинг и ночной чат. Канал mellsher.</p><span class="btn pink">Открыть</span></a>
          <a class="release" href="${SITE.telegram}" target="_blank" rel="noopener noreferrer"><h3>Telegram</h3><p>«Голоса в голове MellShera» — анонсы, клипы и переносы, если сетка сдвинулась.</p><span class="btn">Открыть</span></a>
          <a class="release" href="${SITE.youtube}" target="_blank" rel="noopener noreferrer"><h3>YouTube</h3><p>Нарезки и длинные ролики — то, что уходит с эфира в постоянный архив.</p><span class="btn">Открыть</span></a>
          <a class="release" href="index.html#tour"><h3>Тур</h3><p>Ближайшие площадки прощального тура с 5opka. В зале телефон лучше поднять на XXL, а не на правила чата.</p><span class="btn">Даты</span></a>
          <a class="release" href="${SITE.merch}" target="_blank" rel="noopener noreferrer"><h3>Мерч</h3><p>Магазин kapusta.shop — худи, футболки и остальной мерч MellSher.</p><span class="btn">Открыть</span></a>
        </div>
      </section>
    </div>`;
}

function renderFilms() {
  $("#page").innerHTML = `
    <div class="wrap page">
      <h1 class="page-title">Рецензии фильмов</h1>
      <div class="film-strip">
        <h2 class="block-title">С реакциями</h2>
        <p class="lede">Что MellSher уже смотрел: его оценка и оценка Кинопоиска. Нажми на карточку — откроется страница с описанием и реакцией.</p>
        ${scrollerRow(filmsWithReaction().map(filmCard).join(""))}
      </div>
      <div class="film-strip">
        <h2 class="block-title">Только оценки</h2>
        <p class="lede">Фильмы без реакции — только оценки MellSher и Кинопоиска.</p>
        ${scrollerRow(filmsScoresOnly().map(filmCard).join(""))}
      </div>
    </div>`;
  bindScrollers($("#page"));
}

function renderFilm() {
  const id = new URLSearchParams(location.search).get("id");
  const item = id ? filmById(id) : null;
  if (!item || !(item.text || item.reaction)) {
    $("#page").innerHTML = `<div class="wrap page"><h1 class="page-title">Фильм не найден</h1><p class="lede"><a class="text-link" href="films.html">Ко всем рецензиям</a></p></div>`;
    return;
  }
  document.title = `${item.title} — MellSher`;
  const related = FILMS.filter((other) => other.id !== item.id && (other.text || other.reaction)).slice(0, 4);
  const more = related.length
    ? related
    : FILMS.filter((other) => other.id !== item.id && !other.stub).slice(0, 4);
  const poster = item.image
    ? `<div class="film-hero-poster"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div>`
    : `<div class="film-hero-poster stub"><strong>${esc(item.title)}</strong></div>`;
  $("#page").innerHTML = `
    <section class="film-hero ${item.image ? "has-bg" : ""}" ${item.image ? `style="--film-bg:url('${esc(item.image)}')"` : ""}>
      <div class="film-hero-shade"></div>
      <div class="wrap film-hero-grid">
        ${poster}
        <div class="film-hero-copy">
          <p class="kicker"><a href="films.html">Фильмы</a> · реакция MellSher${item.year ? ` · ${item.year}` : ""}</p>
          <h1 class="page-title">${esc(item.title)}</h1>
          ${item.genre ? `<p class="film-genre">${esc(item.genre)}</p>` : ""}
          <div class="score-cards">
            <div class="score-card">
              <span>MellSher</span>
              <strong>${filmScore(item.score)}</strong>
            </div>
            <div class="score-card">
              <span>Кинопоиск</span>
              <strong>${filmScore(item.kp)}</strong>
            </div>
          </div>
          <div class="actions">
            ${item.reaction
              ? `<a class="btn pink" href="${esc(item.reaction)}" target="_blank" rel="noopener noreferrer">Смотреть реакцию</a>`
              : `<span class="btn disabled">Реакции нет</span>`}
            <a class="btn" href="films.html">Все фильмы</a>
          </div>
        </div>
      </div>
    </section>
    <div class="wrap page film-page">
      <section class="film-panel">
        <h2 class="strip-title">О фильме</h2>
        <p>${esc(item.text || "Описание скоро появится.")}</p>
      </section>
      <section class="section">
        ${sectionTitle("Ещё фильмы", "films.html", "Все рецензии")}
        ${scrollerRow(more.map(filmCard).join(""))}
      </section>
    </div>`;
  bindScrollers($("#page"));
}

const pages = {
  home: renderHome,
  streams: renderStreams,
  stream: renderStream,
  series: renderSeriesPage,
  music: renderMusic,
  for: renderFor,
  films: renderFilms,
  film: renderFilm,
};

const page = document.body.dataset.page;
mountChrome(page);
bindChrome();
bindActions(document);
pages[page]?.();
