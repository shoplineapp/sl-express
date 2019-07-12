const { App: SuperApp } = require(`${process.cwd()}/index`)

class App extends SuperApp {}

let app = new App();
module.exports = app;
