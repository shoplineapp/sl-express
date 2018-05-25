/*
 * @class App
 *
 * @description The App class acts as the motherboard of the whole app. It controls phases. It's expected to be subclass-ed and overrided the phases.
 */

let fs = require('fs');
let deepExtend = require('deep-extend');
let Promise = require('bluebird')
let request = require('request-promise')
let path = require('path')
let MongooseModel = require('./MongooseModel.js')
let QueueTask = require('./QueueTask.js')
let Logger = require('../services/Logger.js')

const flat = require('flat')
const inflection = require('inflection')

class AppHelper {

  constructor(app) {
    this.app = app
  }

  assignRecursiveMappings(requiredMappings) {

    let mappings = {}

    const _assign = (klass, key, prefix='') => {

      if (typeof klass === 'object') {

        // Handle nested resources recursively
        Object.keys(klass).forEach((key) => {

          if (typeof klass[key] === 'object') { prefix = `${prefix}${inflection.capitalize(key)}${this.app.config.app.moduleDelimiter}` }
          _assign(klass[key], key, prefix)

        })

      } else {

        mappings[`${prefix}${key}`] = new klass(this.app)

      }

      return mappings

    }

    // Flatten require-all tree with module delimiter
    return _assign(requiredMappings)

  }



  importDir(dirname, options={}) {

    return require('require-all')(Object.assign(options, { dirname }))

  }
}

class App {

  constructor(config = {}) {

    /* this.context is the target for exporting models, controllers and services.
       most of the case, it should be globel */
    this.context = config.context || global

    /* this.id is the identifier of the app. you can use it to do logging */
    this.id = config.id || (new Date).getTime()

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

  /*
   * @description A getter of the mongoose library. It will try to get the mongoose from MongooseModel. Most of the case, you'll need MongooseModel for your project
   *
   * @method mongoose
   *
   * @return {mongooose} mongoose the lib used for connecting mongo
   */

  //TODO: better make it less dependent to MongooseModel

  get mongoose() {

    if (!this._mongoose) {

      this._mongoose = MongooseModel.mongoose
      this._mongoose.Promise = Promise

    }

    return this._mongoose

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

    require('dotenv').config()
    const helper = new AppHelper(this)

    this.config = deepExtend({},
      helper.importDir(path.resolve(__dirname, '../config')),
      helper.importDir(path.resolve(process.cwd(), 'config'))
    )

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

    this.context.MongooseModel = MongooseModel
    this.context.QueueTask = QueueTask
    this.context.QueueTask.queueTasks = this.config.queueTasks

    Logger.sharedLogger.init(this.config.logger)
    this.context.Logger = Logger

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

    const helper = new AppHelper(this)
    this.services = Object.assign({},
      helper.importDir(path.resolve(__dirname, '../services')),
      helper.importDir(path.resolve(process.cwd(), this.config.app.directory, 'services'))
    )

    Object.keys(this.services).forEach( (key) => { this.context[key] = this.services[key]; })

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

    const helper = new AppHelper(this)

    let filePath = path.resolve(process.cwd(), this.config.app.directory, 'models')
    let models = helper.importDir(filePath, { recursive: true })

    let delimiter = this.config.app.moduleDelimiter

    models = flat(models, { delimiter })

    let result = {}

    Object.keys(models).forEach( (key) => {

      let model = models[key]

      let tmpKey = key.split(delimiter).slice(-1)[0]

      result[key] = model.load ? model.load(tmpKey) : model

    })

    this.models = result

    Object.keys(this.models).forEach( (key) => { this.context[key] = this.models[key]; })

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

    let filePath = path.resolve(process.cwd(), this.config.app.directory, 'viewModels')
    this.viewModels = new AppHelper(this).importDir(filePath)
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

    const helper = new AppHelper(this)

    this.middlewares = Object.assign({},
      helper.importDir(path.resolve(__dirname, '../middlewares')),
      helper.importDir(path.resolve(process.cwd(), this.config.app.directory, 'middlewares'))
    )

    return this

  }

  /*
   * @description load the controllers from project controller folder. Also exports them to global
   *
   * @method loadControllers
   *
   * @return {App} the app instance
   */

  loadControllers(app) {

    const helper = new AppHelper(this)
    let filePath = path.resolve(process.cwd(), this.config.app.directory, 'controllers')
    let controllers = helper.importDir(filePath, { recursive: true })

    this.controllers = helper.assignRecursiveMappings(controllers)

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

  /******************************
   ***  Dependency connection ***
   ******************************/

  /*
   * @description the standard way to connect mongo. ONLY put this in the connectDependencies method if neccessary
   *
   * @method connectMongo
   *
   * @return {App} the app instance
   */

  async connectMongo() {

    let mongooseConfig = this.config.mongoose

    console.log('##### connecting to mongo #####')

    try { await this.mongoose.connect(mongooseConfig.url) } catch (e) { throw e }

    console.log('##### mongo connected #####')

    return this

  }

  /*
   * @description the standard way to disconnect mongo. ONLY put this in the disconnectDependencies method if neccessary
   *
   * @method disconnectMongo
   *
   * @return {App} the app instance
   */

  async disconnectMongo() {

    console.log('##### disconnecting mongo #####');

    await this.mongoose.connection.close()

    console.log('##### mongo disconnected #####');

    return this

  }

  /*
   * @description the standard way to connect the message queue. ONLY put this in the connectDependencies method if neccessary
   *
   * @method connectMessageQueue
   *
   * @return {App} the app instance
   */

  async connectMessageQueue() {

    console.log('##### connecting MQ #####');

    try {

      await MessageQueue.sharedMessageQueue.init(this.config.messageQueue).connect()

    } catch(e) { throw e }

    console.log('##### MQ connected #####');

    return this
  }

  /*
   * @description the standard way to disconnect the message queue. ONLY put this in the disconnectDependencies method if neccessary
   *
   * @method disconnectMessageQueue
   *
   * @return {App} the app instance
   */

  async disconnectMessageQueue() {

    console.log('##### disconnecting MQ #####');

    await MessageQueue.sharedMessageQueue.close()

    console.log('##### MQ disconnected #####');

    return this

  }

  /*
   * @description the standard way to connect the redis. ONLY put this in the connectDependencies method if neccessary
   *
   * @method connectRedis
   *
   * @return {App} the app instance
   */

  async connectRedis() {

    console.log('##### connecting to REDIS #####')

    try { await Redis.sharedRedis.init(this.config.redis).connect() } catch(e) { throw e }

    console.log('##### REDIS connected #####');

    return this

  }

  /*
   * @description the standard way to disconnect the redis. ONLY put this in the disconnectDependencies method if neccessary
   *
   * @method disconnectRedis
   *
   * @return {App} the app instance
   */

  async disconnectRedis() {

    console.log('##### disconnecting redis #####');

    Redis.sharedRedis.disconnect()

    console.log('##### redis disconnected #####');

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

  prepare() {

    this.loadConfig()

    this.context.Promise = Promise
    this.context.request = request

    this.loadFramework()
    this.loadServices()
    this.loadModels()
    this.loadViewModels()
    this.loadMiddlewares()
    this.loadControllers(this.expressApp)
    this.loadRoute()

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

  async stopSerivce() {

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

    this.prepare()

    await this.connectDependencies()

    await this.startService()

    return this

  }

  /*
   * @description the stop point of the app. it SHOULD NOT be overrided unless you know what you are doing
   *
   * @method stop
   *
   * @return {App} the app instance
   */

  async stop() {

    await this.stopSerivce()

    await this.disconnectDependencies()

    return this

  }
}

module.exports = App
