import * as THREE from 'three'
import GlobeGL from 'globe.gl'

const MARDIN = { lat: 37.3137, lng: 40.7349 }
const ERASMUS_COLOR = '#9a7bff'
const LJUBLJANA = { lat: 46.0569, lng: 14.5058, label: 'Ljubljana' }

export default class Globe {
  #mardinDot = [{ lat: MARDIN.lat, lng: MARDIN.lng, mardin: true }]
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

    this.world.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const controls = this.world.controls()
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableRotate = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.25

    this.world.pointOfView({ lat: 22, lng: 14, altitude: 2.5  }, 0)

    // Init: only mardin dot, no rings, no labels
    this.world
      .pointsData(this.#mardinDot)
      .pointColor(() => 'rgba(154,123,255,0.12)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)
      .ringsData([])
      .htmlElementsData([])
      .arcsData([])

    document.addEventListener('visibilitychange', () => {
      document.hidden ? this.world.pauseAnimation() : this.world.resumeAnimation()
    })

    this.sizes.on('resize', () => {
      this.world.width(this.sizes.width).height(this.sizes.height)
    })
  }

  flyTo(v, durationMs = 0) {
    const { lat, lng, altitude, alt } = v
    this.world.pointOfView({ lat, lng, altitude: altitude ?? alt ?? 1.6 }, durationMs)
  }

  setAutoRotate(enabled) {
    this.world.controls().autoRotate = enabled
  }

  // ── City marker: point + ring + label, all city-colored ──

  showCityMarker(city) {
    this.world
      .pointsData([
        ...this.#mardinDot,
        { lat: city.lat, lng: city.lng, color: city.color },
      ])
      .pointColor(d => d.mardin ? 'rgba(154,123,255,0.12)' : d.color)
      .pointAltitude(d => d.mardin ? 0.002 : 0.006)
      .pointRadius(d => d.mardin ? 0.15 : 0.35)
      .ringsData([{ lat: city.lat, lng: city.lng }])
      .ringColor(() => city.color + 'bb')
      .ringMaxRadius(3)
      .ringPropagationSpeed(1.2)
      .ringRepeatPeriod(1100)
      .htmlElementsData([{ lat: city.lat, lng: city.lng, label: city.label, color: city.color }])
      .htmlElement(d => this.#makeLabel(d))
  }

  hideCityMarker() {
    this.world
      .pointsData(this.#mardinDot)
      .pointColor(() => 'rgba(154,123,255,0.12)')
      .pointAltitude(() => 0.002)
      .pointRadius(() => 0.15)
      .ringsData([])
      .htmlElementsData([])
  }

  // ── Erasmus constellation: Ljubljana home + fanning arcs ──

  showErasmusConstellation(dests) {
    const destPoints = dests.map(t => ({ lat: t.lat, lng: t.lng, color: ERASMUS_COLOR }))

    this.world
      .pointsData([
        ...this.#mardinDot,
        { lat: LJUBLJANA.lat, lng: LJUBLJANA.lng, color: ERASMUS_COLOR, home: true },
        ...destPoints,
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
      .htmlElement(d => this.#makeLabel(d))

    const arcs = dests.map((t, i) => ({
      id: `eras-${i}`,
      startLat: LJUBLJANA.lat, startLng: LJUBLJANA.lng,
      endLat: t.lat, endLng: t.lng,
      startColor: ERASMUS_COLOR, endColor: ERASMUS_COLOR,
    }))
    this.world
      .arcsData(arcs)
      .arcColor(d => [d.startColor, d.endColor])
      .arcDashLength(0.38)
      .arcDashGap(0.72)
      .arcDashAnimateTime(3200)
      .arcStroke(0.45)
  }

  clearConstellation() {
    this.world.arcsData([])
    this.hideCityMarker()
  }

  // ── Custom comet-shader arcs (city-to-city trail) ─────────

  addArc(from, to) {
    const id = `${from.id ?? from.label}-${to.id ?? to.label}`
    if (this.#arcMeshes.some(a => a.id === id)) return
    const mesh = this.#buildArcMesh(from, to, to.color ?? '#9a7bff')
    this.world.scene().add(mesh)
    this.#arcMeshes.push({ id, mesh })
    if (!this.#animFrameId) this.#startArcLoop()
  }

  removeArc(from, to) {
    const id = `${from.id ?? from.label}-${to.id ?? to.label}`
    const entry = this.#arcMeshes.find(a => a.id === id)
    if (!entry) return
    this.world.scene().remove(entry.mesh)
    entry.mesh.geometry.dispose()
    entry.mesh.material.dispose()
    this.#arcMeshes = this.#arcMeshes.filter(a => a.id !== id)
    if (this.#arcMeshes.length === 0) this.#stopArcLoop()
  }

  setAtmosphereColor(color) {
    this.world.atmosphereColor(color)
  }

  // ── Internals ─────────────────────────────────────────────

  #makeLabel(d) {
    const el = document.createElement('div')
    el.className = 'globe-label'
    el.textContent = d.label
    el.style.setProperty('--label-color', d.color)
    return el
  }

  #latLngToVec3(lat, lng) {
    const r = this.world.getGlobeRadius()
    const phi   = (90 - lat) * Math.PI / 180
    const theta = (lng + 180) * Math.PI / 180
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta),
    )
  }

  #buildArcMesh(from, to, color) {
    const start = this.#latLngToVec3(from.lat, from.lng)
    const end   = this.#latLngToVec3(to.lat, to.lng)
    const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    mid.normalize().multiplyScalar(mid.length() + start.distanceTo(end) * 0.38)

    const curve   = new THREE.QuadraticBezierCurve3(start, mid, end)
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.35, 6, false)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time:  { value: 0 },
        color: { value: new THREE.Color(color) },
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
}
