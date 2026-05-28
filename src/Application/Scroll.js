import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default class Scroll {
  constructor() {
    this.lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    this.lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)
  }
}
