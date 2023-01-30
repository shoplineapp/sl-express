const { createClient } = require('redis')
let _sharedRedis = null
let _redisLib

class Redis {
  constructor(config) {
    this.host = config.host
    this.port = config.port
    this.database = config.database
    this.maxRetryDelayMs = parseInt(config.maxRetryDelayMs, 10) || 0
    this.timeoutMs = config.timeoutMs
    this.client = null
  }

  withTimeout(promise, operationName, timeoutMs) {
    if (!timeoutMs) return promise

    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Redis operation "${operationName}" timed out`)), timeoutMs)
      ),
    ])
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = createClient({
        url: `redis://${this.host}:${this.port}`,
        retryStrategy: () => this.maxRetryDelayMs,
      })

      this.client.on('error', (err) => {
        log('system', 'info', { message: `Redis Error: ${err}` })
        reject(err)
      })

      this.client.on('reconnecting', () => log('system', 'info', { message: 'Redis Reconnecting' }))
      this.client.on('ready', () => log('system', 'info', { message: 'Redis ready' }))

      this.client.connect()
        .then(() => {
          return this.client.select(this.database)
        })
        .then(() => {
          resolve(this)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  async get(id) {
    return this.withTimeout(this.client.get(id), 'get', this.timeoutMs)
  }

  async mget(ids) {
    return this.withTimeout(this.client.mGet(ids), 'mget', this.timeoutMs)
  }

  async set(id, data, option, duration) {
    const options = option && duration ? { [option]: duration } : {}
    return this.withTimeout(this.client.set(id, data, options), 'set', this.timeoutMs)
  }

  async del(id) {
    return this.withTimeout(this.client.del(id), 'del', this.timeoutMs)
  }

  async disconnect() {
    if (this.client) await this.client.quit()
    return this
  }

  async flushdb() {
    return this.withTimeout(this.client.flushDb(), 'flushdb', this.timeoutMs)
  }
}

module.exports = Redis
