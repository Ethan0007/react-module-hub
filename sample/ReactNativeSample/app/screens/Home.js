import React, { Component } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import { withModules } from '../engine'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
})

class HomeScreen extends Component {
  render() {
    const engine = this.props.engine._engine
    const moduleKeys = Object.keys(engine._modules)
    return (
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
    )
  }
}

export default withModules(HomeScreen)

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