import React, { Component } from 'react'
import { EngineContext } from './engine'

class App extends Component {
  constructor(props) {
    super(props)
    props.core.init().then(() => this.forceUpdate())
  }
  render() {
    const { core } = this.props
    return (
      !core.isReady ? null :
        <EngineContext.Provider value={core}>
          <div className="App">
            <header className="App-header">
              Welcome to Corex
          </header>
          </div>
        </EngineContext.Provider>
    )
  }
}

export default core => {
  return <App core={core} />
}
