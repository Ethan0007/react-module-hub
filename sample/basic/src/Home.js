import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    console.log(this.props.modules);
    const { user } = this.props.modules
    this.user = user
  }
  render() {
    console.log("Home:render", this.user.loaded);
    return (
      <div id="home">
        <h2>Home</h2>
        <p>{this.user.loaded ? this.user.$.name : 'Not Loaded'}</p>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')