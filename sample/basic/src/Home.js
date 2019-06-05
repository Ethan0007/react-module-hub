import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    console.log('Home:contructor');
    console.log(props);
    const user = props.loaders.user;
    if (!user.loaded) {
      user.load(this)
    }
    props.modules.user.setTitle('New Title')
  }
  render() {
    console.log('Home:render', this.state);
    return (
      <div id="home">
        <h2>Home</h2>
        <h3>{this.props.state.user.list[0].title}</h3>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')