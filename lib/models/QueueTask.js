/*
 * @class QueueTask
 *
 * @description the key model of the whole system. standardize a structure for task being queued and handled later
 *
 */

let _taskTypeEnum
let _queueTaskDict
let _queues
let _handlerRouter
let _handlerMap

const HandlerRouter = require('../services/HandlerRouter.js')

class QueueTask {
  static init({ queueTasks, modelMap }) {
    this.queueTasks = queueTasks
    this.modelMap = modelMap

    _taskTypeEnum = null
    _queueTaskDict = null
    _queues = null
    _handlerRouter = null
    _handlerMap = null
  }

  static get handlerRouter() {
    if (_handlerRouter) {
      const { handlerMap, modelMap } = this

      _handlerRouter = new HandlerRouter({
        handlerMap,
        modelMap,
      })
    }

    return _handlerRouter
  }

  static get handlerMap() {
    if (!_handlerMap) {
      _handlerMap = Object.keys(this.queueTaskDict)
        .reduce( (acc, key) => {
          return {
            ...acc,
            [key]: this.queueTaskDict[key].handler,
          }
        }, {})
    }

    return _handlerMap
  }

  static get taskTypeEnum() {

    if (!_taskTypeEnum) {

      _taskTypeEnum = this.queueTasks.map( (task) => {

        return task.type

      })

    }

    return _taskTypeEnum

  }

  static get queues() {
    if (!_queues) {
      _queues = this.queueTasks.reduce( (acc, { queue }) => {
        if (acc.includes(queue)) {
          return acc
        }

        return [
          ...acc,
          queue,
        ]
      }, [])

      if (!_queues.includes('default')) {
        _queues.push('default')
      }
    }

    return _queues
  }

  static get queueTaskDict() {

    if (!_queueTaskDict) {

      let handler = (accumulator, current) => {

        accumulator[current.type] = current

        return accumulator

      }

      _queueTaskDict = this.queueTasks.reduce(handler, {})

    }

    return _queueTaskDict

  }

  constructor(obj) {

    if (!obj) return

    this.id = obj.id ? obj.id : `${(new Date).getTime()}${Math.trunc(Math.random() *10000)}`

    this.taskType = obj.taskType
    this.payload = obj.payload
    this.createdAt = new Date

  }

  validate() {

    if (!this.taskType) {

      throw new Error('QueueTask validation failed: taskType: Path `taskType` is required.')

    }

    if (!QueueTask.taskTypeEnum.includes(this.taskType)) {

      throw new Error('QueueTask validation failed: taskType: `' + this.taskType + '` is not a valid enum value for path `taskType`.')

    }

  }

  static async create(obj) {

    let queueTask = new QueueTask(obj)

    try { queueTask.validate() }
    catch(e) { throw e }

    await Redis.sharedRedis.set(queueTask.id, JSON.stringify(queueTask))

    return queueTask

  }

  static async findOne(id) {

    let queueTask

    try {

      let record = await Redis.sharedRedis.get(id)

      if (!record) return null

      queueTask = new QueueTask(JSON.parse(record))

    }catch(e) { throw e; }


    return Array.isArray(queueTask) ? queueTask[0] : queueTask

  }

  static async find(id) {

    let queueTask

    try {

      let record = await Redis.sharedRedis.get(id)
      queueTask = new QueueTask(JSON.parse(record))

    }catch(e) { throw e; }


    return queueTask

  }

  get queueId() {

    if (!this._queueId) {

      this._queueId = QueueTask.queueTaskDict[this.taskType].queue

    }

    return this._queueId

  }

  async remove() {

    try {

      await Redis.sharedRedis.del(this.id)

    }catch(e) { throw e; }

    return this

  }

  async queue() {

    let mq = MessageQueue.sharedMessageQueue

    await mq.queueMessage(this.queueId, new Buffer(JSON.stringify({ queueTaskId: this.id })))

    Logger.log('queueTask', 'trace', { action: 'enqueue', task: this })

  }

  static async queue(taskObj) {

    let task

    try { task = await this.create(taskObj) } catch(e) { throw e }

    await task.queue()

    return task

  }

  static async queueMultipleTasks(taskObjs) {

    let tasks = []

    await Promise.each(taskObjs, async (taskObj) => {

      if (!taskObj) {

        tasks.push({ error: "queueTask cannot be null" })

        return

      }

      let task
      let taskId = taskObj.id

      try {

        task = await this.create(taskObj)

        //if you check the constructor of a QueueTask actually they should be the same even if we don't do the assignment
        taskId = task.id

        await task.queue()

        tasks.push(task)

      }catch (e) {

        let obj = Object.assign({}, taskObj, { error: e.message })

        tasks.push(obj)

      }

      return task

    })

    return tasks

  }


  static consume(queueId) {

    if (!this.queues.includes(queueId)) {

      console.log("WARNING: you are not consuming a queue in this application")
      console.log("possible queue id: " + this.queues)
      console.log("provided queue id: " + queueId)

    }

    let mq = MessageQueue.sharedMessageQueue

    mq.consumeMessage(queueId, async (payload) => {

      let content = JSON.parse(payload.content)

      Logger.log('queueTask', 'trace', { action: 'dequeue', payloadQueueTaskId: content.queueTaskId })

      /* may need more logic to handle the async */
      let res

      try {

        res = await this.handle(content)

      } catch(e) {

        Logger.log('queueTask', 'error', { action: 'dequeue', payloadQueueTaskId: content.queueTaskId, error: e.message })

        throw e

      }

      return res

    })

    return this

  }

  static async handle(payload) {

    let task = await this.findOne(payload.queueTaskId)

    if (!task) {

      let errMsg = 'queueTask not found'

      Logger.log('queueTask', 'error', { action: 'handle', payloadQueueTaskId: payload.queueTaskId, error: errMsg })

      throw new Error(errMsg)

    }

    let res

    try {

      res = await this.handlerRouter(task.taskType, task)
      await task.remove()

    }
    catch(e) {

      Logger.log('queueTask', 'error', { action: 'handle', payloadQueueTaskId: payload.queueTaskId, task, error: e.message })
      throw e

    }

    Logger.log('queueTask', 'trace', { action: "handle", payloadQueueTaskId: payload.queueTaskId, task, res })

    return res
  }

}

module.exports = QueueTask
