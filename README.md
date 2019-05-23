# Shopline Nodejs Framework

## Objective

This framework sets up an organized NodeJS project in an easier and 'classier' manner. Since this is being used internally, we added our way of standardizing the code structure.

This framework wraps around ExpressJS, with the following additions:

1. App class - A big 'motherboard'
2. A router
3. some default middlewares
4. Dockerfile
5. project folder structure

##### App class

This framework has an _App_ Class which acts as a 'motherboard' of the whole application. It controls the phases of the app in the following sequence:

###### loading phase

1. load configurations from /config folder
2. load framework related models and export it to a context(default to be global)
3. import **_services_** folder and export to the context
4. import **_models_** folder and export to the context
5. import **_viewModels_** folder and export as context.ViewModels
6. import **_controllers_** folder and export to the context

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

## Getting Started with an example

#### installing sl-express framework

1. Install [NodeJS](https://nodejs.org) on your machine
2. Install [@shopline/sl-express](https://www.npmjs.com/package/@shopline/sl-express) on your machine `npm i -g @shopline/sl-express`
3. Clone this repo to your machine
4. Go into the `example/basic` directory on your terminal and execute `npm install`

#### starting a sample express server

1. Run `sl-express start` on your terminal
2. Open your browser and go to http://localhost:3000
3. You should also see a log on terminal that the route has been requested

#### starting a sample express console

1. Run `sl-express console` on your terminal and this will bring you into the express console
2. Type `app.id` on your express console to see the time when you start your console

#### starting the express server with docker run

> example/basic/Dockerfile has already been configured

1. Install [Homebrew](https://brew.sh/) on your machine
2. Install docker via Homebrew `brew cask install docker`
3. Go into the `example/basic` directory on your terminal and build a docker image by `docker build --tag=test-app .`
4. Create a docker container by `docker run -p 3000:3000 test-app`
5. Open your browser and go to http://localhost:3000
6. Run `ctrl+c` to stop the container. You can check all the containers you have with `docker ps -a`
7. `docker rm <CONTAINER_ID>` to remove the container

#### starting the express server with docker-compose

> example/basic/docker-compose has already been configured

1. Go into the `example/basic` directory on your terminal and build the images by `docker-compose build`
2. Create docker containers by `docker-compose up`
3. Open your browser and go to http://localhost:3000
4. Run `ctrl+c` to stop the container or you can run `docker-compose stop`

## Use cases

### customizing the app phases

There are a few phases you can customize by doing method overriding. **Always remember to manage the super method**

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
    /* the best practice is to diconnect in a reversed sequence of connections
    /* your other connections here */
    try { disconnectAwesomeService() } catch(e) { throw e }
    super.connectDependencies()

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

> HTTP_METHOD URI middleware middleware Controller.action

Sometimes you may not want to insert middleware one by one. Then you can use the preMiddlewares. Please check:
https://expressjs.com/en/guide/using-middleware.html

The pattern should be:

> REGEX middleware middleware

```javascript
module.exports = {

  preMiddlewares: [
    '* middleware middleware'
  ],

  routes: [
    'GET /index PublicController.index'
  ]

  postMiddlewares: [],
}
```

##### add a controller

This is how a controller should be added to the api/controllers directory.

> In this example, router.js can reference the index controller by PublicController.index.

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

first you will need to create a class under api/services directory.

_api/services/AwesomeService.js_

```javascript
let _theLibYouUse = null;
let _sharedAwesomeService = null;

class AwesomeService {
    /* a lazy loading singleton. It ensures the lib would not be required if the service is not used. It may seems a bit dirty for requiring lib in functions. But it makes this service able to move into the core framework some days.
     */

    static get theLibYouUse() {
        if (!_theLibYouUse) {
            _theLibYouUse = require('theLibYouUse');
        }

        return _theLibYouUse;
    }

    /* A singleton. Most of the case you will just need to init one Service instance. You still better do a signleton pattern so that you can do stubbing easily when doing unit test on Model methods that make use of this service */

    static get sharedAwesomeService() {
        if (!_sharedAwesomeService) {
            _sharedAwesomeService = new AwesomeService();
        }

        return _sharedAwesomeService;
    }

    /* As singleton is used, it will be hard to pass the config when initializing the service. That's why we use init instead of constructor. Besides, we may not want to set the config or directly get the global config inside this class because it's better to keep it with fewer dependencies. The config should be passed to the signleton in the motherbroad */

    init(config) {
        this.endpoint = config.endpoint;
        this.abc = config.abc;
    }
}

module.exports = AwesomeService;
```

_config/awesomeService.js_

```javascript
module.exports = {
    endpoint: process.env.AWESOME_SERVICE_ENPOINT
};
```

_.env_

```
/* all env-dependent variable should put in .env file */
AWESOME_SERVICE_ENPOINT=http://awesomeservice.com/api
```

_app.js_

```javascript
  async connectAwesomeService() {

    await AwesomeService.sharedAwesomeService.init(this.config.awesomeService).connect()

  }

  async disconnectAwesomeService() {

    await AwesomeService.SharedAwesomeService.disconnect()

  }

  async connectDependencies() {

    await super.connectDependencies()
    await this.connectAwesomeService()

  }

  async disconnectDependencies() {

    await this.disconnectAwesomeService()
    await super.disconnectDependencies()

  }

```

### config

In most of the frameworks, they like to do a structure like

```
- config/
  - env/
    - development.js
    - production.js
  - config1
  - config2
```

And these framework will first gather config1 and config2, and do a overriding with the specified environment config. Yet this framework **WON'T** do this.

> All environment related config should be controlled by .env file

### add logging

This framework use log4js wrapped in a service Logger. Things can be configured in **_config/logger.js_**.

**_Please config your config/app.js_**

```javascript
{
    plugins: ['logger'];
}
```

There is no magic for configuring the Logger. Please visit: https://www.npmjs.com/package/log4js

Most of the cases, you just need to add categories like 'broadcast', 'queueHandling'. It just bases on what feature you want to take log.

Besides, as we are using cloudwatch, we just append our logs to stdout at this moment.

## Use cases with built-in Model / Service

### using mongoose for models

There is a built-in model called **MongooseModel**. This model wants to:

1. make class declaration using **_class_** instead of using **_prototype_**
2. handle the way of mixing the mongoose schema and the class by using **_mongoose.model_**
3. provide a more user friendly way to use the mongoose **_pre_** and **_post_** hook.

```javascript
class AwesomeModel extends MongooseModel {
    static schema() {
        /* you can always access the mongoose library with this.mongoose */
        return {
            ownerId: { type: String, required: true }
        };
    }

    static beforeSave(obj, next) {
        //do something
        return next();
    }
}

module.exports = AwesomeModel;
```

##### connecting to mongo

Mongo should be connected when MongooseModel is used. There is a static getter function in MongooseModel and App. The one in MongooseModel will return the mongoose lib. The one in App will return the mongoose in MongooseModel. They are actually, most of the time, the same.

There are built-in function for connection mongo. What you need to do is adding ENV to your .env file. Basically, we have a **_config/mongoose.js_** in the framework that mapping a mongo endpoint to ENVs so you just need to add ENV.

```
MONGODB_USER
MONGODB_PASS
MONGODB_HOST
MONGODB_PORT
MONGODB_DATABASE
```

**_Please config your config/app.js_**

```javascript
{
    plugins: ['mongoose'];
}
```

**_Add the following to your docker-compose.yml_**

```yaml
version: '3'

services:
    # your app build
    # ...

    mongo:
        image: 'mongo'
        ports:
            - '27017:27017' # configure your port
        volumes:
            - 'mongodb:/data/db'
    # ...
    # your other services (rabbitmq, redis)

volumes:
    mongodb:
        driver: local
```

### using redis

By default we have a config file in framework mapping ENVs to the redis config

```
REDIS_USER
REDIS_PASS
REDIS_HOST
REDIS_PORT
REDIS_DATABASE
```

**_Please config your config/app.js_**

```javascript
{
    plugins: ['redis'];
}
```

**_Add the following to your docker-compose.yml_**

```yaml
version: '3'

services:
    # your app build
    # ...

    redis:
        image: 'redis'
        ports:
            - '6379:6379' # configure your port

    # ...
    # your other services (rabbitmq, mongo)
```

### using messageQueue

By default we have a config file in framework mapping ENVs to the redis config

```
RABBITMQ_USER
RABBITMQ_PASS
RABBITMQ_HOST
RABBITMQ_PORT
RABBITMQ_PREFETCH_COUNT
RABBITMQ_QUEUE_PREFIX
```

**_Please config your config/app.js_**

```javascript
{
    plugins: ['messageQueue'];
}
```

**_Add the following to your docker-compose.yml_**

```yaml
version: '3'

services:
    # your app build
    # ...

    rabbitmq:
        image: 'rabbitmq:3-management'
        ports:
            - '5672:5672' # configure your port
            - '15672:15672'
    # ...
    # your other services (redis, mongo)
```

### using QueueTask

You need to connect to both Redis and Rabbitmq for this feature. By default, we will store the payload of a task to Redis and only send the task id to the rabbitmq. This design will avoid sending too large payload to the rabbitmq. QueueTask, as a model, will handle all this for you.

Please refer to **using redis** section.
Please refer to **using messageQueue** section.

To get it set up, you need to add the following code:

**_Add queueTask plugin to config/app.js_**

```javascript
{
    plugins: ['queueTask', '...your other plugins'];
}
```

**_Add a config file config/queueTask.js_**

```javascript
module.exports = [
    {
        type: 'TEST', // an identifier for you task
        queue: 'test_queue', // the CONSUMER_QUEUE_ID or consumerQueueId to handle the queue
        handler: 'Test.dequeue', // the handler of the tasks of this type
        description: 'any remarks you want to add'
    }
];
```

**_Add a Test.js file on api/models/Test.js to queue and dequeue handling_**

```javascript
class Test {
    static async enqueue(test) {
        //do something to make a payload
        let payload = {
            firstName: test.firstName,
            sex: test.sex
        };

        await QueueTask.queue({
            taskType: 'TEST',
            payload: payload
        });
    }

    static async dequeue(queueTask) {
        let payload = queueTask.payload;

        // handle the payload
        console.log(payload.firstName);
    }
}

module.exports = Test;
```

To test the queueTask feature, you will have to start your app with a consumer and publisher role. To do so, you can use `docker-compose` to instantiate two containers of the app, one with a consumer role and the other with a publisher role.

**_Modify your docker-compose.yml_**

```yaml
services:
    test-app-publisher:
        build: .
        ports:
            - '3000:3000'
        volumes:
            - .:/app
            - /app/node_modules
        environment:
            - APP_ROLE=PUBLISHER # to start the container using a publisher role
        command: bash -c "chmod +x ./wait-for-it.sh && ./wait-for-it.sh rabbitmq:5672 -- nodemon server.js"

    test-app-consumer:
        build: .
        volumes:
            - .:/app
            - /app/node_modules
        environment:
            - APP_ROLE=CONSUMER # to start the container using a consumer role
            - CONSUMER_QUEUE_ID=test_queue # set the id the same as the queue attr in config/queueTask.js
        command: bash -c "chmod +x ./wait-for-it.sh && ./wait-for-it.sh rabbitmq:5672 -- nodemon server.js"
    #
    #
    # your other services (redis, mongo, rabbitmq)
```

### using Plugin

You can build any plugin you like using Plugin feature. SL-expres will

1. read the app.config.plugins
2. read `/plugins` of YOUR application folder and import the plugin ONLY the key exists in the config
3. if there are some keys in the config still cannot be imported, it try to import them from sl-express

the plugin must fulfill the directory structure

```
// plugins
- samplePlugin1
  - index.js
- samplePlugin2
  - index.js;
```

the export of the index.js must provide the following interfaces

1. prepare(app) { }
2. async connectDependencies(app) { }
3. async disconnectDependencies(app) { }
4. async willStartService(app) { }
5. async didStartService(app) { }

These interfaces are actaully about those App phases. check the class App for details

`app` means the App instance. You can get properties through this app instance. Most of the cases, you will need the app.config

### starting a docker container

TBC
