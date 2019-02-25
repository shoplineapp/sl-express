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
    return 'abc'
  }

  async didStartService(app) {

  }
}

module.exports = QueueTaskPlugin
