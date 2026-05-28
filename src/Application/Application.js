import Sizes from './Sizes.js'
import World from './World/World.js'
import Scroll from './Scroll.js'
import Chapters from './Chapters.js'

export class Application {
  constructor({ canvasContainer }) {
    this.canvasContainer = canvasContainer
    this.sizes = new Sizes()
    this.world = new World({
      container: this.canvasContainer,
      sizes: this.sizes,
    })
    this.scroll = new Scroll()
    this.chapters = new Chapters({ world: this.world })
  }
}
