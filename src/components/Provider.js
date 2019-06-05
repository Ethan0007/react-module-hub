import React from 'react'
import { Provider } from 'react-redux'
import { EngineContext } from '..'

export default props => {
  const store = props.engine.getStore()
  return (
    React.createElement(
      EngineContext.Provider,
      { value: props.engine },
      !store ? props.children :
        React.createElement(
          Provider,
          { store },
          props.children
        )
    )
  )
}
