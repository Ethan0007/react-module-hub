
/**
 * This is a polyfill for asyncStorage
 */

class Storage {

  available = false

  constructor(key) {
    try {
      localStorage.setItem(key, 'LS')
      localStorage.removeItem(key)
      this.available = true
    } catch (e) {
      this.available = false
    }
  }

  setItem(key, val) {
    if (this.available) localStorage.setItem(key, val)
    return Promise.resolve()
  }

  getItem(key) {
    let val = null
    if (this.available) val = localStorage.getItem(key)
    return Promise.resolve(val)
  }

}

export default Storage