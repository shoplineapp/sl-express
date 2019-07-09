const Promise = require('bluebird')

class MongooseAtlasPlugin {
  didLoadFramework(app) {
    const mongoose = require('mongoose')
    mongoose.Promise = Promise

    const {
      config: { mongooseAltas: config },
    } = app

    this.config = config

    this.mongoose = mongoose

    app.mongoose = mongoose
  }

  get connectURL() {
    const { user, pass, host, database } = this.config

    const withUserPass = user && pass

    if (withUserPass) {
      return `mongodb+srv://${user}:${pass}@${host}/${database}`
    }

    return `mongodb+srv://${host}/${database}`
  }

  async connectDependencies(app) {
    const { opts } = this.config

    log('system', 'info', { messsage: 'connecting Mongo Atlas' })

    await this.mongoose.connect(this.connectURL, opts)

    log('system', 'info', { messsage: 'Mongo Atlas connected' })

    return this
  }

  async disconnectDependencies(app) {
    log('system', 'info', { messsage: 'disconnecting Mongo Atlas' })

    await this.mongoose.connection.close()

    log('system', 'info', { messsage: 'Mongo disconnected Atlas ' })
  }
}

module.exports = MongooseAtlasPlugin
