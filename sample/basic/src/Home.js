import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  state = {}
  constructor(props) {
    super(props)
    console.log(props);
    const { user } = props.modules
    props.engine.loadAll(props.modules, this)
    // user.load(this)
  }
  render() {
    const { user } = this.props.modules
    console.log(this.state);
    return (
      <div id="home">
        <h2>Home</h2>
        <div><user.View /></div>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')