class QueueTaskPlugin {
  get dependentPlugins() {
    return []
  }

  prepare(app) {

  }

  async connectDependencies(app) {

  }

  async disconnectDependencies(app) {

  }

  async beforeStartService(app) {
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

  async afterStartService(app) {

  }
}

module.exports = QueueTaskPlugin
