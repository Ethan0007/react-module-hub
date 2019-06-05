import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    this.user = props.modules.user
    this.user.load(this)
    console.log('Home:contructor')
    setTimeout(() => {
      this.user.$.setTitle('New Title')
    }, 3000)
  }
  render() {
    console.log('Home:render:state', this.state);
    console.log('Home:render:modules', this.props.modules);
    const { user } = this.props.modules;
    return (
      <div id="home">
        <h2>Home</h2>
        <h3>{user.loaded && this.props.state.user.list[0].title}</h3>
        <this.user.View />
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')