const RetryableContext = require('./RetryableContext');

class Retryable {
  static with(options) {
    return new RetryableContext(options);
  }

  static while(conditionFn) {
    return new RetryableContext().while(conditionFn);
  }

  static async exec(yieldFn) {
    await new RetryableContext().setYield(yieldFn).exec();
  }
}

module.exports = Retryable;
