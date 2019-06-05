import React, { Component } from 'react'
import { EngineProvider } from './engine'
import Home from './Home'
import { createStore } from 'redux'

/**
 * You root app component.
 * Initialize engine and attach the context to the app.
 */

class App extends Component {
  constructor(props) {
    super(props)
    const engine = props.engine
    // Initialize engine and its modules and re-render once done.
    engine.init(args => {
      let store;
      if (args.rootReducer) {
        store = createStore(
          args.rootReducer,
          args.initialState || {}
        )
      }
      return { store }
    }).then(() => {
      const user = engine.getter.getModule('user');
      console.log(user);
      this.forceUpdate()
    })
  }
  render() {
    const { engine } = this.props
    return (
      // Make sure the engine is hot and ready before 
      // attaching the its context.
      !engine.isReady ? null :
        <EngineProvider engine={engine}>
          <div className="App">
            <header className="App-header">
              <h1>Welcome to Renginex</h1>
            </header>
            <Home />
          </div>
        </EngineProvider>
    )
  }
}

export default engine => {
  // Provide the engine to the root app component.
  return <App engine={engine} />
}
