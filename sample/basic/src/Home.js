import React, { Component } from 'react'
import { withModules } from './engine'

class Home extends Component {
  state = {}
  constructor(props) {
    super(props)
    props.engine.loadAll(props.modules, this)
    setTimeout(() => {
      console.log(this.state);
      this.state.user.setTitle('New Title')
    }, 5000)
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

// export default Home

export default withModules(Home, 'user', 'note', 'settings')