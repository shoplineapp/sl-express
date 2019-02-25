const Promise = require('bluebird')

class MongoosePlugin {
  didLoadFramework(app) {
    const mongoose = require('mongoose')
    mongoose.Promise = Promise

    this.mongoose = mongoose
    app.mongoose = mongoose
  }

  async connectDependencies(app) {
    const {
      config
    } = app

    log('system', 'info', { messsage: 'connecting Mongo' })

    await this.mongoose.connect(config.mongoose.url)

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
