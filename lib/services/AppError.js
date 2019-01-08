class AppError extends Error {
  constructor(message = "", extras = {}) {
    super(message)

    this.extras = extras
    this.name = this.constructor.name

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error(message)).stack;
    }
  }

  get status() {
    return 500
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      stack: this.stack,
      extras: this.extras,
    }
  }
}

module.exports = AppError
