### using NotificationCenter

NotificationCenter can trigger functions when you fire a notification.
1. notificationCenter.register(eventType, observerId, handler)
2. notificationCenter.fire(eventType, payload)
3. handler will be called parallelly

It helps seperating codes. When there is a function with some follow-up functions to call. You may not want to put this call directly within the function since the code will be long and low readibility
With notificationCenter, those follow-up functions can stay in their own models or instance and just register itself to the event.

The notificationCenterPlugin will init a instance as `app.notificationCenter` and also alias `global.NotificationCenter = app.notificationCenrer`

```javascript
// config/app.js
module.exports = {
  plugins: ['notificationCenter']
}

// with the plugin switch on in the app
NotificationCenter.register('MessageCreated', 'messageForwarding`, function(obj) {
  console.log(obj)
})

NotificationCenter.fire('MessageCreated', { 'abc': 'test' })

// { 'abc': 'test' }
```


