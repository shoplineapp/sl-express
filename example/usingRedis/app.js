let SuperApp = require('@shopline/sl-express')

class App extends SuperApp {

  async connectDependencies() {

    try { await super.connectDependencies() }catch(e) { throw e }
    try { await this.connectRedis() }catch(e) { throw e }

  }

  async disconnectDependencies() {

    try { await this.disconnectRedis() }catch(e) { throw e }
    try { await super.disconnectDependencies() }catch(e) { throw e }

  }

}

let app = new App
module.exports = app
