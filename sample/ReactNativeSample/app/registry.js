import dashboard from './modules/dashboard'
import note from './modules/note'

export default engine => {

  // SYNC MODULES
  engine.addModule(dashboard)
  engine.addModule(note)

  // ON-DEMAND ASYNC MODULES
  engine.addModule(() => import('./modules/user'), 'user')

  // STARTUP ASYNC MODULES
  return [
    import('./modules/settings')
  ]

}