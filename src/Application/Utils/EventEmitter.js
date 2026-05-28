export default class EventEmitter {
  constructor() {
    this.callbacks = {}
  }

  on(name, callback) {
    if (!this.callbacks[name]) this.callbacks[name] = []
    this.callbacks[name].push(callback)
    return this
  }

  off(name, callback) {
    if (!this.callbacks[name]) return this
    this.callbacks[name] = this.callbacks[name].filter((cb) => cb !== callback)
    return this
  }

  trigger(name, ...args) {
    if (!this.callbacks[name]) return
    this.callbacks[name].forEach((cb) => cb(...args))
  }
}
