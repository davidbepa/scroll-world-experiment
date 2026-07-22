/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight engine
   ----------------------------------------------------------------------------
   Framework-agnostic. Vanilla JS, zero dependencies. It builds its own DOM and
   injects its own namespaced CSS into the supplied container. The engine loads
   clips as Blobs for reliable seeking, coalesces seeks on phones, and preserves
   still posters until a decoded video frame has painted.
   ========================================================================== */

import {
  clamp, lingerEase, buildSegments, heroOpacity, sectionCopyOpacity,
  activeSectionIndex, segmentBlendWeights,
} from './timeline.js';

const FALLBACK_STILL = 'public/assets/fallback-system.svg';
const stylesheetRegistry = new WeakMap();

function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;
  const SECTIONS = config.sections || [];
  const CONNECTORS = config.connectors || [];
  const CONNECTORS_M = config.connectorsMobile || [];
  const DIVE_W = config.diveScroll || 1.3;
  const CONN_W = config.connScroll || 0.9;
  const CROSSFADE = config.crossfade != null ? config.crossfade : 0.12;
  const HERO = config.hero || null;
  const HERO_SCROLL = HERO?.scroll || 0;
  const N = SECTIONS.length;
  if (!N) return;

  const mathSegments = buildSegments({
    sections: SECTIONS,
    connectors: CONNECTORS,
    diveScroll: DIVE_W,
    connScroll: CONN_W,
    heroScroll: HERO_SCROLL,
  });

  const stylesheetLease = injectCSS();
  container.classList.add('sw-root');
  container.dataset.mode = 'film';

  const cleanups = [];
  const objectUrls = new Set();
  let destroyed = false;
  let animationFrame = 0;
  let readFrame = 0;

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  // Build the interleaved segment chain: dive0, conn0, dive1, … diveN-1.
  const SEGMENTS = [];
  SECTIONS.forEach((s, i) => {
    const dive = {
      kind: 'dive', si: i, clip: s.clip, clipM: s.clipMobile,
      still: s.still, stillM: s.stillMobile, accent: s.accent,
      w: s.scroll || DIVE_W, linger: s.linger || 0,
    };
    SEGMENTS.push(dive);
    s._seg = dive;
    if (i < N - 1 && CONNECTORS[i]) {
      SEGMENTS.push({
        kind: 'conn', si: i, clip: CONNECTORS[i], clipM: CONNECTORS_M[i],
        still: SECTIONS[i + 1].still, stillM: SECTIONS[i + 1].stillMobile,
        accent: SECTIONS[i + 1].accent, w: CONN_W,
      });
    }
  });
  const NSEG = SEGMENTS.length;
  const diveMathSegments = mathSegments.filter(segment => segment.kind === 'dive');

  // DOM.
  const sky = el('div', 'sw-sky');
  if (config.atmosphere !== false) {
    sky.appendChild(el('div', 'sw-sky__grad'));
    sky.appendChild(el('div', 'sw-sky__glow'));
  }
  const particles = el('div', 'sw-particles');
  sky.appendChild(particles);

  const scrollbar = el('div', 'sw-scrollbar');
  const scrollbarFill = el('span');
  scrollbar.appendChild(scrollbarFill);

  const topbar = el('div', 'sw-topbar');
  if (config.brand) {
    const brand = el('a', 'sw-brand');
    brand.href = config.brand.href || '#';
    brand.appendChild(el('span', 'sw-brand__mark'));
    const name = el('span', 'sw-brand__name');
    name.textContent = config.brand.name || '';
    brand.appendChild(name);
    topbar.appendChild(brand);
  }
  const nav = el('nav', 'sw-nav');
  if (config.nav !== false) topbar.appendChild(nav);
  if (config.cta?.label) {
    const cta = el('a', 'sw-topcta');
    cta.href = config.cta.href || '#';
    cta.textContent = config.cta.label;
    topbar.appendChild(cta);
  }

  const stage = el('div', 'sw-stage');
  const copylayer = el('div', 'sw-copylayer');
  const copyBackdrop = el('div', 'sw-copy-backdrop');
  copyBackdrop.dataset.side = 'left';
  copylayer.appendChild(copyBackdrop);
  const route = el('div', 'sw-route');
  route.setAttribute('aria-label', 'Case studies');
  const hint = el('div', 'sw-hint');
  const hintText = el('span');
  hintText.textContent = config.hint || 'scroll';
  hint.appendChild(hintText);
  hint.appendChild(el('i'));

  const status = el('div', 'sw-status');
  const statusCount = el('span', 'sw-status__count');
  statusCount.textContent = `${pad(1)} / ${pad(N)}`;
  const statusBar = el('span', 'sw-status__bar');
  const statusFill = el('i');
  statusBar.appendChild(statusFill);
  const statusLabel = el('span', 'sw-status__label');
  statusLabel.textContent = 'Scroll to explore';
  status.append(statusCount, statusBar, statusLabel);

  const track = el('div', 'sw-track');
  const mountedNodes = [sky, scrollbar, topbar, stage, copylayer, route, hint, status, track];
  mountedNodes.forEach(node => container.appendChild(node));

  // Segment scenes.
  SEGMENTS.forEach((s, index) => {
    const scene = el('div', 'sw-scene');
    scene.style.zIndex = String(100 + index);
    scene.style.setProperty('--sw-accent', s.accent || '');
    const img = el('img', 'sw-scene__still');
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.onerror = () => {
      img.onerror = null;
      img.src = FALLBACK_STILL;
    };
    const poster = isMobile() && s.stillM ? s.stillM : s.still;
    if (poster) img.src = poster;
    scene.appendChild(img);
    stage.appendChild(scene);
    Object.assign(s, {
      el: scene, img, video: null, hasClip: false, loading: false,
      ready: false, painted: false, failed: false, objectUrl: null,
      cur: 0, target: 0, visible: false,
    });
  });

  // Hero prelude.
  let hero = null;
  if (HERO) {
    hero = el('article', 'sw-hero');
    hero.dataset.side = HERO.copySide === 'right' ? 'right' : 'left';
    hero.setAttribute('aria-labelledby', 'sw-hero-title');
    hero.innerHTML =
      (HERO.eyebrow ? `<span class="sw-hero__eyebrow">${esc(HERO.eyebrow)}</span>` : '') +
      (HERO.title ? `<h1 class="sw-hero__title" id="sw-hero-title">${esc(HERO.title)}</h1>` : '') +
      (HERO.body ? `<p class="sw-hero__body">${esc(HERO.body)}</p>` : '') +
      (HERO.cta?.label ? `<a class="sw-btn sw-btn--primary" href="${esc(HERO.cta.href || '#')}">${esc(HERO.cta.label)}</a>` : '');
    copylayer.appendChild(hero);
  }

  // Per-section copy, route, and optional engine nav.
  const copies = [];
  const dots = [];
  SECTIONS.forEach((s, i) => {
    const copy = el('article', 'sw-copy');
    copy.id = s.id || '';
    copy.dataset.side = s.copySide === 'right' ? 'right' : 'left';
    copy.style.setProperty('--sw-accent', s.accent || '');
    copy.innerHTML =
      `<span class="sw-copy__num">${pad(i + 1)} / ${pad(N)}</span>` +
      (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : '') +
      (s.title ? `<h2 class="sw-copy__title">${esc(s.title)}</h2>` : '') +
      (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : '') +
      (s.tags?.length ? `<ul class="sw-copy__tags">${s.tags.map(tag => `<li>${esc(tag)}</li>`).join('')}</ul>` : '') +
      (s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : '');
    copylayer.appendChild(copy);
    copies.push(copy);

    const dot = el('button', 'sw-route__dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Jump to ${s.label}`);
    dot.style.setProperty('--sw-accent', s.accent || '');
    dot.innerHTML = `<span class="sw-route__label">${esc(s.label || '')}</span><i></i>`;
    const onDotClick = () => jumpTo(i);
    listen(dot, 'click', onDotClick);
    route.appendChild(dot);
    dots.push(dot);

    if (config.nav !== false) {
      const button = el('button', 'sw-nav__item');
      button.type = 'button';
      button.textContent = s.label || '';
      const onNavClick = () => jumpTo(i);
      listen(button, 'click', onNavClick);
      nav.appendChild(button);
    }
  });

  let vh = window.innerHeight;
  let stageX = 0;
  let totalW = 0;
  let activeIndex = -1;
  let currentSegmentIndex = 0;
  let ticking = false;
  let laidOutW = window.innerWidth;

  function layout() {
    if (destroyed) return;
    vh = window.innerHeight;
    laidOutW = window.innerWidth;
    stageX = window.innerWidth > 860 ? 4 : 0;
    SEGMENTS.forEach((segment, index) => {
      segment.start = mathSegments[index].start * vh;
      segment.end = mathSegments[index].end * vh;
    });
    totalW = mathSegments.at(-1)?.end || HERO_SCROLL;
    track.style.height = `${totalW * vh + vh}px`;
    read();
  }

  function jumpTo(index) {
    const segment = SECTIONS[index]?._seg;
    if (!segment) return;
    window.scrollTo({
      top: segment.start + (segment.end - segment.start) * 0.5,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  function markMediaError(s, video = null) {
    if (s.failed) return;
    s.failed = true;
    s.loading = false;
    s.ready = false;
    s.hasClip = false;
    s.painted = false;
    s.el.classList.remove('has-clip');
    s.el.classList.add('is-media-error');
    if (video?.parentNode === s.el) video.remove();
    if (s.objectUrl) {
      URL.revokeObjectURL(s.objectUrl);
      objectUrls.delete(s.objectUrl);
      s.objectUrl = null;
    }
  }

  function loadClip(s) {
    if (reduce || s.loading || s.failed || !s.clip || destroyed) return;
    s.loading = true;
    const url = isMobile() && s.clipM ? s.clipM : s.clip;
    fetch(url)
      .then(response => response.ok ? response.blob() : Promise.reject(new Error(`Media request failed: ${response.status}`)))
      .then(blob => {
        if (destroyed) return;
        const video = document.createElement('video');
        video.className = 'sw-scene__video';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.add(objectUrl);
        s.objectUrl = objectUrl;
        video.src = objectUrl;
        listen(video, 'loadedmetadata', () => {
          if (destroyed || s.failed) return;
          s.ready = true;
          read();
        });
        listen(video, 'seeked', () => {
          s.painted = true;
          read();
        }, { once: true });
        listen(video, 'loadeddata', () => {
          try { video.pause(); } catch (error) { /* no-op */ }
          if (userReady) primeVideo(video);
        });
        listen(video, 'error', () => markMediaError(s, video), { once: true });
        s.el.appendChild(video);
        s.video = video;
        s.hasClip = true;
      })
      .catch(() => markMediaError(s));
  }

  function read() {
    if (destroyed) return;
    const y = window.scrollY || window.pageYOffset;
    const fade = CROSSFADE * vh;
    const blendWeights = segmentBlendWeights(y, SEGMENTS, fade);
    let ci = 0;
    for (let i = 0; i < NSEG; i += 1) if (y >= SEGMENTS[i].start) ci = i;
    currentSegmentIndex = ci;

    for (let i = 0; i < NSEG; i += 1) {
      const s = SEGMENTS[i];
      if (y > s.start - 1.6 * vh && y < s.end + 1.6 * vh) loadClip(s);
      const local = clamp((y - s.start) / (s.end - s.start));
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      const opacity = blendWeights[i];
      const inHeroBand = i === 0 && HERO && y <= s.start;
      s.el.classList.toggle('has-clip', s.painted && !s.failed && !inHeroBand);
      s.el.style.opacity = opacity;
      s.visible = opacity > 0.001;
      if (!s.hasClip || !s.ready) {
        const scale = reduce ? 1 : 1.03 + local * 0.14;
        s.img.style.transform = `translateX(${stageX - 2}vw) scale(${scale.toFixed(3)})`;
      }
    }

    const position = y / vh;
    let backdropOpacity = 0;
    let backdropSide = 'left';
    if (hero) {
      const opacity = heroOpacity(position, HERO_SCROLL);
      hero.style.opacity = opacity;
      hero.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      if (opacity > backdropOpacity) {
        backdropOpacity = opacity;
        backdropSide = hero.dataset.side;
      }
    }
    for (let i = 0; i < N; i += 1) {
      const segment = diveMathSegments[i];
      const progress = clamp((position - segment.start) / (segment.end - segment.start));
      const opacity = sectionCopyOpacity({
        index: i,
        count: N,
        position,
        segment,
        hasHero: Boolean(HERO),
      });
      const copy = copies[i];
      copy.style.opacity = opacity;
      copy.style.transform = reduce ? 'none' : `translateY(${(0.5 - progress) * 4}vh)`;
      copy.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
      if (opacity > backdropOpacity) {
        backdropOpacity = opacity;
        backdropSide = copy.dataset.side;
      }
    }
    copyBackdrop.dataset.side = backdropSide;
    copyBackdrop.style.opacity = backdropOpacity;

    const near = activeSectionIndex(position, mathSegments, N);
    if (near !== activeIndex) {
      activeIndex = near;
      dots.forEach((dot, index) => {
        const active = index === activeIndex;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      nav.querySelectorAll('.sw-nav__item').forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
      container.style.setProperty('--sw-accent', SECTIONS[activeIndex].accent || '');
      statusCount.textContent = `${pad(activeIndex + 1)} / ${pad(N)}`;
      statusFill.style.transform = `scaleX(${(activeIndex + 1) / N})`;
    }
    scrollbarFill.style.transform = `scaleX(${clamp(y / (totalW * vh))})`;
    hint.style.opacity = clamp(1 - y / (0.5 * vh));
    particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
    ticking = false;
    readFrame = 0;
  }

  function raf() {
    if (destroyed) return;
    const epsilon = isMobile() ? 0.02 : 0.008;
    for (let i = 0; i < NSEG; i += 1) {
      const s = SEGMENTS[i];
      if (!s.hasClip || !s.ready || !s.video || s.failed) continue;
      if (s.video.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18);
      const duration = s.video.duration || 1;
      const targetTime = clamp(s.cur, 0, 0.999) * duration;
      if (Math.abs(s.video.currentTime - targetTime) > epsilon) {
        try { s.video.currentTime = targetTime; } catch (error) { /* no-op */ }
      }
    }
    animationFrame = requestAnimationFrame(raf);
  }

  let userReady = false;
  function primeVideo(video) {
    if (!isMobile() || !video) return;
    try {
      const play = video.play();
      if (play?.then) play.then(() => {
        try { video.pause(); } catch (error) { /* no-op */ }
      }).catch(() => {});
    } catch (error) { /* no-op */ }
  }

  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    SEGMENTS.forEach(segment => primeVideo(segment.video));
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      readFrame = requestAnimationFrame(read);
    }
  }

  function onResize() {
    if (coarse && window.innerWidth === laidOutW) return;
    layout();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cleanups.splice(0).forEach(cleanup => cleanup());
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(readFrame);
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls.clear();
    SEGMENTS.forEach(segment => { segment.img.onerror = null; });
    mountedNodes.forEach(node => node.remove());
    container.classList.remove('sw-root');
    delete container.dataset.mode;
    releaseCSS(stylesheetLease);
  }

  listen(window, 'pointerdown', onFirstGesture, { once: true, passive: true });
  listen(window, 'touchstart', onFirstGesture, { once: true, passive: true });
  seedParticles(particles, reduce || coarse);
  listen(window, 'scroll', onScroll, { passive: true });
  listen(window, 'resize', onResize);
  listen(window, 'orientationchange', layout);
  listen(window, 'load', layout);
  layout();
  animationFrame = requestAnimationFrame(raf);

  return {
    jumpTo,
    getState: () => ({ activeIndex, segmentIndex: currentSegmentIndex, totalScroll: totalW }),
    destroy,
  };

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[character]));
  }

  function ctaBtns(cta) {
    let html = '';
    if (cta.primary) html += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    if (cta.secondary) html += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    return html;
  }
}

function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97];
  for (let index = 0; index < 20; index += 1) {
    const particle = document.createElement('span');
    particle.className = `sw-pt sw-pt--${kinds[index % kinds.length]}`;
    particle.style.left = `${seeds[index % seeds.length]}vw`;
    particle.style.top = `${(seeds[(index * 3) % seeds.length] * 1.3) % 100}vh`;
    particle.style.setProperty('--sw-sc', (0.5 + ((seeds[(index * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const duration = 14 + (seeds[(index * 7) % seeds.length] % 22);
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${-(seeds[(index * 2) % seeds.length] % duration)}s`;
    host.appendChild(particle);
  }
}

function injectCSS() {
  const existing = document.getElementById('sw-css');
  const registered = stylesheetRegistry.get(document);
  if (existing) {
    if (registered?.element === existing) {
      registered.users += 1;
      return registered;
    }
    return null;
  }
  stylesheetRegistry.delete(document);
  const css = `
  .sw-root{--sw-bg:#F5EDE0;--sw-ink:#241d2b;--sw-ink-soft:#6a6072;--sw-accent:#8a7bb5;
    --sw-font-display:ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;
    --sw-font-body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;
    color:var(--sw-ink);font-family:var(--sw-font-body);}
  html,body{margin:0;background:var(--sw-bg,#F5EDE0);overflow-x:hidden;}
  .sw-sky{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--sw-bg);}
  .sw-sky__grad{position:absolute;inset:-10%;background:linear-gradient(178deg,color-mix(in srgb,var(--sw-accent) 12%,var(--sw-bg)) 0%,var(--sw-bg) 55%,color-mix(in srgb,var(--sw-accent) 6%,var(--sw-bg)) 100%);}
  .sw-sky__glow{position:absolute;inset:0;background:radial-gradient(60% 42% at 74% 16%,color-mix(in srgb,var(--sw-accent) 22%,transparent),transparent 70%),radial-gradient(46% 34% at 50% 50%,color-mix(in srgb,#fff 45%,transparent),transparent 70%);}
  .sw-particles{position:absolute;inset:-6% -2%;will-change:transform;}
  .sw-pt{position:absolute;width:13px;height:13px;transform:scale(var(--sw-sc,1));opacity:0;animation:sw-drift linear infinite;}
  .sw-pt::before{content:"";position:absolute;inset:0;border-radius:50%;}
  .sw-pt--dot::before{background:radial-gradient(circle at 34% 30%,color-mix(in srgb,var(--sw-accent) 60%,#000),#000 82%);}
  .sw-pt--ring::before{background:transparent;border:2px solid color-mix(in srgb,var(--sw-accent) 55%,transparent);}
  @keyframes sw-drift{0%{opacity:0;transform:scale(var(--sw-sc)) translate(0,12vh) rotate(0)}12%{opacity:.5}88%{opacity:.45}100%{opacity:0;transform:scale(var(--sw-sc)) translate(4vw,-22vh) rotate(210deg)}}
  .sw-scrollbar{position:fixed;top:0;left:0;right:0;height:3px;z-index:60;background:color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-scrollbar span{display:block;height:100%;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--sw-accent);}
  .sw-topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(14px,2.4vw,26px) clamp(18px,5vw,64px);}
  .sw-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--sw-ink);}
  .sw-brand__mark{width:24px;height:28px;border-radius:7px 7px 10px 10px;background:linear-gradient(160deg,var(--sw-accent),color-mix(in srgb,var(--sw-accent) 60%,#000));box-shadow:0 6px 14px color-mix(in srgb,var(--sw-accent) 40%,transparent);}
  .sw-brand__name{font-family:var(--sw-font-display);font-weight:700;font-size:1.1rem;}
  .sw-nav{display:flex;gap:4px;padding:5px;background:color-mix(in srgb,#fff 55%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);border-radius:999px;}
  .sw-nav__item{font:inherit;font-size:.82rem;color:var(--sw-ink-soft);border:0;background:transparent;cursor:pointer;padding:7px 14px;border-radius:999px;transition:color .25s,background .25s;}
  .sw-nav__item:hover{color:var(--sw-ink)}.sw-nav__item.is-active{color:#fff;background:var(--sw-accent);}
  .sw-topcta{text-decoration:none;font-weight:600;font-size:.9rem;color:#fff;background:var(--sw-ink);padding:10px 20px;border-radius:999px;white-space:nowrap;}
  .sw-stage{position:fixed;inset:0;z-index:10;pointer-events:none;}
  .sw-scene{position:absolute;inset:0;opacity:0;overflow:hidden;will-change:opacity;}
  .sw-scene__video,.sw-scene__still{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 42%;}
  .sw-scene__still{will-change:transform}.sw-scene.has-clip .sw-scene__still{opacity:0}
  .sw-scene__video{z-index:1;opacity:0;visibility:hidden;}.sw-scene.has-clip .sw-scene__video{opacity:1;visibility:visible;}
  .sw-copylayer{position:fixed;inset:0;z-index:20;pointer-events:none;}
  .sw-copy-backdrop{position:absolute;inset:0 auto 0 0;z-index:0;width:min(58vw,780px);opacity:0;will-change:opacity;background:linear-gradient(90deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
  .sw-copy-backdrop[data-side="right"]{left:auto;right:0;transform:scaleX(-1);}
  .sw-copy,.sw-hero{position:absolute;z-index:1;left:clamp(18px,5vw,64px);right:auto;top:50%;transform:translateY(-50%);width:min(42vw,520px);opacity:0;will-change:opacity,transform;text-align:left;}
  .sw-copy[data-side="right"],.sw-hero[data-side="right"]{left:auto;right:clamp(18px,5vw,64px);text-align:right;}
  .sw-copy[data-side="right"] .sw-copy__body,.sw-hero[data-side="right"] .sw-hero__body{margin-left:auto;}
  .sw-copy[data-side="right"] .sw-copy__tags,.sw-copy[data-side="right"] .sw-copy__cta{justify-content:flex-end;}
  .sw-copy__num{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.12em;color:var(--sw-ink-soft);}
  .sw-copy__eyebrow,.sw-hero__eyebrow{display:block;margin-top:18px;font-family:var(--sw-font-display);font-weight:700;font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--sw-accent);}
  .sw-copy__title,.sw-hero__title{font-family:var(--sw-font-display);font-weight:700;color:var(--sw-ink);font-size:clamp(2rem,4.4vw,3.5rem);line-height:1.03;margin:12px 0 0;letter-spacing:-.01em;text-shadow:0 2px 20px color-mix(in srgb,var(--sw-bg) 70%,transparent);}
  .sw-hero__title{font-size:clamp(3rem,6vw,5.8rem);line-height:.92;}
  .sw-copy__body,.sw-hero__body{margin-top:18px;font-size:clamp(1rem,1.25vw,1.14rem);line-height:1.55;color:color-mix(in srgb,var(--sw-ink) 78%,var(--sw-ink-soft));max-width:40ch;text-shadow:0 1px 12px color-mix(in srgb,var(--sw-bg) 90%,transparent);}
  .sw-copy__tags{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;}
  .sw-copy__tags li{font-size:.82rem;font-weight:600;color:color-mix(in srgb,var(--sw-accent) 70%,#000);padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--sw-accent) 14%,#fff);border:1px solid color-mix(in srgb,var(--sw-accent) 30%,transparent);}
  .sw-copy__cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;pointer-events:auto;}
  .sw-hero>.sw-btn{display:inline-block;margin-top:12px;pointer-events:auto;}
  .sw-btn{text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 24px;border-radius:999px;transition:transform .2s;}
  .sw-btn--primary{color:#fff;background:var(--sw-ink)}.sw-btn--primary:hover{transform:translateY(-2px);}
  .sw-btn--ghost{color:var(--sw-ink);border:1.5px solid color-mix(in srgb,var(--sw-ink) 25%,transparent)}.sw-btn--ghost:hover{transform:translateY(-2px);}
  .sw-route{position:fixed;right:clamp(14px,2.4vw,30px);top:50%;z-index:40;transform:translateY(-50%);display:flex;flex-direction:column;gap:22px;padding:18px 10px;}
  .sw-route::before{content:"";position:absolute;left:50%;top:22px;bottom:22px;width:2px;transform:translateX(-50%);background:var(--sw-accent);opacity:.28;}
  .sw-route__dot{position:relative;border:0;background:transparent;cursor:pointer;width:14px;height:14px;display:grid;place-items:center;}
  .sw-route__dot i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--sw-accent) 40%,transparent);transition:transform .3s,background .3s,box-shadow .3s;}
  .sw-route__dot:hover i{transform:scale(1.25);background:var(--sw-accent)}.sw-route__dot.is-active i{background:var(--sw-accent);transform:scale(1.4);box-shadow:0 0 0 5px color-mix(in srgb,var(--sw-accent) 22%,transparent);}
  .sw-route__label{position:absolute;right:24px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;font-size:.78rem;font-weight:600;color:var(--sw-ink);background:color-mix(in srgb,#fff 85%,transparent);backdrop-filter:blur(6px);padding:5px 11px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;border:1px solid color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-route__dot:hover .sw-route__label,.sw-route__dot.is-active .sw-route__label{opacity:1;transform:translateY(-50%) translateX(0);}
  .sw-hint{position:fixed;left:50%;bottom:26px;z-index:30;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft);transition:opacity .3s;}
  .sw-hint i{width:22px;height:34px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sw-ink) 28%,transparent);position:relative;}
  .sw-hint i::after{content:"";position:absolute;left:50%;top:7px;width:4px;height:7px;border-radius:2px;background:var(--sw-accent);transform:translateX(-50%);animation:sw-wheel 1.7s ease-in-out infinite;}
  @keyframes sw-wheel{0%{opacity:0;top:6px}40%{opacity:1}100%{opacity:0;top:17px}}
  .sw-status{position:fixed;left:50%;bottom:26px;z-index:35;transform:translateX(-50%);display:flex;align-items:center;gap:14px;}
  .sw-status__count{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.1em;}
  .sw-status__bar{display:block;width:112px;height:3px;background:color-mix(in srgb,var(--sw-ink) 18%,transparent);overflow:hidden;}
  .sw-status__bar i{display:block;width:100%;height:100%;background:var(--sw-accent);transform:scaleX(0);transform-origin:left center;transition:transform .3s;}
  .sw-status__label{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--sw-ink-soft);}
  .sw-track{position:relative;z-index:1;width:100%;pointer-events:none;}
  @media(max-width:860px){
    .sw-nav{display:none}.sw-copy-backdrop,.sw-copy-backdrop[data-side="right"]{left:0;right:0;width:100%;height:60%;top:auto;bottom:0;transform:none;background:linear-gradient(0deg,var(--sw-bg) 8%,color-mix(in srgb,var(--sw-bg) 70%,transparent) 46%,transparent 100%);}
    .sw-copy,.sw-copy[data-side="right"],.sw-hero{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
    .sw-copy,.sw-copy[data-side="right"],.sw-hero{bottom:calc(clamp(56px,12dvh,110px) + env(safe-area-inset-bottom));}
    .sw-copy__title{font-size:clamp(1.9rem,7.5vw,2.7rem)}.sw-copy__body{max-width:none;font-size:clamp(.98rem,3.6vw,1.1rem)}.sw-scene__video,.sw-scene__still{object-position:center 46%;}
    .sw-hint{bottom:calc(20px + env(safe-area-inset-bottom))}.sw-route{gap:16px;right:6px}.sw-route__label{display:none}.sw-status{display:none;}
  }
  @media(max-width:860px) and (orientation:portrait){.sw-scene__video,.sw-scene__still{object-position:center 44%;}}
  @media(hover:none) and (pointer:coarse){.sw-route{padding:14px 6px}.sw-route__dot{width:28px;height:28px}.sw-btn{padding:15px 26px;}}
  @media(prefers-reduced-motion:reduce){.sw-hint i::after{animation:none}.sw-pt{display:none}}
  `;
  const style = document.createElement('style');
  style.id = 'sw-css';
  style.textContent = `@layer sw {\n${css}\n}`;
  document.head.appendChild(style);
  const lease = { document, element: style, users: 1 };
  stylesheetRegistry.set(document, lease);
  return lease;
}

function releaseCSS(lease) {
  if (!lease || stylesheetRegistry.get(lease.document) !== lease) return;
  lease.users -= 1;
  if (lease.users > 0) return;
  lease.element.remove();
  stylesheetRegistry.delete(lease.document);
}

export { mountScrollWorld };
