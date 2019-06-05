import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  constructor(props) {
    super(props)
    console.log('Home:contructor', props.modules.user._fetched);
    props.modules.user.$.setTitle('New Title')
  }
  render() {
    return (
      <div id="home">
        <h2>Home {this.props.user.list[0].title}</h2>
      </div>
    )
  }
}

export default withModules(Home, 'user', 'note', 'settings')