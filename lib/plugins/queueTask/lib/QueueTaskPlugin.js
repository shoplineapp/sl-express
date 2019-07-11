class QueueTaskPlugin {
  async prepare(app) {
    const { redis, messageQueue } = app

    QueueTask.init({
      redis,
      messageQueue
    })

    this.loadConfig(app)
  }

  loadConfig(app) {
    const {
      config: { queueTasks },
      services: { QueueTask }
    } = app

    // apply config to QueueTask model
    queueTasks.forEach(queueTask => {
      QueueTask.register(queueTask.type, queueTask.queue)

      QueueTask.possibleEvents.forEach(event => {
        QueueTask.on(queueTask.type, event, function(task) {
          const listenerStr = queueTask[event]

          const klassMap = { ...app.services, ...app.models }

          if (typeof listenerStr === 'function') {
            return listenerStr(task)
          }

          if (!listenerStr) {
            return
          }

          const [klassStr, method] = listenerStr.split('.')

          const klass = klassMap[klassStr]
          if (!klass) {
            return
          }

          const handler = klass[method].bind(klass)
          if (!handler) {
            return
          }

          return handler(task)
        })
      })
    })
  }
}

module.exports = QueueTaskPlugin
