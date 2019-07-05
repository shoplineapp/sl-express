const NotificationCenter = require('./NotificationCenter.js')

class NotificationCenterPlugin {
  async prepare(app) {
    const notificationCenter = new NotificationCenter()

    app.notificationCenter = notificationCenter

    Object.assign(app.context, { NotificationCenter: notificationCenter })

  }
}

module.exports = NotificationCenterPlugin
