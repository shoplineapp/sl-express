const SQSMessageQueue = require('./SQSMessageQueue.js')

class MessageQueuePlugin {
  prepare(app) {
    const {
      config: { sqsMessageQueue },
      logger,
    } = app

    this.messageQueue = new SQSMessageQueue({
      config: sqsMessageQueue,
      log: logger.log.bind(logger),
    })

    app.messageQueue = this.messageQueue
  }

  async connectDependencies(app) {
    log('system', 'info', { message: 'connecting SQSMessageQueue' })

    await this.messageQueue.connect()

    log('system', 'info', { message: 'MessageQueue connected' })
  }

  async disconnectDependencies(app) {
    log('system', 'info', { message: 'disconnecting SQSMessageQueue' })

    await this.messageQueue.close()

    log('system', 'info', { message: 'MessageQueue disconnected' })
  }

  async willStopService(app) {
    log('system', 'info', { message: 'destroy SQSMessageQueue' })

    await this.messageQueue.stop()

    log('system', 'info', { message: 'MessageQueue destroying' })
  }
}

module.exports = MessageQueuePlugin
