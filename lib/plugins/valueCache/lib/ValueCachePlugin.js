const ValueCache = require('./ValueCache.js')

class ValueCachePlugin {
  prepare(app) {
    const {
      config: { valueCache },
    } = app

    this.valueCache = new ValueCache({
      redis: app.redis,
      defaultExpireSec: valueCache.defaultExpireSec,
    })

    const { services } = app
    services.ValueCache = this.valueCache
    global.ValueCache = this.valueCache

    valueCache.registrations.forEach(reg => {
      this.valueCache.register(reg.type, reg)
    })
  }
}

module.exports = ValueCachePlugin
