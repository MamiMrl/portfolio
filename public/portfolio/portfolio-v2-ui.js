/* portfolio-v2-ui.js — UI layer: loader, entrance, chrome, scramble,
   magnetic links, Tesla counter, keyboard nav, console egg.
   Depends on: gsap, window._globeReady, window._portfolioGlobe,
   window._portfolioStops, window._portfolioNav (from portfolio-v2-globe.js) */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ════ 1. Loader + entrance choreography ════════════════ */

  const loader   = document.getElementById('loader');
  const barFill  = document.getElementById('loader-bar-fill');
  const pctEl    = document.getElementById('loader-pct');
  const coordsEl = document.getElementById('loader-coords');

  // Coordinates tick from Istanbul toward Bonn as the bar fills
  const FROM = { lat: 41.0082, lng: 28.9784 };
  const TO   = { lat: 50.7374, lng: 7.0982  };

  function fmtCoords(lat, lng) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${ns} / ${Math.abs(lng).toFixed(4)}° ${ew}`;
  }

  function reveal() {
    if (!loader) return;
    loader.classList.add('is-done');

    if (reducedMotion) {
      loader.style.display = 'none';
      return; // CSS reduced-motion rules already show everything
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => ScrollTrigger.refresh(),
    });
    tl.to(loader, { opacity: 0, duration: 0.5, onComplete: () => { loader.style.display = 'none'; } })
      .to('#globe-wrap', { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, '-=0.2')
      .to('.rl > *', { y: 0, duration: 0.9, stagger: 0.09 }, '-=1.0')
      .to(['.chrome', '.chrome__coords', '.hud-frame', '.hud-mission', '.dot-nav'], { opacity: 1, duration: 0.8 }, '-=0.5');
  }

  // Late layout shifts (web fonts, lazy images) invalidate trigger positions
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  if (loader && !reducedMotion) {
    const state = { p: 0 };
    let realDone = false;
    (window._globeReady || Promise.resolve()).then(() => { realDone = true; });

    // Systems check: lines appear, then resolve, as progress passes thresholds
    const sysLines = Array.from(document.querySelectorAll('#loader-sys [data-sys]'));
    const SYS_VIS = [0.04, 0.18, 0.34, 0.52, 0.86];
    const SYS_OK  = [0.14, 0.30, 0.48, 0.96, 0.995];

    // Progress: eases toward 90%, completes when textures are ready
    const start = performance.now();
    function tick(now) {
      const t = (now - start) / 1000;
      const target = realDone ? 1 : Math.min(0.9, 1 - Math.exp(-t * 1.4));
      state.p += (target - state.p) * 0.12;
      if (realDone && state.p > 0.995) state.p = 1;

      sysLines.forEach((li, i) => {
        if (state.p >= SYS_VIS[i]) li.classList.add('on');
        if (state.p >= SYS_OK[i])  li.classList.add('ok');
      });

      barFill.style.transform = `scaleX(${state.p})`;
      pctEl.textContent = String(Math.round(state.p * 100)).padStart(2, '0');
      const lat = FROM.lat + (TO.lat - FROM.lat) * state.p;
      const lng = FROM.lng + (TO.lng - FROM.lng) * state.p;
      coordsEl.textContent = fmtCoords(lat, lng);

      if (state.p >= 1) { setTimeout(reveal, 250); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    // Safety: never trap the visitor behind the curtain
    setTimeout(() => { realDone = true; }, 7000);
  } else {
    reveal();
  }

  /* ════ 2. Chrome: local time + camera coords ════════════ */

  const timeEl = document.getElementById('local-time');
  function updateClock() {
    if (!timeEl) return;
    const now = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
    });
    timeEl.textContent = `BONN, DE — ${now}`;
  }
  updateClock();
  setInterval(updateClock, 30 * 1000);

  const camCoordsEl = document.getElementById('cam-coords');
  if (camCoordsEl) {
    let last = 0;
    function pollCoords(now) {
      if (now - last > 120) {
        last = now;
        const g = window._portfolioGlobe;
        if (g) {
          const pov = g.pointOfView();
          camCoordsEl.textContent = fmtCoords(pov.lat, pov.lng);
        }
      }
      requestAnimationFrame(pollCoords);
    }
    requestAnimationFrame(pollCoords);
  }

  /* ════ 2b. Mission progress readout ══════════════ */

  const missionEl = document.getElementById('hud-mission');
  if (missionEl) {
    const pad2 = n => String(n).padStart(2, '0');
    let queued = false;
    function updateMission() {
      queued = false;
      const stops = window._portfolioStops || [];
      const active = window._portfolioNav && window._portfolioNav.getActiveStop();
      const idx = active ? stops.findIndex(s => s.id === active) + 1 : 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      missionEl.textContent = `LEG ${pad2(idx)} / ${pad2(stops.length)} · ${String(pct).padStart(3, '0')}%`;
    }
    window.addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(updateMission); }
    }, { passive: true });
    updateMission();
  }

  /* ════ 3. Scramble-in on city / project names ═══════════ */

  const GLYPHS = '!<>-_\\/[]{}—=+*^?#________';

  function scramble(el) {
    if (reducedMotion || el.dataset.scrambled) return;
    el.dataset.scrambled = '1';
    const finalText = el.textContent;
    const len = finalText.length;
    const t0 = performance.now();
    const DURATION = 700;

    function frame(now) {
      const p = Math.min(1, (now - t0) / DURATION);
      const settled = Math.floor(p * len);
      let out = finalText.slice(0, settled);
      for (let i = settled; i < len; i++) {
        out += finalText[i] === ' ' ? ' '
             : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = finalText;
    }
    requestAnimationFrame(frame);
  }

  const scrambleObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) scramble(e.target); });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-scramble]').forEach(el => scrambleObserver.observe(el));

  /* ════ 4. Magnetic links ════════════════════════════════ */

  if (!isTouch && !reducedMotion) {
    document.querySelectorAll('.magnetic').forEach(el => {
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ════ 5. Tesla counter — 10M+/day ≈ 116/sec ════════════ */

  const teslaEl = document.getElementById('tesla-count');
  if (teslaEl) {
    const RATE = 10_000_000 / 86_400; // per second
    const t0 = performance.now();
    let visible = false;

    const obs = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.2 });
    obs.observe(teslaEl.closest('.tesla-counter'));

    setInterval(() => {
      if (!visible) return;
      const n = Math.floor(((performance.now() - t0) / 1000) * RATE);
      teslaEl.textContent = n.toLocaleString('en-US');
    }, 120);
  }

  /* ════ 6. Keyboard nav: J/K + arrows between stops ══════ */

  const STOP_ORDER = ['hero', ...(window._portfolioStops || []).map(s => s.id)];

  function currentIndex() {
    const active = window._portfolioNav && window._portfolioNav.getActiveStop();
    if (!active) return 0;
    return Math.max(0, STOP_ORDER.indexOf(active));
  }

  function go(delta) {
    const idx = Math.max(0, Math.min(STOP_ORDER.length - 1, currentIndex() + delta));
    const id = STOP_ORDER[idx];
    if (id === 'hero') window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (window._portfolioNav) window._portfolioNav.scrollToStop(id);
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'j' || e.key === 'J') { e.preventDefault(); go(1); }
    if (e.key === 'k' || e.key === 'K') { e.preventDefault(); go(-1); }
  });

  /* ════ 7. Console easter egg ════════════════════════════ */

  try {
    console.log(
      '%c✈ Istanbul → Ljubljana → Ingolstadt → Berlin → Wuppertal → Bonn',
      'color:#9a7bff; font-family:monospace; font-size:12px;'
    );
    console.log(
      '%cYou read consoles. I like you already. → mami.maral@proton.me',
      'color:#efe8ff; font-family:monospace; font-size:12px;'
    );
    console.log(
      '%cThis globe: three.js + globe.gl, shader arcs, no frameworks, pixel ratio capped at 1.5 so your fans stay quiet.',
      'color:rgba(239,232,255,0.45); font-family:monospace; font-size:11px;'
    );
  } catch (_) { /* no-op */ }
})();
