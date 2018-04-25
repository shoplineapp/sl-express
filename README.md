# Shopline Nodejs Framework

## Objective

To make setting up a nodejs project easier, organized and more 'class'. This is supposed being used internally. That's we add a lot of 'our standard'

This framework is actually based on expressjs. On top of it, we added:

1. App class - A big 'motherboard'
2. A router
3. some default middlewares
4. Dockerfile
5. project folder structure

##### App class
This framework has a Class called App. App acts as a 'motherboard' of the whole application. It controls phases of the app. What the app will do in sequence:

###### loading phase
1. load config from config folder
2. load framework related models and export it to a context(default to be global)
3. import ***services*** folder and export to the context
4. import ***models*** folder and export to the context
5. import ***viewModels*** folder and export as context.ViewModels
6. import ***controllers*** folder and export to the context
7. load ***config/routes.js*** and do the routing using express router

###### starting phase
1. connect to dependent services (like mongo, redis)
2. start the service ( default to starting an express server )

###### stopping phase
1. stop the service ( defaut to stopping an express server )
2. disconnect from dependent services

##### Router
Router is a simple component of the framework. It intends to make routing easier. It intakes a big object, parses it and call the express router to do the routing.

Most of the case, the big routing object will be the config/routes.js

##### middlewares
The middleware can be called before and after request. the name of the middleware will be same as its filename.

##### Dockerfile
The framework will provide the a Dockerfile of building a nodejs application image

##### View models
TBC

## Try it

1. git pull this repo
2. go to example/basic
3. run ``` node app.js ```
4. open your browser and go to http://localhost:3000
5. you can also see an access log

## Use cases

### customizing the app phases

There are a few phases you can customize by doing method overriding. **Alway remember to manage the super method**

###### **app.prepare()**
This phase actually doing the loading phase of the app. most of the case, you would do:

```javascript
prepare() {
super.prepare()
/* your extra loading here */
}
```

###### **app.connectDependencies()**
This phase handle the connection to other service like mongo, redis and rabbitmq. By default, it connects to no services. My suggestion will be:

```javascript
async connectAwesomeService() {
/* connect... connect... connect... */
}

async disconnectAwesomeService() {
/* disconnect... disconnect... disconnect... */
}
async connectDependencies() {
super.connectDependencies()
/* your other connections here */
try { connectAwesomeService() } catch(e) { throw e }
}
```

###### **app.disconnectDependencies()**
This phase handle the connection from other service like mongo, redis and rabbitmq. By default, it disconnect from no services. My suggestion will be:

```javascript
async connectAwesomeService() {
/* connect... connect... connect... */
}

async disconnectAwesomeService() {
/* disconnect... disconnect... disconnect... */
}
async disconnectDependencies() {
super.connectDependencies()
/* your other connections here */
try { disconnectAwesomeService() } catch(e) { throw e }
}
```

###### **app.startService()**
The phase that really start the service. By default, it will start the express server. You can do a customization by condition

```javascript
async startService() {

if (/*this.role == 'SERVER'*/) {
await this.startExpress()
return
}

if (/*this.role == 'WORKER'*/) {
/* start consuming queue */
return
}

}
```

###### **app.stopService()**
The phase to stop the service. By default, it is stopping nothing. You can also do a customization by condition

```javascript
async stopService() {

if (/*this.role == 'SERVER'*/) {
await this.stopExpress()
return
}

if (/*this.role == 'WORKER'*/) {
/* stop consuming queue */
return
}

}
```

### serving an api
##### routing and middlewares
To add a route, you can simply add a string to routes: []. It will split it by spaces. 

The pattern should be:
>HTTP_METHOD URI middleware middleware Controller.action

Sometimes you may not want to insert middleware one by one. Then you can use the preMiddlewares. Please check: 
https://expressjs.com/en/guide/using-middleware.html

The pattern should be:
>REGEX middleware middleware

```javascript
module.exports = {

preMiddlewares: [
'* middleware middleware'
],

routes: [
'GET /index PublicController.index
]

postMiddlewares: [],
}
```

##### add a controller
This is how a controller should be added to the api/controllers directory

```javascript
Class PublicController {

async index(req, res) {

return res.send('hello world')

}

}

module.exports = PublicController
```

### connecting to new services
#### creating new Service
#### config the new service

### config

### adding more logging
### connect to mongo

### using mongoose for models

### using redis

### using message queue (QueueTask)

### starting a docker container





