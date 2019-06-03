
export default class {
  static module = 'dashboard'
  settings = null
  ready(core) {
    setTimeout(() => {
      const loader = core.getAsyncModule('settings', s => {
        this.settings = s
        this.play()
      })
      console.log(loader);
    }, 3000)
  }
  play() {
    console.log(this.settings);
  }
}
