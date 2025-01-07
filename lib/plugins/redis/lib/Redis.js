const Promise = require('bluebird');

let _sharedRedis = null
let _redisLib

class Redis {
  constructor(config) {
    this.init(config)
  }

  init(config) {
    this.redis = require('redis')

    const customPromisifier = (originalMethod) => {
      return function (...args) {
        return new Promise((resolve, reject) => {
          let timeout;
          // for backward compatibility, only provide timeout mechanism if config.timeoutMs is set
          if (config.timeoutMs) {
            timeout = setTimeout(() => {
              reject(
                new Error(`Redis operation "${originalMethod.name}" timed out`)
              );
            }, config.timeoutMs);
          }

          const callback = (err, result) => {
            if (timeout) {
              clearTimeout(timeout);
            }
            if (err) {
              return reject(err);
            }
            resolve(result);
          };

          args.push(callback);

          originalMethod.apply(this, args);
        });
      };
    };

    Promise.promisifyAll(this.redis.RedisClient.prototype, {
      promisifier: customPromisifier,
    });
    Promise.promisifyAll(this.redis.Multi.prototype, {
      promisifier: customPromisifier,
    });

    this.host = config.host
    this.port = config.port
    this.database = config.database

    this.maxRetryDelayMs = parseInt(config.maxRetryDelayMs, 10) || 0;

    this.client = null

    return this
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = this.redis.createClient({
        host: this.host,
        port: this.port,
        ...this.maxRetryDelayMs && { retry_max_delay: this.maxRetryDelayMs },
      });

      this.client.select(this.database);

      this.client.on('error', (err) => {
        log('system', 'info', { message: `Redis Error: ${err}` });
        return reject(err);
      });

      this.client.on('connect', () => {
        return resolve(this);
      });

      this.client.on('reconnecting', () => { log('system', 'info', { message: 'Redis Reconnecting' }) });
      this.client.on('ready', () => { log('system', 'info', { message: 'Redis ready' })});
    })
  }

  get(id) {
    return this.client.getAsync(id);
  }

  mget(ids) {
    return this.client.mgetAsync(ids);
  }

  set(id, data, option, duration) {
    return this.client.setAsync(id, data, option, duration);
  }

  del(id) {
    return this.client.delAsync(id);
  }

  disconnect() {    
    if (!this.client) return this

    this.client.quit()

    return this
  }

  flushdb() {
    return this.client.flushdbAsync();
  }
}

module.exports = Redis