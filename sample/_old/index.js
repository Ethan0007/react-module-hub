import Hub from '../src/hub'
import { createStore, combineReducers } from 'redux'
var LocalStorage = require('node-localstorage').LocalStorage,
  localStorage = new LocalStorage('./scratch')

console.log('Split', 1)

let hub = new Hub({
  foo: 'bar',
  boo: {
    jar: {
      inner: 'yeah'
    }
  },
  modules: {
    moduleb: {
      isFoo: 'Bar'
    }
  }
}, {
    storage: {
      setItem(key, value) {
        return Promise.resolve().then(() => {
          return localStorage.setItem(key, value)
        })
      },
      getItem(key) {
        return Promise.resolve().then(() => {
          return localStorage.getItem(key)
        })
      }
    }
  })

const initTodo = {
  list: []
}

function todos(state = initTodo, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return state.concat([action.text])
    default:
      return state
  }
}

function counter(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1
    case 'DECREMENT':
      return state - 1
    case 'CLEAR':
      return null
    default:
      return state
  }
}

class ModuleA {
  static module = 'modulea'
  static reducers = todos
  start() {
    console.log('ModuleA: start')
  }
  ready() {
    console.log('ModuleA: ready')
  }
  getName() {
    return 'Module From A'
  }
}

class ModuleB {
  static module = 'moduleb'
  static reducers = counter
  start() {
    console.log('ModuleB: start')
  }
  ready(hub) {
    console.log('ModuleB: ready')
    setTimeout(() => {
      hub.getAsyncModule('foo')
    }, 3000)
  }
  getName() {
    return 'Module From B'
  }
}

let registrar = ins => {
  ins.addModule(ModuleA)
  ins.addModule(ModuleB)
  ins.addAsyncModule(() => import('./foo'), 'foo')
}

hub.start(ins => {
  setTimeout(() => {
    ins.init((rootReducer, initialState) => {
      return createStore(
        rootReducer,
        initialState
      )
    }).then(() => {
      console.log('isReady', hub.isReady)
      // console.log('state', hub.getter.getStore())
    })
  }, 1000)
}, registrar)

/*

hub.getAsyncModule('foo', this)
const Foo = hub.getAsyncModule('foo', foo => {
  this.foo = foo // Will not redraw
  this.setState(() => {foo}) // Will redraw
})
Foo.isLoaded // Check if loaded or not
// TODO: Work on Loading and View component
Foo.Loading // Loading component
Foo.View // Component is render method

*/

/*
return (
  <View>
    <Foo.View />
  </View>
)
*/

/*
return (
  <View>
    !Foo.loaded ?
      <Foo.Loading /> :
      <View>
        <Text>Foo.$.getFullname()</Text>
      </View>
  </View>
)
*/

/*
return (
  <View>
    !this.state.foo ?
      <Loading /> :
      <View>
        <Text>this.state.foo.getFullname()</Text>
      </View>
  </View>
)
*/