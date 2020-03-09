### using AcknowledgementCenter
AcknowledgmentCenter can call other service via http call when event happen.
Service can be registered in the `config/acknowledgmentCenter.js`
Services will be called after enqueue and dequeue (QueueTask required).

```javascript
// config/app.js
module.exports = {
  plugins: [
    ...plugins, //other plugins
    'acknowledgmentCenter',
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

AcknowledgmentCenter.ack('EVENT_ABC', { 'hello': 'world' })
```


