import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    const { user, note } = this.props.modules
    this.user = user
    console.log("Home:render:note", note.$);
  }
  render() {
    console.log("Home:render:user", this.user.loaded);
    return (
      <div id="home">
        <h2>Home</h2>
        <p>{this.user.loaded ? this.user.$.name : 'Not Loaded'}</p>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')