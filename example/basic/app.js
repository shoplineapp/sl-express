let SuperApp = require('../../index.js')

class App extends SuperApp {

}

let app = new App
app.start().catch(console.log)
