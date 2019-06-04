/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { EngineContext } from './engine'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
})

export default engine => {
  return class App extends Component {
    state = { ready: false }
    constructor(props) {
      super(props)
      engine
        .init(this)
        .then(() => this.setState(() => ({ ready: true })))
    }
    render() {
      const moduleKeys = Object.keys(engine._modules)
      return (
        !this.state.ready ? null :
          <EngineContext.Provider value={engine}>
            <View style={styles.container}>
              <Text style={styles.welcome}>Welcome to Rengine!</Text>
              <Text style={styles.instructions}>To get started, edit App.js</Text>
              <Text style={styles.instructions}>{instructions}</Text>
              <Text style={styles.instructions}></Text>
              <Text style={styles.instructions}>
                There are {moduleKeys.length} added modules,
                {'\n\n'}
                {
                  moduleKeys.map(key => (
                    <Text key={key}>
                      {engine._modules[key]._loader.module}{'  :  '}
                      {engine._modules[key].loaded ? 'Loaded' : 'Not Loaded'}{'\n'}
                    </Text>
                  ))
                }
                {'\n\n'}
                Check out the "registry" file to see how
                {'\n'}
                modules are added and loaded
              </Text>
            </View>
          </EngineContext.Provider>
      )
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
})
