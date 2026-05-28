import Globe from './Globe.js'

export default class World {
  constructor({ container, sizes }) {
    this.container = container
    this.sizes = sizes
    this.globe = new Globe({ container, sizes })
  }
}
