// eslint-disable-next-line no-unused-vars
import React from 'react'

export default module => () => React.createElement(
  module.loaded ? module.View : module.Loading)
