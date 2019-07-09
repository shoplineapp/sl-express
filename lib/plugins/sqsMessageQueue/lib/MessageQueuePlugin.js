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
    log('system', 'info', { messsage: 'connecting SQSMessageQueue' })

    await this.messageQueue.connect()

    log('system', 'info', { messsage: 'MessageQueue connected' })
  }

  async disconnectDependencies(app) {
    log('system', 'info', { messsage: 'disconnecting SQSMessageQueue' })

    await this.messageQueue.close()

    log('system', 'info', { messsage: 'MessageQueue disconnected' })
  }
}

module.exports = MessageQueuePlugin
