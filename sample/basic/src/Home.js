import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    console.log(props);
  }
  render() {
    const { user } = this.props.modules
    return (
      <div id="home">
        <h2>Home</h2>
        <div><user.View /></div>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')