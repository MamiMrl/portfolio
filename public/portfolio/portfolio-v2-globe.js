/* portfolio-v2-globe.js — Globe setup + GSAP scroll choreography (v2) */
/* v2 adds: globe-ready signal for the loader, Selected Work pullback,
   dot-nav click navigation, work/contact stops, exposed stop targets
   for keyboard nav. Dependencies: globe.gl, gsap, ScrollTrigger */

(function () {
  'use strict';

  // ── City data (single-point stops) ─────────────────────────
  const CITIES = [
    { id: 'istanbul',   label: 'Istanbul',   lat: 41.0082, lng: 28.9784, alt: 0.28, color: '#f59e0b' },
    { id: 'ingolstadt', label: 'Ingolstadt', lat: 48.7665, lng: 11.4258, alt: 0.22, color: '#60a5fa' },
    { id: 'berlin',     label: 'Berlin',     lat: 52.5200, lng: 13.4050, alt: 0.28, color: '#22d3ee' },
    { id: 'wuppertal',  label: 'Wuppertal',  lat: 51.2562, lng: 7.1508,  alt: 0.20, color: '#34d399' },
    { id: 'bonn',       label: 'Bonn',       lat: 50.7374, lng: 7.0982,  alt: 0.22, color: '#f472b6' },
  ];
  const cityById = id => CITIES.find(c => c.id === id);

  // ── Erasmus interlude (multi-point constellation) ──────────
  const ERASMUS_COLOR = '#9a7bff';
  const LJUBLJANA = { id: 'ljubljana', label: 'Ljubljana', lat: 46.0569, lng: 14.5058, color: ERASMUS_COLOR };
  const EUROPE_VIEW = { lat: 46.5, lng: 9.5, alt: 1.05 };
  const ERASMUS_TRIPS = [
    { country: 'czech',       city: 'Prague',    lat: 50.0755, lng: 14.4378 },
    { country: 'poland',      city: 'Kraków',    lat: 50.0647, lng: 19.9450 },
    { country: 'austria',     city: 'Vienna',    lat: 48.2082, lng: 16.3738 },
    { country: 'switzerland', city: 'Zürich',    lat: 47.3769, lng: 8.5417  },
    { country: 'france',      city: 'Paris',     lat: 48.8566, lng: 2.3522  },
    { country: 'spain',       city: 'Barcelona', lat: 41.3874, lng: 2.1686  },
    { country: 'italy',       city: 'Rome',      lat: 41.9028, lng: 12.4964 },
    { country: 'monaco',      city: 'Monaco',    lat: 43.7384, lng: 7.4246  },
  ];

  // ── Ordered journey stops (drives dot nav + keyboard nav) ──
  const STOPS = [
    { id: 'istanbul',   label: 'Istanbul',   color: '#f59e0b', sel: '.chapter[data-city="istanbul"]' },
    { id: 'erasmus',    label: 'Erasmus',    color: ERASMUS_COLOR, sel: '.chapter[data-city="erasmus"]' },
    { id: 'ingolstadt', label: 'Ingolstadt', color: '#60a5fa', sel: '.chapter[data-city="ingolstadt"]' },
    { id: 'berlin',     label: 'Berlin',     color: '#22d3ee', sel: '.chapter[data-city="berlin"]' },
    { id: 'wuppertal',  label: 'Wuppertal',  color: '#34d399', sel: '.chapter[data-city="wuppertal"]' },
    { id: 'bonn',       label: 'Bonn',       color: '#f472b6', sel: '.chapter[data-city="bonn"]' },
    { id: 'work',       label: 'Work',       color: '#facc15', sel: '.work-intro' },
    { id: 'contact',    label: 'Contact',    color: '#9a7bff', sel: '.end-stage' },
  ];

  const INITIAL_VIEW  = { lat: 22, lng: 14, alt: 2.5 };
  const WORK_VIEW     = { lat: 38, lng: -2, alt: 2.0 };
  const TRANSIT_ALT   = 1.55;
  const MAX_DIST_KM   = 2500;

  // ── Utilities ──────────────────────────────────────────────
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2
            + Math.cos(a.lat * Math.PI / 180)
            * Math.cos(b.lat * Math.PI / 180)
            * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ── Globe init ─────────────────────────────────────────────
  const container = document.getElementById('globe-wrap');

  let globeReadyResolve;
  window._globeReady = new Promise(res => { globeReadyResolve = res; });

  const globe = Globe({ animateIn: false, rendererConfig: { antialias: true } })(container)
    .width(window.innerWidth)
    .height(window.innerHeight)
    .backgroundColor('rgba(0,0,0,0)')
    .globeImageUrl('textures/earth-night.jpg')
    .bumpImageUrl('textures/earth-topology.png')
    .showAtmosphere(true)
    .atmosphereColor('#7a5cff')
    .atmosphereAltitude(0.22)
    .onGlobeReady(() => globeReadyResolve());

  globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const controls = globe.controls();
  controls.enableZoom   = false;
  controls.enablePan    = false;
  controls.enableRotate = false;
  controls.autoRotate      = true;
  controls.autoRotateSpeed = 0.25;

  globe.pointOfView(INITIAL_VIEW, 0);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? globe.pauseAnimation() : globe.resumeAnimation();
  });
  window.addEventListener('resize', () => {
    globe.width(window.innerWidth).height(window.innerHeight);
  });

  // ── Dot nav (built from STOPS, clickable) ──────────────────
  const navEl = document.querySelector('.dot-nav');
  STOPS.forEach((stop, i) => {
    if (i > 0) {
      const conn = document.createElement('div');
      conn.className = 'dot-nav__connector';
      navEl.appendChild(conn);
    }
    const item = document.createElement('div');
    item.className = 'dot-nav__item';
    const dot = document.createElement('button');
    dot.className = 'dot-nav__dot';
    dot.dataset.stop = stop.id;
    dot.setAttribute('aria-label', stop.label);
    dot.style.setProperty('--city-color', stop.color);
    dot.addEventListener('click', () => scrollToStop(stop.id));
    const lbl = document.createElement('span');
    lbl.className = 'dot-nav__label';
    lbl.textContent = stop.label;
    lbl.style.setProperty('--city-color', stop.color);
    item.appendChild(dot);
    item.appendChild(lbl);
    navEl.appendChild(item);
  });

  let activeStopId = null;
  function setActiveDot(id) {
    activeStopId = id;
    navEl.querySelectorAll('.dot-nav__dot').forEach(d => {
      d.classList.toggle('active', d.dataset.stop === id);
    });
  }

  // Scroll so the stop's sticky frame is fully engaged
  function scrollToStop(id) {
    const stop = STOPS.find(s => s.id === id);
    if (!stop) return;
    const el = document.querySelector(stop.sel);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    // For tall sticky chapters land 1 viewport in, so the scene is settled
    const offset = el.classList.contains('chapter') ? window.innerHeight * 0.6 : 0;
    window.scrollTo({ top: top + offset, behavior: 'smooth' });
  }

  // ── Marker helpers ─────────────────────────────────────────
  const mardinDot = [{ lat: 37.3137, lng: 40.7349, mardin: true }];

  function makeLabel(d) {
    const el = document.createElement('div');
    el.className = 'globe-label';
    el.textContent = d.label;
    el.style.setProperty('--label-color', d.color);
    return el;
  }

  function showCityMarker(city) {
    globe
      .pointsData([...mardinDot, { lat: city.lat, lng: city.lng, mardin: false, color: city.color }])
      .pointColor(d => d.mardin ? 'rgba(154,123,255,0.12)' : d.color)
      .pointAltitude(d => d.mardin ? 0.002 : 0.006)
      .pointRadius(d => d.mardin ? 0.15 : 0.35)
      .ringsData([{ lat: city.lat, lng: city.lng }])
      .ringColor(() => city.color + 'bb')
      .ringMaxRadius(3)
      .ringPropagationSpeed(1.2)
      .ringRepeatPeriod(1100)
      .htmlElementsData([{ lat: city.lat, lng: city.lng, label: city.label, color: city.color }])
      .htmlElement(makeLabel);
  }

  function hideCityMarker() {
    globe
      .pointsData(mardinDot)
      .pointColor(() => 'rgba(154,123,255,0.12)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)
      .ringsData([])
      .htmlElementsData([]);
  }

  // ── Arc layers: persistent trail + erasmus constellation ───
  let trailArcs = [];
  let constellationArcs = [];

  function syncArcs() {
    globe
      .arcsData([...trailArcs, ...constellationArcs])
      .arcColor(d => [d.startColor, d.endColor])
      .arcDashLength(0.38)
      .arcDashGap(0.72)
      .arcDashAnimateTime(3200)
      .arcStroke(0.45);
  }
  function addArc(from, to) {
    const id = `${from.id}-${to.id}`;
    if (trailArcs.some(a => a.id === id)) return;
    trailArcs = [...trailArcs, {
      id,
      startLat: from.lat, startLng: from.lng,
      endLat: to.lat, endLng: to.lng,
      startColor: from.color, endColor: to.color,
    }];
    syncArcs();
  }
  function removeArc(from, to) {
    const id = `${from.id}-${to.id}`;
    trailArcs = trailArcs.filter(a => a.id !== id);
    syncArcs();
  }
  function clearConstellation() {
    if (!constellationArcs.length) return;
    constellationArcs = [];
    syncArcs();
  }

  // ── Erasmus constellation render ───────────────────────────
  const countryEls = {};
  document.querySelectorAll('.erasmus__countries li').forEach(li => {
    countryEls[li.dataset.country] = li;
  });
  const counterEl = document.querySelector('.erasmus__counter b[data-count]');

  let lastReveal = -1;

  function showErasmusConstellation(reveal) {
    reveal = clamp(reveal, 0, ERASMUS_TRIPS.length);
    const dests = ERASMUS_TRIPS.slice(0, reveal);

    globe
      .pointsData([
        ...mardinDot,
        { lat: LJUBLJANA.lat, lng: LJUBLJANA.lng, color: ERASMUS_COLOR, home: true },
        ...dests.map(t => ({ lat: t.lat, lng: t.lng, color: ERASMUS_COLOR })),
      ])
      .pointColor(d => d.mardin ? 'rgba(154,123,255,0.12)' : d.color)
      .pointAltitude(d => d.mardin ? 0.002 : 0.006)
      .pointRadius(d => d.mardin ? 0.15 : (d.home ? 0.45 : 0.26))
      .ringsData([{ lat: LJUBLJANA.lat, lng: LJUBLJANA.lng }])
      .ringColor(() => ERASMUS_COLOR + 'bb')
      .ringMaxRadius(3.5)
      .ringPropagationSpeed(1.4)
      .ringRepeatPeriod(1000)
      .htmlElementsData([{ lat: LJUBLJANA.lat, lng: LJUBLJANA.lng, label: 'Ljubljana', color: ERASMUS_COLOR }])
      .htmlElement(makeLabel);

    constellationArcs = dests.map((t, i) => ({
      id: `eras-${i}`,
      startLat: LJUBLJANA.lat, startLng: LJUBLJANA.lng,
      endLat: t.lat, endLng: t.lng,
      startColor: ERASMUS_COLOR, endColor: ERASMUS_COLOR,
    }));
    syncArcs();
  }

  function updateErasmusList(reveal) {
    ERASMUS_TRIPS.forEach((t, i) => {
      const el = countryEls[t.country];
      if (el) el.classList.toggle('lit', i < reveal);
    });
    if (counterEl) counterEl.textContent = String(1 + clamp(reveal, 0, ERASMUS_TRIPS.length));
  }

  function setErasmus(reveal) {
    reveal = clamp(reveal, 0, ERASMUS_TRIPS.length);
    if (reveal === lastReveal) return;
    lastReveal = reveal;
    showErasmusConstellation(reveal);
    updateErasmusList(reveal);
  }

  // Init
  hideCityMarker();

  // ── GSAP scroll choreography ───────────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // — Hero: text fade + zoom to Istanbul —
  const heroStage = document.querySelector('.hero-stage');
  const heroEl    = document.querySelector('.hero');

  gsap.to(heroEl, {
    opacity: 0, y: -36, ease: 'none',
    scrollTrigger: { trigger: heroStage, start: 'top top', end: 'bottom top', scrub: true },
  });

  const heroView = { ...INITIAL_VIEW };
  gsap.to(heroView, {
    lat: CITIES[0].lat, lng: CITIES[0].lng, alt: CITIES[0].alt, ease: 'power2.inOut',
    scrollTrigger: { trigger: heroStage, start: 'top top', end: 'bottom top', scrub: true },
    onUpdate: () => globe.pointOfView(heroView, 0),
  });

  ScrollTrigger.create({
    trigger: heroStage, start: 'bottom top',
    onEnter:     () => { controls.autoRotate = false; },
    onLeaveBack: () => { controls.autoRotate = true; },
  });
  ScrollTrigger.create({
    trigger: heroStage, start: '65% top',
    onEnter:     () => { showCityMarker(CITIES[0]); setActiveDot('istanbul'); },
    onLeaveBack: () => { hideCityMarker();          setActiveDot(null); },
  });

  // ── LEG: Istanbul → Erasmus (zoom out to Europe) ───────────
  const gapIstEras = document.querySelector('.city-gap[data-from="istanbul"][data-to="erasmus"]');
  if (gapIstEras) {
    gapIstEras.style.height = '130vh';
    const v = { lat: CITIES[0].lat, lng: CITIES[0].lng, alt: CITIES[0].alt };
    gsap.timeline({
      scrollTrigger: { trigger: gapIstEras, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => globe.pointOfView(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT, duration: 0.35, ease: 'power2.in' })
      .to(v, { lat: EUROPE_VIEW.lat, lng: EUROPE_VIEW.lng, duration: 0.35, ease: 'power2.inOut' })
      .to(v, { alt: EUROPE_VIEW.alt, duration: 0.30, ease: 'power2.out' });

    ScrollTrigger.create({
      trigger: gapIstEras, start: 'top 55%',
      onEnter: () => {
        addArc(CITIES[0], LJUBLJANA);
        lastReveal = -1; setErasmus(0);
        setActiveDot('erasmus');
      },
      onLeaveBack: () => {
        clearConstellation();
        removeArc(CITIES[0], LJUBLJANA);
        updateErasmusList(0); lastReveal = -1;
        showCityMarker(CITIES[0]);
        setActiveDot('istanbul');
      },
    });
  }

  // ── Erasmus chapter: reveal arcs on scroll ─────────────────
  const erasmusChapter = document.querySelector('.chapter--erasmus');
  if (erasmusChapter) {
    ScrollTrigger.create({
      trigger: erasmusChapter, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const raw = (self.progress - 0.06) / 0.80;
        setErasmus(Math.floor(raw * (ERASMUS_TRIPS.length + 1)));
      },
    });
  }

  // ── LEG: Erasmus → Ingolstadt (zoom back in) ───────────────
  const gapErasIng = document.querySelector('.city-gap[data-from="erasmus"][data-to="ingolstadt"]');
  if (gapErasIng) {
    gapErasIng.style.height = '120vh';
    const ing = cityById('ingolstadt');
    const v = { lat: EUROPE_VIEW.lat, lng: EUROPE_VIEW.lng, alt: EUROPE_VIEW.alt };
    gsap.timeline({
      scrollTrigger: { trigger: gapErasIng, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => globe.pointOfView(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT, duration: 0.30, ease: 'power2.in' })
      .to(v, { lat: ing.lat, lng: ing.lng, duration: 0.40, ease: 'power2.inOut' })
      .to(v, { alt: ing.alt, duration: 0.30, ease: 'power2.out' });

    ScrollTrigger.create({
      trigger: gapErasIng, start: 'top 80%',
      onEnter:     () => { setErasmus(ERASMUS_TRIPS.length); },
      onLeaveBack: () => { setErasmus(ERASMUS_TRIPS.length); },
    });

    ScrollTrigger.create({
      trigger: gapErasIng, start: '45% top',
      onEnter: () => {
        clearConstellation();
        addArc(LJUBLJANA, ing);
        showCityMarker(ing);
        setActiveDot('ingolstadt');
      },
      onLeaveBack: () => {
        removeArc(LJUBLJANA, ing);
        lastReveal = -1; setErasmus(ERASMUS_TRIPS.length);
        setActiveDot('erasmus');
      },
    });
  }

  // ── City-to-city transitions (Ingolstadt onward) ───────────
  for (let i = 1; i < CITIES.length - 1; i++) {
    const from = CITIES[i];
    const to   = CITIES[i + 1];
    const gapEl = document.querySelector(`.city-gap[data-from="${from.id}"][data-to="${to.id}"]`);
    if (!gapEl) continue;

    const dist = haversineKm(from, to);
    const vh   = Math.round((70 + 200 * (dist / MAX_DIST_KM)) / 5) * 5;
    gapEl.style.height = `${Math.max(vh, 80)}vh`;

    const v = { lat: from.lat, lng: from.lng, alt: from.alt };
    gsap.timeline({
      scrollTrigger: { trigger: gapEl, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => globe.pointOfView(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT, duration: 0.30, ease: 'power2.in' })
      .to(v, { lat: to.lat, lng: to.lng, duration: 0.40, ease: 'power2.inOut' })
      .to(v, { alt: to.alt, duration: 0.30, ease: 'power2.out' });

    ScrollTrigger.create({
      trigger: gapEl, start: 'top 75%',
      onEnter:     () => addArc(from, to),
      onLeaveBack: () => removeArc(from, to),
    });
    ScrollTrigger.create({
      trigger: gapEl, start: '45% top',
      onEnter:     () => { showCityMarker(to);   setActiveDot(to.id); },
      onLeaveBack: () => { showCityMarker(from); setActiveDot(from.id); },
    });
  }

  // ── Chapter emphasis (Ingolstadt onward) ───────────────────
  CITIES.slice(1).forEach((city) => {
    const chapter = document.querySelector(`.chapter[data-city="${city.id}"]`);
    if (!chapter) return;
    ScrollTrigger.create({
      trigger: chapter, start: 'top 65%',
      onEnter: () => { showCityMarker(city); setActiveDot(city.id); },
    });
  });

  // ── LEG: Bonn → Selected Work (pull back, resume rotation) ─
  const gapBonnWork = document.querySelector('.city-gap[data-from="bonn"][data-to="work"]');
  if (gapBonnWork) {
    gapBonnWork.style.height = '110vh';
    const bonn = cityById('bonn');
    const v = { lat: bonn.lat, lng: bonn.lng, alt: bonn.alt };
    gsap.timeline({
      scrollTrigger: { trigger: gapBonnWork, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => globe.pointOfView(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT, duration: 0.4, ease: 'power2.in' })
      .to(v, { lat: WORK_VIEW.lat, lng: WORK_VIEW.lng, alt: WORK_VIEW.alt, duration: 0.6, ease: 'power2.inOut' });

    ScrollTrigger.create({
      trigger: gapBonnWork, start: '40% top',
      onEnter: () => {
        hideCityMarker();
        controls.autoRotate = true;          // earth turns quietly behind the work
        setActiveDot('work');
      },
      onLeaveBack: () => {
        controls.autoRotate = false;
        showCityMarker(bonn);
        setActiveDot('bonn');
      },
    });
  }

  // Work sections keep the wide rotating view; just track the dot
  const workSections = document.querySelectorAll('.work-intro, .work-project');
  workSections.forEach(sec => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 60%',
      onEnter: () => setActiveDot('work'),
    });
  });

  // ── End section ────────────────────────────────────────────
  const endStage = document.querySelector('.end-stage');
  if (endStage) {
    ScrollTrigger.create({
      trigger: endStage, start: 'top 55%',
      onEnter:     () => setActiveDot('contact'),
      onLeaveBack: () => setActiveDot('work'),
    });
  }

  // ── Expose for UI layer + tweaks panel ─────────────────────
  window._portfolioCities = CITIES;
  window._portfolioGlobe  = globe;
  window._portfolioStops  = STOPS;
  window._portfolioNav    = { scrollToStop, getActiveStop: () => activeStopId };
})();
