class RetryableContext {
  constructor(loopOptions) {
    this.options = {
      maxRetryCount: 5,
      ...loopOptions,
    };
    this.store = {
      retryCount: 0,
    };
  }

  setYield(fn) {
    this.yieldFn = fn;
    return this;
  }

  setCondition(fn) {
    this.conditionFn = fn;
    return this;
  }

  while(fn) {
    return this.setCondition(fn);
  }

  async exec(yieldFn) {
    if (yieldFn !== undefined) {
      this.yieldFn = yieldFn;
    }
    if ((typeof this.conditionFn === 'function' && !this.conditionFn()) || !this.yieldFn) {
      return;
    }

    try {
      await this.yieldFn();
      if (this.conditionFn) {
        await this.exec();
      }
    } catch (e) {
      this.store.retryCount += 1;
      if (this.store.retryCount < this.options.maxRetryCount) {
        await this.exec();
      }
    }
  }
}

module.exports = RetryableContext;
