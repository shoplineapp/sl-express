let SuperApp = require('../../index.js')

class App extends SuperApp {

  async connectDependencies() {

    try { await super.connectDependencies() }catch(e) { throw e }
    try { await this.connectMessageQueue() }catch(e) { throw e }
    try { await this.connectRedis() }catch(e) { throw e }

  }

  async disconnectDependencies() {

    try { await this.disconnectRedis() }catch(e) { throw e }
    try { await this.disconnectMessageQueue() }catch(e) { throw e }
    try { await super.disconnectDependencies() }catch(e) { throw e }

  }

  async startService() {

    if (this.config.app.role == "CONSUMER") {

      QueueTask.consume(this.config.app.consumerQueueId)

      return

    }

    await super.startService()

  }


}

let app = new App
module.exports = app
