class QueueTaskPlugin {
  prepare(app) {

  }

  async connectDependencies(app) {

  }

  async disconnectDependencies(app) {

  }

  async beforeStartService(app) {
    return 'abc'
  }

  async afterStartService(app) {

  }
}

module.exports = QueueTaskPlugin
