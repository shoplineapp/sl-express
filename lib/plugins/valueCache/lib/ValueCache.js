const AppError = global.AppError || Error

class ValueCacheRegistrationNotFoundError extends AppError {}
class ValueCacheInvalidRegistrationError extends AppError {}

class ValueCache {
  static redisKey(keyPrefix, id) {
    return `${keyPrefix}:${id}`
  }

  constructor({ redis, defaultExpireSec } = {}) {
    this.registrationMap = {}
    this.redis = redis
    this.defaultExpireSec = defaultExpireSec
  }

  register(type, { expireSec, keyPrefix }) {
    if (!type || typeof type !== 'string') {
      throw new ValueCacheInvalidRegistrationError('`type` should be a valid string')
    }

    if (!keyPrefix || typeof keyPrefix !== 'string') {
      throw new ValueCacheInvalidRegistrationError('`keyPrefix` should be a valid string')
    }

    this.registrationMap = {
      ...this.registrationMap,
      [type]: {
        expireSec: parseInt(expireSec, 10) || this.defaultExpireSec,
        keyPrefix,
      },
    }

    return this
  }

  async set(type, id, value) {
    const registration = this.registrationMap[type]

    if (!registration) {
      throw new ValueCacheRegistrationNotFoundError('registration not found', {
        type,
      })
    }

    const { keyPrefix, expireSec } = registration

    const key = ValueCache.redisKey(keyPrefix, id)

    const args = [key, value, ...(expireSec ? ['EX', expireSec] : [])]

    return this.redis.set(...args)
  }

  async get(type, id) {
    const registration = this.registrationMap[type]

    if (!registration) {
      throw new ValueCacheRegistrationNotFoundError('registration not found', {
        type,
      })
    }

    const { keyPrefix } = registration

    const key = ValueCache.redisKey(keyPrefix, id)

    return this.redis.get(key)
  }

  async del(type, id) {
    const registration = this.registrationMap[type]

    if (!registration) {
      throw new ValueCacheRegistrationNotFoundError('registration not found', {
        type,
      })
    }

    const { keyPrefix } = registration

    const key = ValueCache.redisKey(keyPrefix, id)

    return this.redis.del(key)
  }
}

module.exports = ValueCache
