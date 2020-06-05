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

  get(id) {

    return new Promise((resolve, reject) => {

      this.client.get(id, function(err, reply) {

        if (err) return reject(err)

        return resolve(reply)

      })

    })

  }

  set(id, data, option, duration) {

    return new Promise((resolve, reject) => {

      this.client.set(id, data, option, duration, function(err, reply) {

        if (err) return reject(err)

        return resolve(reply)

      })

    })

  }

  del(id) {

    return new Promise((resolve, reject) => {

      this.client.del(id, function(err, reply) {

        if (err) return reject(err)

        return resolve(reply)

      })

    })

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
