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
  return FILMS.filter((item) => item.reaction).slice().reverse();
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

function linkIcon(id) {
  const icons = {
    telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#2AABEE" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8-1.61 7.59c-.12.55-.45.68-.91.42l-2.52-1.86-1.22 1.17c-.13.14-.25.25-.51.25l.18-2.56 4.67-4.22c.2-.18-.04-.28-.31-.1l-5.77 3.63-2.49-.78c-.54-.17-.55-.54.11-.8l9.72-3.75c.45-.16.84.11.77.81z"/></svg>`,
    private: `<img src="assets/links/private.png" alt="" loading="lazy">`,
    merch: `<img src="assets/links/kapusta.png" alt="" loading="lazy">`,
    twitch: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#9146FF" d="M4.3 2 2 5.7v14.6h5V22l2.8-1.7h4.3L20.6 14V2H4.3zm14.6 10.9-2.8 2.8h-4.3l-2.5 1.7v-1.7H6.3V4.3h12.6v8.6z"/><path fill="#9146FF" d="M14.9 6.6h1.7v5.1h-1.7V6.6zm-4.6 0H12v5.1H10.3V6.6z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF0033" d="M23.5 7.2a3 3 0 0 0-2.1-2.1C19.5 4.6 12 4.6 12 4.6s-7.5 0-9.4.5A3 3 0 0 0 .5 7.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-4.8z"/><path fill="#fff" d="M9.8 15.3V8.7L15.8 12l-6 3.3z"/></svg>`,
    music: `<img src="assets/links/yandex-music.png" alt="" loading="lazy">`,
    tiktok: `<img src="assets/links/tiktok.png" alt="" loading="lazy">`,
    instagram: `<img src="assets/links/instagram.jpg" alt="" loading="lazy">`,
    discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#5865F2" d="M19.3 5.1A17.4 17.4 0 0 0 15 3.9l-.4.8a15.5 15.5 0 0 1 3.7 1.4 12.4 12.4 0 0 0-11.6 0A15.5 15.5 0 0 1 9.4 4.7L9 3.9a17.4 17.4 0 0 0-4.3 1.2C2.1 9.2 1.4 13.1 1.7 17a17.6 17.6 0 0 0 5.3 2.7l.7-1.1a11.3 11.3 0 0 1-1.7-.8l.4-.3c3.3 1.5 6.9 1.5 10.2 0l.4.3c-.5.3-1.1.6-1.7.8l.7 1.1A17.5 17.5 0 0 0 22.3 17c.4-4.5-.6-8.4-3-11.9zM8.7 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2-.8 2-1.8 2z"/></svg>`,
    donate: `<img src="assets/links/donate.png" alt="" loading="lazy">`,
    vk: `<img src="assets/links/vk.png" alt="" loading="lazy">`,
  };
  return icons[id] || `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#888"/></svg>`;
}

function linkCard(item) {
  const cls = ["link-card", item.card].filter(Boolean).join(" ");
  const imgIcons = new Set(["music", "private", "merch", "vk", "instagram", "donate", "tiktok"]);
  const iconCls = ["link-icon", imgIcons.has(item.id) ? `is-${item.id}` : ""].filter(Boolean).join(" ");
  const textCls = item.id === "instagram" ? "link-legal" : "";
  return `<a class="${cls}" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">
      ${item.badge ? `<span class="link-badge">${esc(item.badge)}</span>` : ""}
      <span class="link-copy">
        <strong>${esc(item.title)}</strong>
        <span class="${textCls}">${esc(item.text)}</span>
      </span>
      <span class="${iconCls}">${linkIcon(item.id)}</span>
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
  /* пасхалка-стикер временно выкл.
  let card = ...;
  if (item.id !== "futbolka-demon") return card;
  return `<div class="merch-egg-wrap">
    ${card}
    <a class="tour-egg" href="https://www.youtube.com/watch?v=ClCpDu6UAFE" target="_blank" rel="noopener noreferrer" title="?" aria-label="Пасхалка">
      <img src="assets/anal.png" alt="">
    </a>
  </div>`;
  */
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

function channelScroller() {
  return scrollerRow(CLIP_CHANNELS.map(channelCard).join(""), "channels");
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
      <div class="clip-strip-head">
        <h3 class="strip-title">Сольные</h3>
        <span class="clip-strip-note">клипы MellSher</span>
      </div>
      ${scrollerRow(musicClipsSolo().map((item) => watchCard(item)).join(""), "clips")}
    </div>
    <div class="film-strip clip-strip is-feat">
      <div class="clip-strip-head">
        <h3 class="strip-title">Совместные</h3>
        <span class="clip-strip-note">фиты и коллабы</span>
      </div>
      ${scrollerRow(musicClipsFeat().map((item) => watchCard(item)).join(""), "clips")}
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
  return `<article class="card clip-card music-clip${item.feat ? " is-feat" : ""}">
    <div class="poster thumb">
      <img src="${esc(item.thumb)}" alt="" loading="lazy">
      <span class="clip-play" aria-hidden="true"><i></i></span>
      <a class="poster-link" href="${esc(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)}"></a>
    </div>
    <div class="card-body">
      <h3><a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3>
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
  bindClipPlayLights(root);
}

function bindClipPlayLights(root = document) {
  $$(".music-clip", root).forEach((card) => {
    if (card.dataset.lightBound === "1") return;
    card.dataset.lightBound = "1";
    const orb = $(".clip-play i", card);
    if (!orb) return;
    const setPos = (event) => {
      const rect = orb.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      orb.style.setProperty("--mx", `${Math.max(-10, Math.min(110, x))}%`);
      orb.style.setProperty("--my", `${Math.max(-10, Math.min(110, y))}%`);
    };
    card.addEventListener("pointermove", setPos);
    card.addEventListener("pointerenter", setPos);
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
      .filter((item) => `${item.title || ""} ${item.handle || ""}`.toLowerCase().includes(q))
      .slice(0, 4);
    const streams = STREAMS
      .filter((item) => `${item.title || ""} ${item.blurb || ""} ${item.kicker || ""}`.toLowerCase().includes(q))
      .slice(0, 4);
    const releases = RELEASES
      .filter((item) => !item.stub && `${item.title || ""} ${item.kind || ""}`.toLowerCase().includes(q))
      .slice(0, 3);
    const series = SERIES.filter((item) => !item.stub && item.title?.toLowerCase().includes(q)).slice(0, 3);
    const merch = MERCH
      .filter((item) => `${item.title || ""} ${item.text || ""}`.toLowerCase().includes(q))
      .slice(0, 3);
    const films = FILMS
      .filter((item) => !item.stub && `${item.title || ""} ${item.short || ""}`.toLowerCase().includes(q))
      .slice(0, 5);
    const rows = [
      ...clips.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Клип</small></a>`),
      ...channels.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Нарезки</small></a>`),
      ...streams.map((item) => `<a href="stream.html?id=${esc(item.id)}"><b>${esc(item.title)}</b><small>Эфир</small></a>`),
      ...series.map((item) => `<a href="series.html?id=${esc(item.id)}"><b>${esc(item.title)}</b><small>Сериал шоу</small></a>`),
      ...merch.map((item) => `<a href="${esc(item.href)}" target="_blank" rel="noopener noreferrer"><b>${esc(item.title)}</b><small>Мерч</small></a>`),
      ...releases.map((item) => `<a href="music.html#${esc(item.id)}"><b>${esc(item.title)}</b><small>${esc(item.kind)}</small></a>`),
      ...films.map((item) => {
        return `<a href="film.html?id=${esc(item.id)}"><b>${esc(item.title)}</b><small>Фильм · ${esc(item.score)}</small></a>`;
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

function scoreTone(n) {
  if (n < 5) return "bad";
  if (n < 7) return "mid";
  return "good";
}

function filmScore(value) {
  const raw = String(value ?? "").trim();
  if (!raw || /не\s*помнит/i.test(raw)) return `<b class="score-val">—</b>`;
  const n = Number(raw.replace(",", "."));
  if (Number.isFinite(n)) {
    return `<b class="score-val score-${scoreTone(n)}"><i>★</i> ${n.toFixed(1)}</b>`;
  }
  return `<b class="score-val">${esc(raw)}</b>`;
}

function filmCard(item) {
  if (item.stub) {
    return `<article class="card clip-card film-card score-only stub">
      <div class="poster stub-poster"><span class="poster-title">Скоро</span></div>
      <div class="card-body">
        <h3>Скоро</h3>
        <div class="film-scores"><span>MellSher <b class="score-val">—</b></span><span>Кинопоиск <b class="score-val">—</b></span></div>
      </div>
    </article>`;
  }
  const title = item.short || item.title;
  const href = `film.html?id=${esc(item.id)}`;
  const poster = item.image
    ? `<img src="${esc(item.image)}" alt="" loading="lazy">`
    : "";
  const inner = `
    <div class="poster thumb film-thumb">
      ${poster}
      <span class="poster-link" aria-hidden="true"></span>
    </div>
    <div class="card-body">
      <h3 title="${esc(item.title)}">${esc(title)}</h3>
      <div class="film-scores"><span>MellSher ${filmScore(item.score)}</span><span>Кинопоиск ${filmScore(item.kp)}</span></div>
    </div>`;
  return `<a class="card clip-card film-card is-link" id="${esc(item.id)}" href="${href}">${inner}</a>`;
}

function tourCards() {
  return TOUR.map((show, index) => {
    const last = index === TOUR.length - 1;
    return `<a class="tour-card${last ? " is-last" : ""}" href="${esc(show.href)}" target="_blank" rel="noopener noreferrer">
    <span class="tour-main">
      <span class="tour-date">${esc(show.date)}</span>
      <strong class="tour-city">${esc(show.city)}</strong>
    </span>
    <span class="tour-btn"><span>→</span> Билеты</span>
  </a>`;
  }).join("");
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
        <div class="release-grid release-grid-home">
          ${homeReleaseItems().map((item) => releaseCard(item, { teaser: true })).join("")}
        </div>
      </section>
      <section class="section" id="music-clips">
        ${sectionTitle("Клипы", "music.html#clips", "Все клипы")}
        ${musicClipsBlocks()}
      </section>
      <section class="section" id="clips">
        ${sectionTitle("Где смотреть нарезки?", "streams.html", "Все каналы")}
        ${channelScroller()}
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
          <p class="lede">Фильмы без реакции на видео — оценки и страница с информацией.</p>
          ${scrollerRow(filmsScoresOnly().map(filmCard).join(""))}
        </div>
        <div class="center"><a class="pill" href="films.html">Все оценки</a></div>
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
  // bindTourEgg(); // пасхалка-стикер временно выкл.
  const frame = $(".live-frame iframe");
  const host = location.hostname || "localhost";
  frame.src = `https://player.twitch.tv/?channel=mellsher&parent=${encodeURIComponent(host)}&muted=true`;
}

/* пасхалка-стикер временно выкл.
function bindTourEgg() {
  const egg = $(".tour-egg");
  if (!egg) return;
  egg.addEventListener("click", (event) => {
    event.preventDefault();
    if (egg.classList.contains("is-peeling")) return;
    egg.classList.add("is-peeling");
    const href = egg.href;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      egg.remove();
      window.open(href, "_blank", "noopener,noreferrer");
    };
    egg.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, 780);
  });
}
*/

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
      ${channelScroller()}
    </div>`;
  bindScrollers($("#page"));
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

function homeReleaseItems() {
  const order = ["hm3", "razgrom", "dar", "magnum", "opus", "x", "svet"];
  return order.map((id) => RELEASES.find((item) => item.id === id)).filter(Boolean);
}

function releaseCover(item) {
  if (!item.cover) return "";
  const hurry = item.featured
    ? `<div class="release-hurry" aria-hidden="true"><span>слушай</span><span>скорее</span></div>`
    : "";
  return `<div class="release-cover"><img src="${esc(item.cover)}" alt="${esc(item.title)}">${hurry}</div>`;
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
  const href = item.href || SITE.music;
  return `<article class="release ${item.featured ? "featured" : ""} ${item.cover ? "has-cover" : ""}" id="${esc(item.id)}">
    ${releaseCover(item)}
    <div class="release-body">
      ${badge ? `<span class="release-badge">${esc(badge)}</span>` : ""}
      <h3>${esc(item.title)}</h3>
      <div class="kind">${esc(item.kind)}${item.year ? ` · ${item.year}` : ""}</div>
      <p>${esc(item.text || "")}</p>
      <a class="btn ${item.featured ? "pink" : ""}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">Слушать</a>
    </div>
  </article>`;
}

function trackIsSolo(item) {
  return /сольн/i.test(item.kind || "");
}

function trackIsSingle(item) {
  return /сингл/i.test(item.kind || "");
}

function trackIsSoloAlbumTrack(item) {
  return /сольн.*трек/i.test(item.kind || "");
}

function trackDefaultRank(item) {
  if (trackIsSingle(item)) return 3;
  if (trackIsSoloAlbumTrack(item)) return 2;
  return 1;
}

function trackSoloRank(item) {
  if (trackIsSolo(item) && trackIsSingle(item)) return 2;
  if (trackIsSolo(item)) return 1;
  return 0;
}

function trackDate(item) {
  if (item.date) return item.date;
  if (item.year) return `${item.year}-01-01`;
  return "0000-01-01";
}

function sortTracks(tracks, mode = "default") {
  const ranked = tracks.map((item, index) => ({ item, index }));
  const byNew = (a, b) => trackDate(b.item).localeCompare(trackDate(a.item)) || a.index - b.index;
  const byOld = (a, b) => trackDate(a.item).localeCompare(trackDate(b.item)) || a.index - b.index;
  const byDefault = (a, b) => trackDefaultRank(b.item) - trackDefaultRank(a.item) || byNew(a, b);
  const bySolo = (a, b) => trackSoloRank(b.item) - trackSoloRank(a.item) || byNew(a, b);
  const byFeat = (a, b) => Number(trackIsSolo(a.item)) - Number(trackIsSolo(b.item)) || byNew(a, b);
  const sorter = { default: byDefault, solo: bySolo, new: byNew, old: byOld, feat: byFeat }[mode] || byDefault;
  return ranked.sort(sorter).map(({ item }) => item);
}

function renderTrackGrid(mode = "default") {
  const tracks = sortTracks(RELEASES.filter((item) => item.type === "track"), mode);
  const grid = $("[data-tracks-grid]");
  if (!grid) return;
  grid.innerHTML = tracks.map((item) => releaseCard(item)).join("");
}

function renderMusic() {
  const albums = sortTracks(RELEASES.filter((item) => item.type === "album" && !item.stub), "new");
  $("#page").innerHTML = `
    <div class="wrap page">
      <div class="music-hero">
        <div class="music-lead has-live">
          <div class="music-lead-copy">
            <span class="kicker">Музыка</span>
            <h2>Релизы MellSher'a</h2>
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
          <h2>Треки (В РАЗРАБОТКЕ)</h2>
          <label class="track-sort">
            <span>Сортировка</span>
            <select data-track-sort>
              <option value="default" selected>По умолчанию</option>
              <option value="solo">Сначала сольные</option>
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
  renderTrackGrid("default");
  $("[data-track-sort]").addEventListener("change", (event) => {
    renderTrackGrid(event.target.value);
  });
  if (location.hash === "#clips") {
    requestAnimationFrame(() => $("#clips")?.scrollIntoView({ behavior: "smooth" }));
  }
}

function renderFilms() {
  $("#page").innerHTML = `
    <div class="wrap page">
      <h1 class="page-title">Рецензии фильмов</h1>
      <div class="film-strip">
        <h2 class="block-title">С реакциями</h2>
        <p class="lede">Что MellSher уже смотрел: его оценка и оценка Кинопоиска. Нажми на карточку — откроется страница с описанием и реакцией.</p>
        <div class="film-grid">${filmsWithReaction().map(filmCard).join("")}</div>
      </div>
      <div class="film-strip">
        <h2 class="block-title">Только оценки</h2>
        <p class="lede">Фильмы без реакции на видео — оценки MellSher и Кинопоиска. Карточка открывает страницу фильма.</p>
        <div class="film-grid">${filmsScoresOnly().map(filmCard).join("")}</div>
      </div>
    </div>`;
}

function filmTakePhoto() {
  return `<div class="film-take-photo" aria-hidden="true">
      <img src="assets/mellsher-avatar.png" alt="">
    </div>`;
}

function filmCommentParagraphs(text) {
  return String(text)
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part)}</p>`)
    .join("");
}

function filmCommentBlock(item) {
  if (item.comment) {
    return `<aside class="film-take has-quote">
        <div class="film-take-top">
          ${filmTakePhoto()}
          <div class="film-take-meta">
            <strong>MellSher</strong>
            <span>комментарий к оценке</span>
          </div>
        </div>
        <blockquote class="film-quote">${filmCommentParagraphs(item.comment)}</blockquote>
      </aside>`;
  }
  if (item.reaction) {
    return `<aside class="film-take has-reaction">
        <div class="film-take-top">
          ${filmTakePhoto()}
          <div class="film-take-meta">
            <strong>MellSher</strong>
            <span>есть видеореакция</span>
          </div>
        </div>
        <p class="film-take-note">Разбор смотри в реакции — там оценка и всё, что Игорь сказал про фильм.</p>
        <a class="btn pink" href="${esc(item.reaction)}" target="_blank" rel="noopener noreferrer">Смотреть реакцию</a>
      </aside>`;
  }
  return `<aside class="film-take is-empty">
      <div class="film-take-top">
        ${filmTakePhoto()}
        <div class="film-take-meta">
          <strong>MellSher</strong>
          <span>без комментария</span>
        </div>
      </div>
      <p class="film-take-note">Игорь никак не прокомментировал фильм.</p>
    </aside>`;
}

function renderFilm() {
  const id = new URLSearchParams(location.search).get("id");
  const item = id ? filmById(id) : null;
  if (!item || item.stub) {
    $("#page").innerHTML = `<div class="wrap page"><h1 class="page-title">Фильм не найден</h1><p class="lede"><a class="text-link" href="films.html">Ко всем рецензиям</a></p></div>`;
    return;
  }
  document.title = `${item.title} — MellSher`;
  const more = FILMS.filter((other) => other.id !== item.id && !other.stub).slice(0, 8);
  const poster = item.image
    ? `<div class="film-hero-poster"><img src="${esc(item.image)}" alt="${esc(item.title)}"></div>`
    : `<div class="film-hero-poster stub"><strong>${esc(item.title)}</strong></div>`;
  const kicker = item.reaction ? "реакция MellSher" : "оценка MellSher";
  $("#page").innerHTML = `
    <section class="film-hero ${item.image ? "has-bg" : ""}" ${item.image ? `style="--film-bg:url('${esc(item.image)}')"` : ""}>
      <div class="film-hero-shade"></div>
      <div class="wrap film-hero-grid">
        ${poster}
        <div class="film-hero-copy">
          <p class="kicker"><a href="films.html">Фильмы</a> · ${kicker}${item.year ? ` · ${item.year}` : ""}</p>
          <h1 class="page-title">${esc(item.title)}</h1>
          ${item.genre ? `<p class="film-genre">${esc(item.genre)}</p>` : ""}
          <div class="score-cards">
            <div class="score-card score-card-ms">
              <span>MellSher</span>
              <strong>${filmScore(item.score)}</strong>
            </div>
            <div class="score-card">
              <span>Кинопоиск</span>
              <strong>${filmScore(item.kp)}</strong>
            </div>
          </div>
          <div class="film-hero-about">
            <h2 class="film-hero-about-title">О фильме</h2>
            <p>${esc(item.text || "Краткого описания пока нет — только оценка.")}</p>
          </div>
          <div class="actions">
            ${item.reaction
              ? `<a class="btn pink" href="${esc(item.reaction)}" target="_blank" rel="noopener noreferrer">Смотреть реакцию</a>`
              : ""}
            <a class="btn" href="films.html">Все фильмы</a>
          </div>
        </div>
      </div>
    </section>
    <div class="wrap page film-page">
      ${filmCommentBlock(item)}
      <section class="section film-more">
        ${sectionTitle("Ещё фильмы", "films.html", "Все оценки")}
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
  films: renderFilms,
  film: renderFilm,
};

const page = document.body.dataset.page;
mountChrome(page);
bindChrome();
bindActions(document);
pages[page]?.();
