import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

// ── City data ───────────────────────────────────────────────
const CITIES = [
  { id: 'istanbul',   label: 'Istanbul',   lat: 41.0082, lng: 28.9784, alt: 0.28, color: '#f59e0b' },
  { id: 'ingolstadt', label: 'Ingolstadt', lat: 48.7665, lng: 11.4258, alt: 0.22, color: '#60a5fa' },
  { id: 'berlin',     label: 'Berlin',     lat: 52.5200, lng: 13.4050, alt: 0.28, color: '#22d3ee' },
  { id: 'wuppertal',  label: 'Wuppertal',  lat: 51.2562, lng: 7.1508,  alt: 0.20, color: '#34d399' },
  { id: 'bonn',       label: 'Bonn',       lat: 50.7374, lng: 7.0982,  alt: 0.22, color: '#f472b6' },
]

// Ordered stops for dot nav (includes Erasmus interlude)
const STOPS = [
  { id: 'istanbul',   label: 'Istanbul',   color: '#f59e0b' },
  { id: 'erasmus',    label: 'Erasmus',    color: '#9a7bff' },
  { id: 'ingolstadt', label: 'Ingolstadt', color: '#60a5fa' },
  { id: 'berlin',     label: 'Berlin',     color: '#22d3ee' },
  { id: 'wuppertal',  label: 'Wuppertal',  color: '#34d399' },
  { id: 'bonn',       label: 'Bonn',       color: '#f472b6' },
]

// ── Erasmus data ────────────────────────────────────────────
const ERASMUS_COLOR = '#9a7bff'
const LJUBLJANA = { id: 'ljubljana', label: 'Ljubljana', lat: 46.0569, lng: 14.5058, color: ERASMUS_COLOR }
const EUROPE_VIEW = { lat: 46.5, lng: 9.5, alt: 1.05 }
const ERASMUS_TRIPS = [
  { country: 'czech',       city: 'Prague',    lat: 50.0755, lng: 14.4378 },
  { country: 'poland',      city: 'Kraków',    lat: 50.0647, lng: 19.9450 },
  { country: 'austria',     city: 'Vienna',    lat: 48.2082, lng: 16.3738 },
  { country: 'switzerland', city: 'Zürich',    lat: 47.3769, lng: 8.5417  },
  { country: 'france',      city: 'Paris',     lat: 48.8566, lng: 2.3522  },
  { country: 'spain',       city: 'Barcelona', lat: 41.3874, lng: 2.1686  },
  { country: 'italy',       city: 'Rome',      lat: 41.9028, lng: 12.4964 },
  { country: 'monaco',      city: 'Monaco',    lat: 43.7384, lng: 7.4246  },
]

const INITIAL_VIEW  = { lat: 22, lng: 14, alt: 2.5 }
const TRANSIT_ALT   = 1.55
const MAX_DIST_KM   = 2500

function haversineKm(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2
          + Math.cos(a.lat * Math.PI / 180)
          * Math.cos(b.lat * Math.PI / 180)
          * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export default class Chapters {
  #globe
  #lastReveal = -1
  #countryEls = {}
  #counterEl = null

  constructor({ world }) {
    this.#globe = world.globe

    gsap.registerPlugin(ScrollTrigger)

    this.#buildDotNav()
    this.#cacheErasmusEls()
    this.#bindHero()
    this.#bindIstanbulToErasmus()
    this.#bindErasmusChapter()
    this.#bindErasmusToIngolstadt()
    this.#bindCityTransitions()
    this.#bindCityEmphasis()
    this.#bindEndSection()
  }

  // ── Dot nav ───────────────────────────────────────────────

  #buildDotNav() {
    const navEl = document.querySelector('.dot-nav')
    if (!navEl) return

    STOPS.forEach((stop, i) => {
      if (i > 0) {
        const conn = document.createElement('div')
        conn.className = 'dot-nav__connector'
        navEl.appendChild(conn)
      }
      const item = document.createElement('div')
      item.className = 'dot-nav__item'
      const dot = document.createElement('button')
      dot.className = 'dot-nav__dot'
      dot.dataset.stop = stop.id
      dot.setAttribute('aria-label', stop.label)
      dot.style.setProperty('--city-color', stop.color)
      const lbl = document.createElement('span')
      lbl.className = 'dot-nav__label'
      lbl.textContent = stop.label
      lbl.style.setProperty('--city-color', stop.color)
      item.appendChild(dot)
      item.appendChild(lbl)
      navEl.appendChild(item)
    })
  }

  #setActiveDot(id) {
    document.querySelectorAll('.dot-nav__dot').forEach(d => {
      d.classList.toggle('active', d.dataset.stop === id)
    })
  }

  // ── Erasmus element cache ─────────────────────────────────

  #cacheErasmusEls() {
    document.querySelectorAll('.erasmus__countries li').forEach(li => {
      this.#countryEls[li.dataset.country] = li
    })
    this.#counterEl = document.querySelector('.erasmus__counter b[data-count]')
  }

  #updateErasmusList(reveal) {
    ERASMUS_TRIPS.forEach((t, i) => {
      const el = this.#countryEls[t.country]
      if (el) el.classList.toggle('lit', i < reveal)
    })
    if (this.#counterEl) {
      this.#counterEl.textContent = String(1 + clamp(reveal, 0, ERASMUS_TRIPS.length))
    }
  }

  #setErasmus(reveal) {
    reveal = clamp(reveal, 0, ERASMUS_TRIPS.length)
    if (reveal === this.#lastReveal) return
    this.#lastReveal = reveal
    const dests = ERASMUS_TRIPS.slice(0, reveal)
    this.#globe.showErasmusConstellation(dests)
    this.#updateErasmusList(reveal)
  }

  // ── Hero ──────────────────────────────────────────────────

  #bindHero() {
    const heroStage = document.querySelector('.hero-stage')
    const heroEl    = document.querySelector('.hero')
    if (!heroStage || !heroEl) return

    gsap.to(heroEl, {
      opacity: 0, y: -36, ease: 'none',
      scrollTrigger: { trigger: heroStage, start: 'top top', end: 'bottom top', scrub: true },
    })

    const v = { ...INITIAL_VIEW }
    const istanbul = CITIES[0]
    gsap.to(v, {
      lat: istanbul.lat, lng: istanbul.lng, alt: istanbul.alt, ease: 'power2.inOut',
      scrollTrigger: { trigger: heroStage, start: 'top top', end: 'bottom top', scrub: true },
      onUpdate: () => this.#globe.flyTo(v, 0),
    })

    ScrollTrigger.create({
      trigger: heroStage, start: 'bottom top',
      onEnter:     () => this.#globe.setAutoRotate(false),
      onLeaveBack: () => this.#globe.setAutoRotate(true),
    })

    ScrollTrigger.create({
      trigger: heroStage, start: '65% top',
      onEnter:     () => { this.#globe.showCityMarker(istanbul); this.#setActiveDot('istanbul') },
      onLeaveBack: () => { this.#globe.hideCityMarker();         this.#setActiveDot(null) },
    })
  }

  // ── Istanbul → Erasmus (zoom out to Europe) ───────────────

  #bindIstanbulToErasmus() {
    const gap = document.querySelector('.city-gap[data-from="istanbul"][data-to="erasmus"]')
    if (!gap) return
    gap.style.height = '130vh'

    const istanbul = CITIES[0]
    const v = { lat: istanbul.lat, lng: istanbul.lng, alt: istanbul.alt }

    gsap.timeline({
      scrollTrigger: { trigger: gap, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => this.#globe.flyTo(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT,           duration: 0.35, ease: 'power2.in'    })
      .to(v, { lat: EUROPE_VIEW.lat, lng: EUROPE_VIEW.lng, duration: 0.35, ease: 'power2.inOut' })
      .to(v, { alt: EUROPE_VIEW.alt,        duration: 0.30, ease: 'power2.out'   })

    ScrollTrigger.create({
      trigger: gap, start: 'top 55%',
      onEnter: () => {
        // Trail arc Istanbul → Ljubljana
        this.#globe.addArc(istanbul, LJUBLJANA)
        this.#lastReveal = -1
        this.#setErasmus(0)
        this.#setActiveDot('erasmus')
      },
      onLeaveBack: () => {
        this.#globe.clearConstellation()
        this.#globe.removeArc(istanbul, LJUBLJANA)
        this.#updateErasmusList(0)
        this.#lastReveal = -1
        this.#globe.showCityMarker(istanbul)
        this.#setActiveDot('istanbul')
      },
    })
  }

  // ── Erasmus chapter: fan arcs out on scroll ───────────────

  #bindErasmusChapter() {
    const chapter = document.querySelector('.chapter--erasmus')
    if (!chapter) return

    ScrollTrigger.create({
      trigger: chapter, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: (self) => {
        const raw = (self.progress - 0.06) / 0.80
        this.#setErasmus(Math.floor(raw * (ERASMUS_TRIPS.length + 1)))
      },
    })
  }

  // ── Erasmus → Ingolstadt (zoom back in) ───────────────────

  #bindErasmusToIngolstadt() {
    const gap = document.querySelector('.city-gap[data-from="erasmus"][data-to="ingolstadt"]')
    if (!gap) return
    gap.style.height = '120vh'

    const ing = CITIES[1]
    const v = { lat: EUROPE_VIEW.lat, lng: EUROPE_VIEW.lng, alt: EUROPE_VIEW.alt }

    gsap.timeline({
      scrollTrigger: { trigger: gap, start: 'top bottom', end: 'bottom top', scrub: true },
      onUpdate: () => this.#globe.flyTo(v, 0),
    })
      .to(v, { alt: TRANSIT_ALT,  duration: 0.30, ease: 'power2.in'    })
      .to(v, { lat: ing.lat, lng: ing.lng, duration: 0.40, ease: 'power2.inOut' })
      .to(v, { alt: ing.alt,       duration: 0.30, ease: 'power2.out'   })

    ScrollTrigger.create({
      trigger: gap, start: 'top 80%',
      onEnter:     () => this.#setErasmus(ERASMUS_TRIPS.length),
      onLeaveBack: () => this.#setErasmus(ERASMUS_TRIPS.length),
    })

    ScrollTrigger.create({
      trigger: gap, start: '45% top',
      onEnter: () => {
        this.#globe.clearConstellation()
        this.#globe.addArc(LJUBLJANA, ing)
        this.#globe.showCityMarker(ing)
        this.#setActiveDot('ingolstadt')
      },
      onLeaveBack: () => {
        this.#globe.removeArc(LJUBLJANA, ing)
        this.#lastReveal = -1
        this.#setErasmus(ERASMUS_TRIPS.length)
        this.#setActiveDot('erasmus')
      },
    })
  }

  // ── City-to-city gaps (Ingolstadt onward) ─────────────────

  #bindCityTransitions() {
    for (let i = 1; i < CITIES.length - 1; i++) {
      const from = CITIES[i]
      const to   = CITIES[i + 1]
      const gap  = document.querySelector(`.city-gap[data-from="${from.id}"][data-to="${to.id}"]`)
      if (!gap) continue

      const dist = haversineKm(from, to)
      const vh   = Math.round((70 + 200 * (dist / MAX_DIST_KM)) / 5) * 5
      gap.style.height = `${Math.max(vh, 80)}vh`

      const v = { lat: from.lat, lng: from.lng, alt: from.alt }
      gsap.timeline({
        scrollTrigger: { trigger: gap, start: 'top bottom', end: 'bottom top', scrub: true },
        onUpdate: () => this.#globe.flyTo(v, 0),
      })
        .to(v, { alt: TRANSIT_ALT,       duration: 0.30, ease: 'power2.in'    })
        .to(v, { lat: to.lat, lng: to.lng, duration: 0.40, ease: 'power2.inOut' })
        .to(v, { alt: to.alt,             duration: 0.30, ease: 'power2.out'   })

      ScrollTrigger.create({
        trigger: gap, start: 'top 75%',
        onEnter:     () => this.#globe.addArc(from, to),
        onLeaveBack: () => this.#globe.removeArc(from, to),
      })

      ScrollTrigger.create({
        trigger: gap, start: '45% top',
        onEnter:     () => { this.#globe.showCityMarker(to);   this.#setActiveDot(to.id)   },
        onLeaveBack: () => { this.#globe.showCityMarker(from); this.#setActiveDot(from.id) },
      })
    }
  }

  // ── Chapter emphasis (Ingolstadt onward) ──────────────────

  #bindCityEmphasis() {
    CITIES.slice(1).forEach(city => {
      const chapter = document.querySelector(`.chapter[data-city="${city.id}"]`)
      if (!chapter) return
      ScrollTrigger.create({
        trigger: chapter, start: 'top 65%',
        onEnter: () => { this.#globe.showCityMarker(city); this.#setActiveDot(city.id) },
      })
    })
  }

  // ── End section: zoom back out ────────────────────────────

  #bindEndSection() {
    const endStage = document.querySelector('.end-stage')
    if (!endStage) return

    const last = CITIES[CITIES.length - 1]
    const v = { lat: last.lat, lng: last.lng, alt: last.alt }
    gsap.to(v, {
      lat: 30, lng: 14, alt: 2.2, ease: 'power2.inOut',
      scrollTrigger: { trigger: endStage, start: 'top bottom', end: 'top top', scrub: true },
      onUpdate: () => this.#globe.flyTo(v, 0),
    })

    ScrollTrigger.create({
      trigger: endStage, start: 'top 50%',
      onEnter: () => { this.#globe.hideCityMarker(); this.#setActiveDot(null) },
    })
  }
}
