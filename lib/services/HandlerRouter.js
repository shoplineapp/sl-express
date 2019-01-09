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
      throw new HandlerRouterMethodNotFoundError(
        'key does not exist in handler map',
        { ...errExtras, code: 'key_not_exist' },
      )
    }

    const [model, method] = handlerStr.split('.')

    if (!model, !method) {
      throw new HandlerRouterMethodNotFoundError(
        'invalid handler string format. shoulde be `klass.method`',
        { ...errExtras, code: 'handler_invalid_format' },
      )
    }

    const klass = this.modelMap[model]

    if (!klass) {
      throw new HandlerRouterMethodNotFoundError(
        'class does not exist in modelMap',
        { ...errExtras, code: 'class_not_exist' },
      )
    }

    if (!klass[method]) {
      throw new HandlerRouterMethodNotFoundError(
        'method does not exist in class',
        { ...errExtras, code: 'method_not_exist' },
      )
    }

    const handler = klass[method].bind(klass)
    return handler(...args)
  }
}

module.exports = HandlerRouter
