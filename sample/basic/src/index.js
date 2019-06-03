import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'

import Core from './core'
import registrar from './registrar'
import App from './App'

const core = new Core()

ReactDOM.render(
  core.start(App, registrar),
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()