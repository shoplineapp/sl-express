class Router {

  constructor(app, controllers, routes, middlewares) {

    this.app = app;
    this.router = require('express').Router()
    this.controllers = controllers;
    this.routes = routes;
    this.middlewares = middlewares;

  }

  route() {

    this.routes.preMiddlewares.forEach( (value) => {

      this._routeMiddleware(value);

    })

    this.routes.routes.forEach( (value) => {

      this._routeRoute(value);

    })

    this.routes.postMiddlewares.forEach( (value) => {

      this._routeMiddleware(value);

    })

    this.app.use(this.router)
  }

  _routeRoute(value) {

    let [httpMethod, path, ...handlers] = value.split(' ')

    let args = handlers.map((element, idx) => {

      if (element.match(/\./)) {

        let [controller, action] = element.split('.')
        try {
          if (this.controllers[controller] === undefined) {
            throw `controller ${controller} is missing`;
          }
          if (this.controllers[controller][action] === undefined) {
            throw `controller action ${controller}#${action} is missing`;
          }
          return this.controllers[controller][action].bind(this.controllers[controller]);
        } catch (e) {
          console.error('Unable to load route handler:', e);
          return;
        }
      }

      return this.middlewares[element]

    }).filter(handler => !!handler);

    this.router[httpMethod.toLowerCase()](path, ...args);

  }

  _routeMiddleware(value) {

    let [path, ...middlewares] = value.split(' ');

    let args = middlewares.map((element, idx) => {

      return this.middlewares[element]

    })

    this.router.use(path, ...args);

  }

}

module.exports = Router
