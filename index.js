module.exports = {
  App: require('./lib/models/App.js'),
  MongooseModel: require('./lib/models/MongooseModel.js'),
  Router: require('./lib/models/Router.js'),
  AppError: require('./lib/services/AppError.js'),
  HandlerRouter: require('./lib/services/HandlerRouter.js'),
  Logger: require('./lib/services/Logger.js'),
//  MessageQueue: require('./lib/services/MessageQueue.js'),
  QueueTask: require('./lib/services/QueueTask.js'),
//  Redis: require('./lib/services/Redis.js'),
}
