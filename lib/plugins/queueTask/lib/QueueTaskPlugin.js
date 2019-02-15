class QueueTaskPlugin {
  didLoadFramework() {

  }

  prepare(app) {

  }

  async connectDependencies(app) {

  }

  async disconnectDependencies(app) {

  }

  async willStartService(app) {
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

  async didStartService(app) {

  }
}

module.exports = QueueTaskPlugin
