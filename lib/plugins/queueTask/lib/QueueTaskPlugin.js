class QueueTaskPlugin {
  async prepare(app) {
    const {
      config: {
        queueTasks
      },
      services: {
        QueueTask,
      },
      models,
      redis,
      messageQueue,
    } = app

    QueueTask.init({
      redis,
      messageQueue,
      queueTasks,
      modelMap: models,
    })
  }
}

module.exports = QueueTaskPlugin
