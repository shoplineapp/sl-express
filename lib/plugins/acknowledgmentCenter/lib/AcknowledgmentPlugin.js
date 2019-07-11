const AcknowledgmentCenter = require('./AcknowledgmentCenter.js')

class AcknowledgmentPlugin {
  async prepare(app) {
    this.init(app)
    this.registrationByConfig(app)
  }

  init(app) {
    const acknowledgmentCenter = new AcknowledgmentCenter()

    this.acknowledgmentCenter = acknowledgmentCenter

    app.acknowledgmentCenter = acknowledgmentCenter

    app.models.AcknowledgmentCenter = acknowledgmentCenter

    Object.assign(app.context, { AcknowledgmentCenter: acknowledgmentCenter })
  }

  registrationByConfig(app) {
    const {
      config: {
        acknowledgmentCenter: {
          observers
        },
      }
    } = app


    observers.forEach( observer => {
      observer.events.forEach( event => {
        this.acknowledgmentCenter.register(
          event,
          {
            id: observer.id,
            httpOpts: observer.httpOpts,
          }
        )
      })
    })
  }
}

module.exports = AcknowledgmentPlugin
