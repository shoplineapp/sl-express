let _sharedRedis = null
let _redisLib

class Redis {
  constructor(config) {
    this.init(config)
  }

  init(config) {
    this.redis = require('redis')
    this.host = config.host
    this.port = config.port
    this.database = config.database

    this.client = null

    return this
  }

  async connect() {
    this.client = this.redis.createClient({
      socket: {
        host: this.host,
        port: this.port
      }
    })
    await this.client.connect()
    this.client.select(this.database)
    this.client.on('error', (err) => Promise.reject(err))

    return this
  }

  get(id) {
    return this.client.get(id)
  }

  set(id, data, option, duration) {
    return this.client.set(id, data, option, duration)
  }

  del(id) {
    return this.client.del(id)
  }

  disconnect() {
    if (!this.client) return this

    this.client.quit()

    return this
  }

  flushdb() {
    return this.client.flushdb()
  }

}

module.exports = Redis
