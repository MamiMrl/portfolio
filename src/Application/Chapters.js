import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

const INITIAL_VIEW = { lat: 30, lng: 0, altitude: 2.4 }

const CITIES = [
  { id: 'istanbul',   label: 'Istanbul',   lat: 41.0082, lng: 28.9784, altitude: 0.30 },
  { id: 'ingolstadt', label: 'Ingolstadt', lat: 48.7665, lng: 11.4258, altitude: 0.25 },
  { id: 'berlin',     label: 'Berlin',     lat: 52.5200, lng: 13.4050, altitude: 0.30 },
  { id: 'wuppertal',  label: 'Wuppertal',  lat: 51.2562, lng: 7.1508,  altitude: 0.22 },
  { id: 'bonn',       label: 'Bonn',       lat: 50.7374, lng: 7.0982,  altitude: 0.25 },
]

const TRANSIT_ALTITUDE = 1.4

function haversineKm(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export default class Chapters {
  constructor({ world }) {
    this.world = world
    this.cities = CITIES
    this.#bindHero()
    this.#bindCityTransitions()
    this.#bindCityEmphasis()
    this.#bindMardinOverlay()
  }

  #bindHero() {
    const heroStage = document.querySelector('.hero-stage')
    const hero = document.querySelector('.hero')
    if (!heroStage || !hero) return

    gsap.to(hero, {
      opacity: 0,
      y: -40,
      ease: 'none',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    const firstCity = this.cities[0]
    const viewState = { ...INITIAL_VIEW }
    gsap.to(viewState, {
      lat: firstCity.lat,
      lng: firstCity.lng,
      altitude: firstCity.altitude,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
      onUpdate: () => {
        this.world.globe.flyTo(viewState, 0)
      },
    })

    // autoRotate is incompatible with deep zoom — disable once hero is past
    ScrollTrigger.create({
      trigger: heroStage,
      start: 'bottom top',
      onEnter: () => this.world.globe.setAutoRotate(false),
      onLeaveBack: () => this.world.globe.setAutoRotate(true),
    })
  }

  #bindCityTransitions() {
    const MAX_DIST = 2250
    for (let i = 0; i < CITIES.length - 1; i++) {
      const from = CITIES[i]
      const to = CITIES[i + 1]
      const dist = haversineKm(from, to)
      const vh = Math.round((80 + 220 * (dist / MAX_DIST)) / 5) * 5
      const el = document.querySelector(`.city-transition[data-from="${from.id}"][data-to="${to.id}"]`)
      if (!el) continue

      el.style.height = `${vh}vh`

      const view = { lat: from.lat, lng: from.lng, altitude: from.altitude }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        onUpdate: () => this.world.globe.flyTo(view, 0),
      })
      tl.to(view, { altitude: TRANSIT_ALTITUDE, duration: 0.3, ease: 'power2.in' })
        .to(view, { lat: to.lat, lng: to.lng, duration: 0.4, ease: 'power2.inOut' })
        .to(view, { altitude: to.altitude, duration: 0.3, ease: 'power2.out' })

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        onEnter: () => this.world.globe.addArc(from, to),
        onLeaveBack: () => this.world.globe.removeArc(from, to),
      })
    }
  }

  #bindCityEmphasis() {
    const heroStage = document.querySelector('.hero-stage')
    const firstCity = this.cities[0]
    if (!heroStage) return

    ScrollTrigger.create({
      trigger: heroStage,
      start: '60% top',
      end: '80% top',
      onEnter: () => this.world.globe.showCityDot(firstCity),
      onLeaveBack: () => this.world.globe.hideCityDot(),
    })

    ScrollTrigger.create({
      trigger: heroStage,
      start: '80% top',
      end: '90% top',
      onEnter: () => this.world.globe.showCityRing(firstCity),
      onLeaveBack: () => this.world.globe.hideCityRing(),
    })

    ScrollTrigger.create({
      trigger: heroStage,
      start: '90% top',
      end: 'bottom top',
      onEnter: () => this.world.globe.showCityLabel(firstCity),
      onLeaveBack: () => this.world.globe.hideCityLabel(),
    })

    // City emphasis for chapters
    for (const city of CITIES.slice(1)) {
      const chapter = document.querySelector(`.chapter[data-chapter="${city.id}"]`)
      if (!chapter) continue

      ScrollTrigger.create({
        trigger: chapter,
        start: 'top 70%',
        end: 'top 50%',
        onEnter: () => this.world.globe.showCityDot(city),
        onLeaveBack: () => this.world.globe.hideCityDot(),
      })

      ScrollTrigger.create({
        trigger: chapter,
        start: 'top 60%',
        end: 'top 40%',
        onEnter: () => this.world.globe.showCityRing(city),
        onLeaveBack: () => this.world.globe.hideCityRing(),
      })

      ScrollTrigger.create({
        trigger: chapter,
        start: 'top 50%',
        end: 'top 30%',
        onEnter: () => this.world.globe.showCityLabel(city),
        onLeaveBack: () => this.world.globe.hideCityLabel(),
      })
    }
  }

  #bindMardinOverlay() {
    const closeBtn = document.querySelector('.mardin-overlay__close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.world.globe.exitMardin())
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.world.globe.exitMardin()
    })
  }
}
