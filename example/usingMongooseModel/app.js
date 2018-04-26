let SuperApp = require('shopline-nodejs-framework')

class App extends SuperApp {

  async connectDependencies() {

    try { await super.connectDependencies() }catch(e) { throw e }
    try { await this.connectMongo() }catch(e) { throw e }

  }

  async disconnectDependencies() {

    try { await this.diconnectMongo() }catch(e) { throw e }
    try { await super.disconnectDependencies() }catch(e) { throw e }

  }

}

let app = new App
module.exports = app
//app.start().catch(console.log)
