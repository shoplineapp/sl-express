/*
 * @class QueueTask
 *
 * @description the key model of the whole system. standardize a structure for task being queued and handled later
 *
 */

let _queueTasks
let _taskTypeEnum
let _queueTaskDict
let _queues

class QueueTask {

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

      _queues = this.queueTasks.map( (task) => {

        return task.queue

      })

      if (!_queues.includes('default')) {

        _queues.push('default')

      }

    }

    return _queues

  }

  static set queueTasks(value) {

    _queueTasks = value

  }

  static get queueTasks() {

    return _queueTasks

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

    Logger.log('queueTask', 'info', { task: this })

  }

  /* priority = default, high */
  static async queue(taskObj, priority = 'default') {

    let task

    try { task = await this.create(taskObj) } catch(e) { throw e }

    await task.queue()

    return task

  }

  static async queueTasks(taskObjs) {

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

      /* may need more logic to handle the async */
      let res

      try { res = await this.handle(content)}
      catch(e) { throw e }

      return res

    })

    return this

  }

  static async handle(payload) {

    let task = await this.findOne(payload.queueTaskId)

    if (!task) {

      let errMsg = 'queueTask not found'

      Logger.log('queueTask', 'error', { payloadQueueTaskId: payload.queueTaskId, error: errMsg })

      throw new Error(errMsg)

    }

    let handlerStr = this.queueTaskDict[task.taskType].handler

    if (!handlerStr) {

      let errMsg = 'handler not found in handler routes'

      Logger.log('queueTask', 'error', { payloadQueueTaskId: payload.queueTaskId, task, error: errMsg })

      throw new Error(errMsg)

    }

    let [ model, method ] = handlerStr.split('.')

    let handler = app.models[model][method]

    if (!handler) {

      let errMsg = 'handler not found'

      Logger.log('queueTask', 'error', { payloadQueueTaskId: payload.queueTaskId, task, error: errMsg })

      throw new Error(errMsg)

    }

    let res

    try {

      res = await app.models[model][method](task)
      await task.remove()

    }
    catch(e) {

      Logger.log('queueTask', 'error', { payloadQueueTaskId: payload.queueTaskId, task, error: e.message })
      throw e

    }

    Logger.log('queueTask', 'info', { payloadQueueTaskId: payload.queueTaskId, task, res })

    return res
  }

}

module.exports = QueueTask
