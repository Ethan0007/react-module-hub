import React, { Component } from 'react'

function UserComponent(user, greet = "Hi") {
  return class extends Component {
    render() {
      const { user: state } = user._store.getState()
      return (
        <div>{`${greet} ${user.name} ${state.list[0].title}`}</div>
      )
    }
  }
}

const initialNotes = {
  list: [
    { id: 1, title: 'Hello', note: 'World' }
  ]
}

function notes(state = initialNotes, action) {
  switch (action.type) {
    case 'NOTE_SET_TITLE':
      return {
        list: [
          { id: 1, title: action.payload, note: 'World' }
        ]
      }
    default:
      break;
  }
  return state
}


export default class {

  static module = 'user'
  // static persist = true
  static reducers = notes

  name = 'Kevin'

  _store = null

  constructor(engine) {
    this._store = engine.getStore()
    console.log('user:contructor', this._store);
  }

  setTitle(title) {
    this._store.dispatch({
      type: 'NOTE_SET_TITLE',
      payload: title
    })
  }

  view = () => UserComponent(this)

  Another = UserComponent(this, "Hello")

}
