const Promise = require('bluebird')

class MongoosePlugin {
  didLoadFramework(app) {
    const mongoose = require('mongoose')
    mongoose.Promise = Promise

    const {
      config: { mongoose: config }
    } = app

    this.config = config

    this.mongoose = mongoose

    app.mongoose = mongoose
  }

  get connectURL() {
    const { user, pass, host, port, database } = this.config

    const withUserPass = user && pass

    if (withUserPass) {
      return `mongodb://${user}:${pass}@${host}:${port}/${database}`
    }

    return `mongodb://${host}:${port}/${database}`
  }

  async connectDependencies(app) {
    const { opts } = this.config

    log('system', 'info', { messsage: 'connecting Mongo' })

    await this.mongoose.connect(this.connectURL, opts)

    log('system', 'info', { messsage: 'Mongo connected' })

    return this
  }

  async disconnectDependencies(app) {
    log('system', 'info', { messsage: 'disconnecting Mongo' })

    await this.mongoose.connection.close()

    log('system', 'info', { messsage: 'Mongo disconnected' })
  }
}

module.exports = MongoosePlugin
