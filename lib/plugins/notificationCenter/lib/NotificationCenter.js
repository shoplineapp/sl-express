const AppError = require('../../../services/AppError.js')
const Promise = require('bluebird')

class NotificationCenterEventTypeNotFoundError extends AppError {}
class NotificationCenterEventTypeInvalidError extends AppError {}
class NotificationCenterObserverNotFoundError extends AppError {}
class NotificationCenterObserverInvalidError extends AppError {}
class NotificationCenterHandlerInvalidError extends AppError {}

class NotificationCenter {
  constructor() {
    this.registrations = {}
  }

  register(eventType, observerId, handler) {
    const basicLogObj = {
      eventType,
      observerId,
      action: 'register'
    }

    log('NotificationCenter', 'trace', basicLogObj)

    if (!eventType || eventType === '') {
      const error = new NotificationCenterEventTypeInvalidError(
        'invalid event type',
        { ...basicLogObj },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })

      throw error
    }

    if (!observerId || observerId === '') {
      const error = new NotificationCenterObserverInvalidError(
        'invalid observer',
        { ...basicLogObj },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })

      throw error
    }

    if (!handler || typeof handler !== 'function' ) {
      const error = new NotificationCenterHandlerInvalidError(
        'invalid handler',
        { ...basicLogObj },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })

      throw error
    }

    this.registrations = {
      ...this.registrations,
      [eventType]: {
        ...this.registrations[eventType],
        [observerId]: {
          id: observerId,
          handler,
        }
      }
    }

    return this
  }

  deregister(eventType, observerId) {
    log('NotificationCenter', 'trace', {
      eventType,
      observerId,
      action: 'deregister'
    })

    const eventRegs = this.registrations[eventType]

    if (!eventRegs) {
      // deregister function just need to ensure function wont be called for a event
      return this
    }

    if (!eventRegs[observerId]) { return this }

    delete eventRegs[observerId]

    return this
  }

  async fire(eventType, eventObj) {
    const basicLogObj = {
      eventType,
      eventObj,
      action: 'fire'
    }

    log('NotificationCenter', 'trace', { ...basicLogObj, })

    const eventRegs = this.registrations[eventType]

    if (!eventRegs) {
      const error = new NotificationCenterEventTypeNotFoundError(
        'event type not exist',
        { eventType },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })

      throw error
    }

    const keys = Object.keys(eventRegs)

    await Promise.map(keys, key => {
      return this.trigger(eventType, key, eventObj)
    })

    return this
  }

  trigger(eventType, observerId, eventObj) {
    const basicLogObj = {
      eventType,
      observerId,
      eventObj,
      action: 'trigger'
    }

    log('NotificationCenter', 'trace', { ...basicLogObj, })

    const eventRegs = this.registrations[eventType]

    if (!eventRegs) {
      const error = new NotificationCenterEventTypeNotFoundError(
        'event type not exist',
        { eventType },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, })

      throw error
    }

    const observer = eventRegs[observerId]
    if (!observer) {
      const error = new NotificationCenterObserverNotFoundError(
        'observer not registered',
        { eventType },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })
      throw error
    }

    const {
      handler,
    } = observer

    if (!handler || typeof handler !== 'function') {
      const error = new NotificationCenterHandlerInvalidError(
        'invald handler',
        { eventType },
      )

      log('NotificationCenter', 'error', { ...basicLogObj, error, })

      throw error
    }

    return handler(eventObj)
  }
}

module.exports = NotificationCenter
