class PluginLoadingError extends Error {
  constructor(message, extras = Array) {
    const plugin = Object.keys(extras[0])
    const allErrorMessage = [
      message,
      ...extras.map(element => element[plugin].stack)
    ].join('\n')
    super(allErrorMessage)

    this.plugin = plugin
    this.name = this.constructor.name

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error(message).stack
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message
    }
  }
}

module.exports = PluginLoadingError
