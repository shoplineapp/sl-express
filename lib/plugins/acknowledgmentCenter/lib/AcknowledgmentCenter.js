const AppError = require('../../../services/AppError.js')
const Promise = require('bluebird')
const request = require('request-promise')

class AcknowledgmentCenterEventTypeNotFoundError extends AppError {}
class AcknowledgmentCenterEventTypeInvalidError extends AppError {}
class AcknowledgmentCenterObserverNotFoundError extends AppError {}
class AcknowledgmentCenterObserverInvalidError extends AppError {}

class AcknowledgmentCenter {
  register(event, observer) {
    const basicLogObj = {
      event,
      observer,
      action: 'register'
    }

    if (!event || event === '') {
      const error = new AcknowledgmentCenterEventTypeInvalidError(
        'invalid event',
        { ...basicLogObj }
      )

      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error })

      throw error
    }

    if (!observer || Object.keys(observer).length === 0) {
      const error = new AcknowledgmentCenterObserverInvalidError(
        'invalid observer',
        { ...basicLogObj }
      )

      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error })

      throw error
    }

    if (!this.eventObserversDict) {
      this.eventObserversDict = {}
    }

    this.eventObserversDict = {
      ...this.eventObserversDict,
      [event]: [...(this.eventObserversDict[event] || []), observer]
    }

    return this
  }

  async ack(event, payload) {
    if (!Object.keys(this.eventObserversDict).includes(event)) {
      const error = new AcknowledgmentCenterEventTypeNotFoundError(
        'event not found',
        { event }
      )

      log('AcknowledgmentCenter', 'error', { action: 'ack', payload: payload })

      throw error
    }

    log('Acknowledgment', 'trace', { action: 'ack', payload: payload })

    const observers = this.eventObserversDict[event]

    await Promise.map(observers, async (observer) => {
      await this.enqueue(event, payload, observer)

      return observer
    })

    return this
  }

  async enqueue(event, acknowledgmentObj, observer) {
    const payload = {
      id: `acknowledgment_${acknowledgmentObj.id}`,
      taskType: 'ACKNOWLEDGMENTCENTER_ACK',
      payload: {
        event,
        acknowledgmentObj,
        observer,
      },
    }

    log('Acknowledgment', 'trace', { action: 'enqueue', payload: acknowledgmentObj })

    await QueueTask.queue(payload)

    return payload
  }

  async dequeue(queueTask) {
    log('Acknowledgment', 'trace', { action: 'dequeue', payload: queueTask.payload })

    let res
    const { event, acknowledgmentObj: payload, observer } = queueTask.payload

    if (queueTask.payload.observer.httpOpts) {
      res = await this.httpAck(event, observer, payload)
    }

    return res
  }

  async httpAck(eventType, observer, eventObj) {
    const basicLogObj = {
      eventType,
      observer,
      eventObj,
      action: 'httpAck'
    }

    if (!Object.keys(this.eventObserversDict).includes(eventType)) {
      const error = new AcknowledgmentCenterEventTypeNotFoundError(
        'event type not found',
        { eventType },
      )

      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error })

      throw error
    }

    if (!observer) {
      const error = new AcknowledgmentCenterObserverNotFoundError(
        'observer invalid',
        { eventType },
      )

      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error })

      throw error
    }

    const { httpOpts } = observer

    if (!httpOpts) {
      const error = new AcknowledgmentCenterObserverInvalidError(
        'observer invalid',
        { eventType },
      )

      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error })

      throw error
    }

    try {
      const res = await request.post(httpOpts.uri, {
        ...httpOpts,
        json: true,
        body: eventObj
      })

      return res
    } catch (e) {
      log('AcknowledgmentCenter', 'error', { ...basicLogObj, error: e })

      throw e
    }
  }
}

module.exports = AcknowledgmentCenter
