import React, { Component } from 'react'
import { EngineContext } from './engine'
import Home from './Home'
import { createStore } from 'redux'

/**
 * You root app component.
 * Initialize engine and attach the context to the app.
 */

class App extends Component {
  constructor(props) {
    super(props)
    // Initialize engine and its modules and re-render once done.
    props.engine.init(this, args => {
      let store;
      if (args.rootReducer) {
        store = createStore(
          args.rootReducer,
          args.initialState
        )
      }
      return { store }
    }).then(() => this.forceUpdate())
  }
  render() {
    const { engine } = this.props
    return (
      // Make sure the engine is hot and ready before 
      // attaching the its context.
      !engine.isReady ? null :
        <EngineContext.Provider value={engine}>
          <div className="App">
            <header className="App-header">
              <h1>Welcome to Rengine</h1>
            </header>
            <Home />
          </div>
        </EngineContext.Provider>
    )
  }
}

export default (engine) => {
  // Provide the engine to the root app component.
  return <App engine={engine} />
}
