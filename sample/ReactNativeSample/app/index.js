/**
 * @format
 */

import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'

import Engine from './engine'
import registry from './registry'

const engine = new Engine()

AppRegistry.registerComponent(
  appName,
  () => engine.start(App, registry)
)
