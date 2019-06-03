import ReactDOM from 'react-dom'
import * as serviceWorker from './serviceWorker'

/**
 * Entry point of your project. 
 * Should wrap you App component with `start` method.
 */

import Engine from './engine'
import App from './App'

// Register all you modules in this file.
import registry from './registry'

// Create instance of you engine.
const engine = new Engine({
  modules: {
    user: {
      foo: 'bar'
    }
  }
})

// Wrap your App component with `start` methods and pass the `registry`
ReactDOM.render(
  engine.start(App, registry),
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
