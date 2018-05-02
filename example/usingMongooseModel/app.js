let SuperApp = require('@shopline/sl-express')

class App extends SuperApp {

  async connectDependencies() {

    try { await super.connectDependencies() }catch(e) { throw e }
    try { await this.connectMongo() }catch(e) { throw e }

  }

  async disconnectDependencies() {

    try { await this.disconnectMongo() }catch(e) { throw e }
    try { await super.disconnectDependencies() }catch(e) { throw e }

  }

}

let app = new App
module.exports = app
