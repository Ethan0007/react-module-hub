/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react'
import { EngineProvider } from './engine'
import { createStackNavigator, createAppContainer } from 'react-navigation'
import HomeScreen from './screens/Home'

export default engine => {
  return class App extends Component {
    constructor(props) {
      super(props)
      engine.init()
        .then(() => {
          const AppNavigator = createStackNavigator({
            Home: {
              screen: HomeScreen,
              navigationOptions: {
                header: null,
              }
            }
          })
          this.Container = createAppContainer(AppNavigator)
          this.forceUpdate()
        })
    }
    render() {
      console.log('X', this.Container)
      return (
        <EngineProvider engine={engine}>
          {
            this.Container ? <this.Container /> : null
          }
        </EngineProvider>
      )
    }
  }
}
