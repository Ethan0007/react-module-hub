import React, { Component } from 'react'

function UserComponent(user, greet = "Hi") {
  return class extends Component {
    render() {
      return (
        <div>{`${greet} ${user.name}`}</div>
      )
    }
  }
}

export default class {

  static module = 'user'

  name = 'Kevin'

  view = () => UserComponent(this)

  Another = UserComponent(this, "Hello")

}
