import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'

import Engine from './engine'
import registrar from './registrar'
import App from './App'

const engine = new Engine()

ReactDOM.render(
  engine.start(App, registrar),
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
