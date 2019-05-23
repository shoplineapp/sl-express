let { App: SuperApp } = require('@shopline/sl-express');

class Server extends SuperApp {}

let server = new Server();
module.exports = server;
