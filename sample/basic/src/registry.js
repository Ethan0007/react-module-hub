import dashboard from './modules/dashboard'
import note from './modules/note'

/**
 * This is where you register all your modules
 */

export default engine => {

  // SYNC MODULES
  // Modules that synchronously loads on startup
  engine.addModule(dashboard)
  engine.addModule(note)

  // ON-DEMAND ASYNC MODULES
  // Modules that asynchronousely loads on demand
  engine.addModule(() => import('./modules/user'), 'user')

  // STARTUP ASYNC MODULES
  // Modules that asynchronousely loads on startup but
  // engine will treat it as synchronous module.
  // Usually you don't need this, you can synchronously 
  // load it instead, like above
  return [
    import('./modules/settings')
  ]

  // NOTES: 

  // All sync modules will not have access to startup async 
  // modules in `constructor` lifecycle. User `start` or 
  // `ready` lifecycle instead.

  // All sync and startup async modules will only have access
  // to on-demand async modules when it's loaded. However, all 
  // modules can load on-demand modules at anytime when needed.

}