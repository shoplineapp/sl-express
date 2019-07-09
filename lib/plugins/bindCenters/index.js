module.exports = {
  prepare(app) {
    const {
      config: {
        bindCenters: {
          events
        }
      },
      notificationCenter,
      acknowledgmentCenter,
    } = app

    events.forEach( event => {
      notificationCenter.register(event, 'acknowledgmentCenter', async function(payload) {
        await acknowledgmentCenter.ack(event, payload)
      })
    })
  }
}
