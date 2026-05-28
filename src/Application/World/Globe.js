import GlobeGL from 'globe.gl'

export default class Globe {
  #mardinActive = false
  #prevView = null

  constructor({ container, sizes }) {
    this.container = container
    this.sizes = sizes

    this.world = new GlobeGL(this.container, { animateIn: false })
      .width(this.sizes.width)
      .height(this.sizes.height)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#7a5cff')
      .atmosphereAltitude(0.22)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')

    const controls = this.world.controls()
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableRotate = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.25

    this.world.pointOfView({ lat: 30, lng: 0, altitude: 2.4 }, 0)

    // Mardin Easter egg: faint pulsing dot always visible
    this.world.pointsData([{ lat: 37.3137, lng: 40.7349 }])
      .pointColor(() => 'rgba(154, 123, 255, 0.15)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)

    // Click handler for Mardin Easter egg
    this.world.onGlobeClick(({ lat, lng }) => {
      const MARDIN = { lat: 37.3137, lng: 40.7349 }
      const dist = Math.hypot(lat - MARDIN.lat, lng - MARDIN.lng)
      if (dist < 1.5) this.#enterMardin()
    })

    this.sizes.on('resize', () => {
      this.world.width(this.sizes.width).height(this.sizes.height)
    })
  }

  flyTo({ lat, lng, altitude = 1.6 }, durationMs = 1500) {
    this.world.pointOfView({ lat, lng, altitude }, durationMs)
  }

  showCityDot(city) {
    const mardin = { lat: 37.3137, lng: 40.7349, mardin: true }
    const cityPoint = { lat: city.lat, lng: city.lng, mardin: false }
    this.world
      .pointsData([mardin, cityPoint])
      .pointColor((d) => d.mardin ? 'rgba(154, 123, 255, 0.15)' : '#9a7bff')
      .pointAltitude((d) => d.mardin ? 0.002 : 0.005)
      .pointRadius((d) => d.mardin ? 0.15 : 0.3)
  }

  hideCityDot() {
    const mardin = { lat: 37.3137, lng: 40.7349, mardin: true }
    this.world
      .pointsData([mardin])
      .pointColor(() => 'rgba(154, 123, 255, 0.15)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)
  }

  showCityRing(city) {
    this.world
      .ringsData([{ lat: city.lat, lng: city.lng }])
      .ringColor(() => 'rgba(154, 123, 255, 0.7)')
      .ringMaxRadius(() => 3)
      .ringPropagationSpeed(() => 1)
      .ringRepeatPeriod(() => 1200)
  }

  hideCityRing() {
    this.world.ringsData([])
  }

  showCityLabel(city) {
    this.world
      .htmlElementsData([{ lat: city.lat, lng: city.lng, label: city.label }])
      .htmlElement((d) => {
        const el = document.createElement('div')
        el.className = 'city-label'
        el.textContent = d.label
        el.style.opacity = '1'
        return el
      })
  }

  hideCityLabel() {
    this.world.htmlElementsData([])
  }

  #enterMardin() {
    if (this.#mardinActive) return
    this.#mardinActive = true
    this.#prevView = this.world.pointOfView()
    this.world.controls().autoRotate = false
    this.world.pointOfView({ lat: 37.3137, lng: 40.7349, altitude: 0.15 }, 1800)
    document.querySelector('.mardin-overlay')?.classList.add('active')
  }

  exitMardin() {
    this.#mardinActive = false
    this.world.controls().autoRotate = true
    this.world.pointOfView(this.#prevView ?? { lat: 30, lng: 0, altitude: 2.4 }, 1500)
    document.querySelector('.mardin-overlay')?.classList.remove('active')
  }
}
