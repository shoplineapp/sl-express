const { App: SuperApp } = require('@shopline/sl-express')

class App extends SuperApp {}

let app = new App();
module.exports = app;
