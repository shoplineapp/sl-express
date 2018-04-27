let fs = require('fs');
let deepExtend = require('deep-extend');
let Promise = require('bluebird')
let express = require('express')
let request = require('request-promise')
let path = require('path')
let MongooseModel = require('./MongooseModel.js')
let QueueTask = require('./QueueTask.js')
let Logger = require('../services/Logger.js')

class App {

  constructor() {

    this.context = global
    this.id = new Date

    this.expressApp = express()

  }

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

  loadFramework() {

    this.context.MongooseModel = MongooseModel
    this.context.QueueTask = QueueTask

    Logger.sharedLogger.init(this.config.logger)
    this.context.Logger = Logger

  }

  loadConfig() {

    require('dotenv').config()

    this.config = deepExtend({},
      this.importDir(path.resolve(__dirname, '../config')),
      this.importDir(path.resolve(process.cwd(), 'config'))
    )

  }

  loadServices() {

    this.services = Object.assign({},
      this.importDir(path.resolve(__dirname, '../services')),
      this.importDir(path.resolve(process.cwd(), 'api/services'))
    )

    Object.keys(this.services).forEach( (key) => { this.context[key] = this.services[key]; })

  }

  loadModels() {

    let filePath = path.resolve(process.cwd(), 'api/models')

    let models = this.importDir(filePath);

    let result = {}

    Object.keys(models).forEach( (key) => {

      let model = models[key]

      result[key] = model.load ? model.load(key) : model

    })

    this.models = result

    Object.keys(this.models).forEach( (key) => { this.context[key] = this.models[key]; })

  }

  loadViewModels() {

    let filePath = path.resolve(process.cwd(), 'api/viewModels')
    this.viewModels = this.importDir(filePath)
    this.context.ViewModel = this.viewModels

  }

  loadMiddlewares() {

    this.middlewares = Object.assign({},
      this.importDir(path.resolve(__dirname, '../middlewares')),
      this.importDir(path.resolve(process.cwd(), 'api/middlewares'))
    )

  }

  loadControllers(app) {

    let filePath = path.resolve(process.cwd(), 'api/controllers')
    let controllers = this.importDir(filePath);

    Object.keys(controllers).forEach( (key) => {
      controllers[key] = new controllers[key](app)
    })

    this.controllers = controllers

  }

  loadRoute(app, controllers, routes, middlewares) {

    let Router = require('./Router.js');
    let router = new Router(app, controllers, routes, middlewares);
    router.route()

  }

  /******************************
   ***  Dependency connection ***
   ******************************/

  async connectMongo() {

    let mongooseConfig = this.config.mongoose

    console.log('##### connecting to mongo #####')

    try { await this.mongoose.connect(mongooseConfig.url) } catch (e) { throw e }

    console.log('##### mongo connected #####')

  }

  async disconnectMongo() {

    console.log('##### disconnecting mongo #####');

    await this.mongoose.connection.close()

    console.log('##### mongo disconnected #####');

  }

  async connectMessageQueue() {

    console.log('##### connecting MQ #####');

    try {

      await MessageQueue.sharedMessageQueue.init(this.config.messageQueue).connect()

    } catch(e) { throw e }

    console.log('##### MQ connected #####');

  }

  async disconnectMessageQueue() {

    console.log('##### disconnecting MQ #####');

    await MessageQueue.sharedMessageQueue.close()

    console.log('##### MQ disconnected #####');

  }

  async connectRedis() {

    console.log('##### connecting to REDIS #####')

    try { await Redis.sharedRedis.init(this.config.redis).connect() } catch(e) { throw e }

    console.log('##### REDIS connected #####');

  }

  async disconnectRedis() {

    console.log('##### disconnecting redis #####');

    Redis.sharedRedis.disconnect()

    console.log('##### redis disconnected #####');

  }


  /*******************************
   ***     App Phases          ***
   *******************************/

  async startExpress() {

    let app = this.expressApp

    try { this.server = app.listen(this.config.app.defaultPort) } catch(e) { throw e }

    console.log(`##### app listening to Port ${this.config.app.defaultPort}... #####`)

  }

  async stopExpress() {

    console.log(`##### STOPPING app listening to Port ${this.config.app.defaultPort}... #####`)

    await this.server.close()

    console.log(`##### STOPPED app listening to Port ${this.config.app.defaultPort}... #####`)


  }

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
    this.loadRoute(this.expressApp, this.controllers, this.config.routes, this.middlewares)

    this.context.app = this

  }

  async connectDependencies() {

  }

  async disconnectDependencies() {

  }

  async startService() {

    await this.startExpress()

  }

  async stopSerivce() {

    await this.stopExpress()

  }

  async start() {

    this.prepare()

    await this.connectDependencies()

    await this.startService()

    return this


  }

  async stop() {

    await this.stopSerivce()

    await this.disconnectDependencies()

    return this

  }

  /*****************************
   ***        helper         ***
   *****************************/

  importDir(dirname) {

    return require('require-all')({ dirname })

  }


}

module.exports = App
