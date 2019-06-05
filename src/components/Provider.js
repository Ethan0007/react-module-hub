import React from 'react'
import { Provider } from 'react-redux'
import { EngineContext } from '..'

export default props => {
  const engine = props.engine
  const store = engine.getStore()
  return (
    engine.isReady ?
      React.createElement(
        EngineContext.Provider,
        { value: engine },
        !store ? props.children :
          React.createElement(
            Provider,
            { store },
            props.children
          )
      ) :
      props.loading || null
  )
}
