import * as THREE from 'three'
import GlobeGL from 'globe.gl'

const MAJOR_CITIES = [
  { lat: 35.6762,  lng: 139.6503 },  // Tokyo
  { lat: 40.7128,  lng: -74.0060 },  // NYC
  { lat: 51.5074,  lng: -0.1278  },  // London
  { lat: 6.5244,   lng: 3.3792   },  // Lagos
  { lat: -23.5505, lng: -46.6333 },  // São Paulo
  { lat: 19.0760,  lng: 72.8777  },  // Mumbai
]

export default class Globe {
  #mardinActive = false
  #prevView = null
  #decorativeRings = MAJOR_CITIES.map((c) => ({ ...c, decorative: true }))
  #activeRings = []
  #arcMeshes = []
  #animFrameId = null
  #animStart = Date.now()

  constructor({ container, sizes }) {
    this.container = container
    this.sizes = sizes

    this.world = new GlobeGL(this.container, { animateIn: false, rendererConfig: { antialias: false } })
      .width(this.sizes.width)
      .height(this.sizes.height)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#7a5cff')
      .atmosphereAltitude(0.22)
      .globeImageUrl('/textures/earth-night.jpg')
      .bumpImageUrl('/textures/earth-topology.png')

    // Cap pixel ratio (Stripe + GitHub optimization: on Retina dPR=2, this cuts GPU load)
    this.world.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

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

    this.#renderRings()

    // Pause WebGL render loop when tab is hidden — saves GPU + heat
    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.world.pauseAnimation() : this.world.resumeAnimation()
    })

    this.world.onGlobeClick(({ lat, lng }) => {
      const MARDIN = { lat: 37.3137, lng: 40.7349 }
      if (Math.hypot(lat - MARDIN.lat, lng - MARDIN.lng) < 1.5) this.#enterMardin()
    })

    this.sizes.on('resize', () => {
      this.world.width(this.sizes.width).height(this.sizes.height)
    })
  }

  flyTo({ lat, lng, altitude = 1.6 }, durationMs = 1500) {
    this.world.pointOfView({ lat, lng, altitude }, durationMs)
  }

  setAutoRotate(enabled) {
    this.world.controls().autoRotate = enabled
  }

  showCityDot(city) {
    const mardin = { lat: 37.3137, lng: 40.7349, mardin: true }
    this.world
      .pointsData([mardin, { lat: city.lat, lng: city.lng, mardin: false }])
      .pointColor((d) => d.mardin ? 'rgba(154, 123, 255, 0.15)' : '#9a7bff')
      .pointAltitude((d) => d.mardin ? 0.002 : 0.005)
      .pointRadius((d) => d.mardin ? 0.15 : 0.3)
  }

  hideCityDot() {
    this.world
      .pointsData([{ lat: 37.3137, lng: 40.7349, mardin: true }])
      .pointColor(() => 'rgba(154, 123, 255, 0.15)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)
  }

  showCityRing(city) {
    this.#activeRings = [{ lat: city.lat, lng: city.lng, decorative: false }]
    this.#renderRings()
  }

  hideCityRing() {
    this.#activeRings = []
    this.#renderRings()
  }

  #renderRings() {
    const rings = [...this.#decorativeRings, ...this.#activeRings]
    this.world.ringsData(rings)
      .ringColor((d) => d.decorative ? 'rgba(255, 210, 130, 0.45)' : 'rgba(154, 123, 255, 0.7)')
      .ringMaxRadius((d) => d.decorative ? 0.6 : 3)
      .ringPropagationSpeed((d) => d.decorative ? 0.4 : 1)
      .ringRepeatPeriod((d) => d.decorative ? 2400 : 1200)
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

  // --- Stripe-style comet arcs ---

  #latLngToVec3(lat, lng) {
    const r = this.world.getGlobeRadius()
    const phi = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    )
  }

  #buildArcMesh(from, to) {
    const start = this.#latLngToVec3(from.lat, from.lng)
    const end   = this.#latLngToVec3(to.lat, to.lng)
    const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    mid.normalize().multiplyScalar(mid.length() + start.distanceTo(end) * 0.38)

    const curve   = new THREE.QuadraticBezierCurve3(start, mid, end)
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.35, 6, false)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time:  { value: 0 },
        color: { value: new THREE.Color('#9a7bff') },
      },
      vertexShader: `
        varying float vProgress;
        void main() {
          vProgress = uv.x;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying float vProgress;
        void main() {
          // Comet draws from 0→1 in 2.5s, then pauses 3.5s showing ambient glow
          float period = 6.0;
          float drawTime = 2.5;
          float cycle = mod(time, period);
          float head = cycle < drawTime ? cycle / drawTime : 2.0;

          float d = vProgress - head;
          float tailAlpha = 0.0;
          if (d < 0.0 && d > -0.35) tailAlpha = pow(1.0 - (-d / 0.35), 1.8);
          float headAlpha = exp(-abs(d) * 28.0);
          float base = 0.07 * sin(vProgress * 3.14159);
          float alpha = max(tailAlpha, headAlpha) * 0.92 + base;
          gl_FragColor = vec4(mix(color, vec3(1.0), headAlpha * 0.5), alpha);
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    return new THREE.Mesh(tubeGeo, mat)
  }

  addArc(from, to) {
    const id = `${from.id}-${to.id}`
    if (this.#arcMeshes.some((a) => a.id === id)) return
    const mesh = this.#buildArcMesh(from, to)
    this.world.scene().add(mesh)
    this.#arcMeshes.push({ id, mesh })
    if (!this.#animFrameId) this.#startArcLoop()
  }

  removeArc(from, to) {
    const id = `${from.id}-${to.id}`
    const entry = this.#arcMeshes.find((a) => a.id === id)
    if (!entry) return
    this.world.scene().remove(entry.mesh)
    entry.mesh.geometry.dispose()
    entry.mesh.material.dispose()
    this.#arcMeshes = this.#arcMeshes.filter((a) => a.id !== id)
    if (this.#arcMeshes.length === 0) this.#stopArcLoop()
  }

  #startArcLoop() {
    const tick = () => {
      const t = (Date.now() - this.#animStart) / 1000
      for (const { mesh } of this.#arcMeshes) mesh.material.uniforms.time.value = t
      this.#animFrameId = requestAnimationFrame(tick)
    }
    this.#animFrameId = requestAnimationFrame(tick)
  }

  #stopArcLoop() {
    cancelAnimationFrame(this.#animFrameId)
    this.#animFrameId = null
  }

  // --- Mardin Easter egg ---

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
