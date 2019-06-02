import dashboard from './modules/dashboard'
import note from './modules/note'
import settings from './modules/settings'
// import user from './modules/user'

export default core => {

  core.addModule(dashboard)
  core.addModule(note)
  core.addModule(settings)
  core.addAsyncModule(() => import('./modules/user'), 'user')

}