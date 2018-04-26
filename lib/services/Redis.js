let _sharedRedis = null
let _redisLib

class Redis {

  static get sharedRedis() {

    if (!_sharedRedis) {

      _sharedRedis = new Redis()

    }

    return _sharedRedis

  }

  static get redis() {

    if (!_redisLib) {

      _redisLib = require('redis')

      Promise.promisifyAll(_redisLib.RedisClient.prototype)
      Promise.promisifyAll(_redisLib.Multi.prototype)

    }

    return _redisLib

  }

  init(config) {

    this.host = config.host
    this.port = config.port
    this.database = config.database

    this.client = null

    return this

  }

  connect() {

    return new Promise((resolve, reject) => {

      this.client = Redis.redis.createClient({ host: this.host, port: this.port })

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

  set(id, data) {

    return new Promise((resolve, reject) => {

      this.client.set(id, data, function(err, reply) {

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
