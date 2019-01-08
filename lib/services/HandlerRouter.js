const AppError = require('./AppError.js')
class HandlerRouterMethodNotFoundError extends AppError {}

class HandlerRouter {
  constructor({ handlerMap, modelMap }) {
    this.handlerMap = handlerMap
    this.modelMap = modelMap
  }

  async run(key, ...args) {
    const errExtras = { key, args }

    const handlerStr = this.handlerMap[key]

    if (!handlerStr) {
      throw new HandlerRouterMethodNotFoundError('key_not_exist', errExtras)
    }

    const [model, method] = handlerStr.split('.')

    if (!model, !method) {
      throw new HandlerRouterMethodNotFoundError('handler_invalid_format', errExtras)
    }

    const klass = this.modelMap[model]

    if (!klass) {
      throw new HandlerRouterMethodNotFoundError('class_not_exist', errExtras)
    }

    if (!klass[method]) {
      throw new HandlerRouterMethodNotFoundError('method_not_exist', errExtras)
    }

    const handler = klass[method].bind(klass)
    return handler(...args)
  }
}

module.exports = HandlerRouter
