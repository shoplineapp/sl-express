### bindCenters
Sometimes you want to use both NotificationCenter and AcknowledgmentCenter. When a notification is fired, the system will notify services
bindCenters is a way to connect the events

```
// config/app.js
module.exports = {
  plugins: [
    'notificationCenter',
    'acknowledgmentCenter',
    'bindCenter',
  ]
}

// config/bindCenter.js
module.exports = {
  events: [
    'EVENT_ABC'
  ]
}

// config/acknowledgmentCenter.js
module.exports = {
  observers: [
    {
      id: 'SERVICE_A',
      events: [
        'EVENT_ABC',
        'EVENT_DEF',
      ],
      httpOpts: {
        // will be passed directly to the request library
        uri: 'https://service-a.com/tasks',
      }
  ]
}

Notification.fire('EVENT_ABC', payload)

// payload will be sent to SERVICE_A

```


