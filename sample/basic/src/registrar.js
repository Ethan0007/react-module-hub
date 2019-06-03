import dashboard from './modules/dashboard'
import note from './modules/note'

export default engine => {

  // SYNC MODULES
  // Modules that synchronously loads on startup
  engine.addModule(dashboard)
  engine.addModule(note)

  // ON-DEMAND ASYNC MODULES
  // Modules that asynchronousely loads on demand
  engine.addAsyncModule(() => import('./modules/settings'), 'settings')

  // STARTUP ASYNC MODULES
  // Modules that asynchronousely loads on startup
  // Usually don't need this, you can sync load instead 
  return [
    import('./modules/user')
  ]

  // NOTES: 

  // All sync modules will not have access to startup async 
  // modules in `constructor` lifecycle. User `start` or 
  // `ready` lifecycle instead.

  // All sync and startup async modules will only have access
  // to on-demand async modules when it's loaded. However, all 
  // modules can load on-demand modules at anytime when needed.

}