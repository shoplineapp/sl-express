const Redis = require('./Redis.js')

class RedisPlugin {
  prepare(app) {
    const {
      config: { redis },
    } = app

    this.redis = new Redis(redis)

    app.redis = this.redis

    //temp. export back to services
    app.services.Redis = app.services.Redis || Redis
  }

  async connectDependencies(app) {
    log('system', 'info', { messsage: 'connecting Redis' })

    await this.redis.connect()

    log('system', 'info', { messsage: 'Redis connected' })
  }

  async disconnectDependencies(app) {
    log('system', 'info', { messsage: 'disconnecting Redis' })

    await this.redis.disconnect()

    log('system', 'info', { messsage: 'Redis disconnected' })
  }
}

module.exports = RedisPlugin
