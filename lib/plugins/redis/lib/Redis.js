let _sharedRedis = null
let _redisLib

class Redis {
  constructor(config) {
    this.init(config)
  }

  init(config) {
    this.redis = require('redis')
    
    Promise.promisifyAll(this.redis.RedisClient.prototype)
    Promise.promisifyAll(this.redis.Multi.prototype)

    this.host = config.host
    this.port = config.port
    this.database = config.database
    this.timeoutMs = config.timeoutMs

    this.client = null

    return this
  }

  connect() {

    return new Promise((resolve, reject) => {

      this.client = this.redis.createClient({ host: this.host, port: this.port })

      this.client.select(this.database)

      this.client.on('error', (err) => {

        return reject(err)

      })

      this.client.on('connect', () => {

        return resolve(this)

      })

    })

  }

  withTimeout(promise, operation) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Redis operation "${operation}" timed out`));
      }, this.timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
    });
  }

  get(id) {
    return this.withTimeout(this.client.getAsync(id), 'get');
  }

  mget(ids) {
    return this.withTimeout(this.client.mgetAsync(ids), 'mget');
  }

  set(id, data, option, duration) {
    return this.withTimeout(this.client.setAsync(id, data, option, duration), 'set');
  }

  del(id) {
    return this.withTimeout(this.client.delAsync(id), 'del');
  }

  disconnect() {

    if (!this.client) return this

    this.client.quit()

    return this
  }

  flushdb() {
    return this.withTimeout(this.client.flushdbAsync(), 'flushdb');
  }
}

module.exports = Redis