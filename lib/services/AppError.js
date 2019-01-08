class AppError extends Error {
  constructor(message, extras = {}) {
    super(message)

    this.extras = extras
    this.name = this.constructor.name

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      extras: this.extras,
    }
  }
}

module.exports = AppError
