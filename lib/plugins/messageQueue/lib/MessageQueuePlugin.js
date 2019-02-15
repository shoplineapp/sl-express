const RabbitMessageQueue = require('./RabbitMessageQueue.js')

class MessageQueuePlugin {
  prepare(app) {
    const {
      config: { messageQueue },
    } = app

    this.messageQueue = new RabbitMessageQueue(messageQueue)

    app.messageQueue = this.messageQueue
  }

  async connectDependencies(app) {
    log('system', 'info', { messsage: 'connecting MessageQueue' })

    await this.messageQueue.connect()

    log('system', 'info', { messsage: 'MessageQueue connected' })
  }

  async disconnectDependencies(app) {
    log('system', 'info', { messsage: 'disconnecting MessageQueue' })

    await this.messageQueue.close()

    log('system', 'info', { messsage: 'MessageQueue disconnected' })
  }

  async beforeStartService(app) {

  }

  async afterStartService(app) {

  }
}

module.exports = MessageQueuePlugin
