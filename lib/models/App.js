/*
 * @class App
 *
 * @description The App class acts as the motherboard of the whole app. It controls phases. It's expected to be subclass-ed and overrided the phases.
 */

let deepExtend = require('deep-extend');
let Promise = require('bluebird')
let path = require('path')
let PluginService = require('../services/PluginService.js')
const AppHelper = require('./AppHelper.js')

// TODO: App should add a proper way to do those `will` and `did` phases
// TODO: Plugin feature should do a better way of exporting, letting phases append variable to app is not appropriate
class App {

  constructor(config = {}) {

    /* this.context is the target for exporting models, controllers and services.
       most of the case, it should be globel */
    this.context = config.context || global

    /* this.id is the identifier of the app. you can use it to do logging */
    this.id = config.id || (new Date).getTime()

    this.models = {}
    this.services = {}

    this.pluginService = null
  }

  projectDir() {
    return process.cwd()
  }

  /*
   * @description A getter of the express instance. We do a lazy loading here so that it wont require the express if unnecessary
   *
   * @method expressApp
   *
   * @return {Express} a express instance
   */

  get expressApp() {

    if (!this._expressApp) {

      let express = require('express')
      this._expressApp = express()

    }

    return this._expressApp

  }

  /***************************************
   ***  the HOW to do of loading phase ***
   ***************************************/
  /*
   * @description load the config to the app. It first find the .env file and exports every variable to ENV. Then it load configs from the framework config folder and the project config folder afterwards
   *
   * @method loadConfig
   *
   * @return {App} the app instance
   */

  loadConfig() {
    // TODO: as config is a must for lots of the phases, please do a lazy loading
    if (this.config) return this

    require('dotenv').config()

    this.config = AppHelper.loadWithOverride([
      { path: path.resolve(__dirname, '../config'), opts: { required: false }},
      { path: path.resolve(this.projectDir(), 'config') }
    ], { deepMerge: true })

    return this

  }

  /*
   * @description load the framework related components. Basically just something must be loaded, configurated and exported first
   *
   * @method loadFramework
   *
   * @return {App} the app instance
   */

  //TODO: any better way to manage this?

  loadFramework() {
    if (!this.config) {
      this.loadConfig()
    }

    this.models = {
      ...this.models,
      ...(AppHelper.importDir(
        path.resolve(__dirname, '../models'),
        { required: false }
      )),
    }

    this.services = {
      ...this.services,
      ...(AppHelper.importDir(
        path.resolve(__dirname, '../services'),
        { required: false }
      )),
    }

    Object.assign(
      this.context,
      this.models,
      this.services,
    )

    return this
  }

  /*
   * @description load the services from framework first and then followed by project services. Also exports them to global
   *
   * @method loadServices
   *
   * @return {App} the app instance
   */

  loadServices() {
    if (!this.config) {
      this.loadConfig()
    }

    const dirPath = path.resolve(
      this.projectDir(),
      this.config.app.directory,
      'services'
    )

    const appServices = AppHelper.importDir(dirPath, { required: false })

    this.services = {
      ...this.services,
      ...appServices,
    }

    Object.assign(this.context, this.services)

    return this

  }

  /*
   * @description load the models from project models folder. Also exports them to global
   *
   * @method loadModels
   *
   * @return {App} the app instance
   */

  loadModels() {
    if (!this.config) {
      this.loadConfig()
    }

    const { MongooseModel } = this.models

    let filePath = path.resolve(this.projectDir(), this.config.app.directory, 'models')

    const appModels = AppHelper.loadRecursively(filePath, {
      required: false,
      handler: (klass, key) => {
        if (klass.setMongoose) {
          klass.setMongoose(this.mongoose)
        }

        return klass.load ? klass.load(key) : klass
      }
    })

    this.models = {
      ...this.models,
      ...appModels,
    }

    Object.assign(this.context, this.models)

    return this

  }

  /*
   * @description load the view models from project models folder. Also exports them to global
   *
   * @method loadViewModels
   *
   * @return {App} the app instance
   */

  loadViewModels() {
    if (!this.config) {
      this.loadConfig()
    }

    this.viewModels = AppHelper.loadWithOverride([
      { path: path.resolve(path.resolve(this.projectDir(), this.config.app.directory, 'viewModels')) }
    ])

    this.context.ViewModel = this.viewModels

    return this
  }

  /*
   * @description load the middlewares from framework first and then followed by project middlewares. Also exports them to global
   *
   * @method loadMiddlewares
   *
   * @return {App} the app instance
   */

  loadMiddlewares() {
    if (!this.config) {
      this.loadConfig()
    }

    this.middlewares = AppHelper.loadWithOverride([
      { path: path.resolve(__dirname, '../middlewares'), opts: { required: false }},
      { path: path.resolve(path.resolve(this.projectDir(), this.config.app.directory, 'middlewares')) }
    ])

    return this
  }

  /*
   * @description load the controllers from project controller folder. Also exports them to global
   *
   * @method loadControllers
   *
   * @return {App} the app instance
   */

  loadControllers() {
    if (!this.config) {
      this.loadConfig()
    }

    const helper = AppHelper

    let filePath = path.resolve(this.projectDir(), this.config.app.directory, 'controllers')

    let result = helper.loadRecursively(filePath, {
      required: false,
      handler: (klass) => {
        return new klass(this)
      }
    });

    this.controllers = result

    return this

  }

  /*
   * @description making use of the framework Router model to do the routing of express
   *
   * @method loadRoute
   *
   * @return {App} the app instance
   */

  loadRoute() {

    let Router = require('./Router.js');
    let router = new Router(this.expressApp, this.controllers, this.config.routes, this.middlewares);
    router.route()

    return this

  }

  /*
   * @description add helpers that can access globally
   *
   * @method loadHelpers
   *
   * @return {App} the app instance
   */

  loadHelpers() {
    if (!this.config) {
      this.loadConfig()
    }

    this.helpers = AppHelper.loadWithOverride([
      { path: path.resolve(__dirname, '../helpers'), opts: { required: false }},
      { path: path.resolve(path.resolve(this.projectDir(), this.config.app.directory, 'helpers')) }
    ])

    this.context.helpers = this.helpers

    return this
  }

  loadPlugins() {
    if (!this.config) {
      this.loadConfig()
    }

    /* if application provide the same plugin key,
     * it will override the sl-express one
     */

    this.pluginService = new PluginService({
      dirs: [
        path.resolve(this.projectDir(), this.config.app.directory, 'plugins'),
        path.resolve(__dirname, '../plugins'),
      ],
    })

    this.config.app.plugins.forEach( key => {
      this.pluginService.add(key)
    })

    this.plugins = this.pluginService.importedPluginMap

    return this
  }

  /*******************************
   ***      Service Related    ***
   *******************************/

  /*
   * @description To start an express server. It receives variable by config.app
   *
   * @method startExpress
   *
   * @param {Integer} port the port of the express server
   *
   * @return {App} the app instance
   */

  async startExpress() {

    let app = this.expressApp

    try { this.server = app.listen(this.config.app.port) } catch(e) { throw e }

    console.log(`##### app listening to Port ${this.config.app.port}... #####`)

  }

  /*
   * @description To stop the express server.
   *
   * @method stopExpress
   *
   * @return {App} the app instance
   */

  async stopExpress() {

    console.log(`##### STOPPING app listening to Port ${this.config.app.port}... #####`)

    await this.server.close()

    console.log(`##### STOPPED app listening to Port ${this.config.app.port}... #####`)


  }

  /*
   * @description To start a consumer
   *
   * @method stopExpress
   *
   * @return {App} the app instance
   */

  async startConsumer() {

    QueueTask.consume(this.config.app.consumerQueueId)

    return this

  }

  async executePluginPhase(phase) {
    await this.pluginService.executePluginPhase({
      phase,
      reversed: phase === 'disconnectDependencies',
      context: this
    })

    return
  }

  /*******************************
   ***     App Phases          ***
   *******************************/

  /*
   * @description the prepare phase intends to load all the file and exports them to a correct context so that the other phases can use the stuff later on
   *
   * @method prepare
   *
   * @return {App} the app instance
   */

  async prepare() {
    this.loadConfig()

    this.context.Promise = Promise

    this.loadFramework()
    this.loadPlugins()

    await this.executePluginPhase('didLoadFramework')

    this.loadServices()
    this.loadModels()
    this.loadViewModels()
    this.loadMiddlewares()
    this.loadControllers()
    this.loadRoute()
    this.loadHelpers()

    await this.executePluginPhase('prepare')

    this.context.app = this

    return this

  }

  /*
   * @description this phase intends to centralize all the connection to services here. Please do all the connection within this phase. Beware of the connection sequence
   *
   * @method connectDependencies
   *
   * @return {App} the app instance
   */

  async connectDependencies() {
    await this.executePluginPhase('connectDependencies')

    return this
  }

  /*
   * @description this phase intends to centralize all the disconnection from services here. Please do all the connection within this phase
   * A better practise is to disconnect your services in an reversed sequence of the connectDependencies phase
   *
   * @method disconnectDependencies
   *
   * @return {App} the app instance
   */

  async disconnectDependencies() {
    await this.executePluginPhase('disconnectDependencies')

    return this
  }

  /*
   * @description the start service phase is the phase that you start what your application actaully doing. By default, we set it to start an express server.
   *
   * @method startService
   *
   * @return {App} the app instance
   */

  async startService() {

    await this.startExpress()

    return this

  }

  /*
   * @description the stop service phase is the phase that you stop everything you start. By default, we set it to stop the express server.
   *
   * @method stopService
   *
   * @return {App} the app instance
   */

  async stopService() {

    await this.stopExpress()

    return this

  }

  /*
   * @description the start point of the app. it SHOULD NOT be overrided unless you know what you are doing
   *
   * @method start
   *
   * @return {App} the app instance
   */

  async start() {

    await this.prepare()

    await this.connectDependencies()

    await this.executePluginPhase('willStartService')

    await this.startService()

    await this.executePluginPhase('didStartService')

    return this

  }

  /* * @description the stop point of the app. it SHOULD NOT be overrided unless you know what you are doing
   *
   * @method stop
   *
   * @return {App} the app instance
   */

  async stop() {

    await this.stopService()

    await this.disconnectDependencies()

    return this

  }
}

module.exports = App
