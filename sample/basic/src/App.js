import React, { Component } from 'react'
import { CoreContext } from './core'

class App extends Component {
  constructor(props) {
    super(props)
    props.core.init().then(() => this.forceUpdate())
  }
  render() {
    const { core } = this.props
    return (
      !core.isReady ? null :
        <CoreContext.Provider value={core}>
          <div className="App">
            <header className="App-header">
              Welcome to Corex
          </header>
          </div>
        </CoreContext.Provider>
    )
  }
}

export default core => {
  return <App core={core} />
}
