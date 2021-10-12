const AppError = require('./AppError.js')
class QueueTaskNotFoundError extends AppError {}
class QueueTaskTriggerError extends AppError {}

class QueueTask {
  static get possibleEvents() {
    return ['handler', 'onSuccess', 'onError']
  }

  static init({ redis, messageQueue }) {
    this.redis = redis
    this.messageQueue = messageQueue
  }

  constructor(obj) {
    if (!obj) return

    this.id = obj.id
      ? obj.id
      : `${new Date().getTime()}${Math.trunc(Math.random() * 10000)}`

    if (obj.refId) {
      this.refId = obj.refId
    }

    if (obj.owner) {
      this.owner = obj.owner
    }

    this.taskType = obj.taskType
    this.payload = obj.payload
    this.queueId
    this.createdAt = obj.createdAt ? new Date(obj.createdAt) : new Date()
  }

  validate() {
    if (!this.taskType) {
      throw new Error(
        'QueueTask validation failed: taskType: Path `taskType` is required.'
      )
    }

    if (!this.constructor.taskTypeEnum.includes(this.taskType)) {
      throw new Error(
        'QueueTask validation failed: taskType: `' +
          this.taskType +
          '` is not a valid enum value for path `taskType`.'
      )
    }
  }

  static async create(obj) {
    const queueTask = new this(obj)
    const { messageExpireTimeSec } = this.taskQueues[queueTask.taskType];

    queueTask.validate()

    await this.redis.set(queueTask.id, JSON.stringify(queueTask), 'EX', messageExpireTimeSec)

    return queueTask
  }

  static async findOne(id) {
    const record = await this.redis.get(id)

    if (!record) return null

    const queueTask = new QueueTask(JSON.parse(record))

    return Array.isArray(queueTask) ? queueTask[0] : queueTask
  }

  static async find(id) {
    const record = await this.redis.get(id)
    const queueTask = new QueueTask(JSON.parse(record))

    return queueTask
  }

  get queueId() {
    if (!this._queueId) {
      const { queue: queueId } = this.constructor.taskQueues[this.taskType];
      this._queueId = queueId
    }

    return this._queueId
  }

  async remove() {
    await this.constructor.redis.del(this.id)

    return this
  }

  async queue() {
    const { messageQueue: mq } = this.constructor

    await mq.queueMessage(
      this.queueId,
      JSON.stringify({ queueTaskId: this.id })
    )

    Logger.log('queueTask', 'trace', { action: 'enqueue', task: this })
  }

  static async queue(taskObj) {
    const task = await this.create(taskObj)

    await task.queue()

    return task
  }

  static async queueMultipleTasks(taskObjs) {
    const tasks = []
    await Promise.each(taskObjs, async taskObj => {
      if (!taskObj) {
        tasks.push({ error: 'queueTask cannot be null' })
        return
      }

      let task
      let taskId = taskObj.id

      try {
        task = await this.create(taskObj)

        //if you check the constructor of a QueueTask actually they should be the same even if we don't do the assignment taskId = task.id
        await task.queue()

        tasks.push(task)
      } catch (e) {
        let obj = Object.assign({}, taskObj, { error: e.message })

        tasks.push(obj)
      }
      return task
    })
    return tasks
  }

  static consume(queueId) {
    if (!this.queues.includes(queueId)) {
    }

    const mq = this.messageQueue
    mq.consumeMessage(queueId, async payload => {
      let content = JSON.parse(payload)

      Logger.log('queueTask', 'trace', {
        action: 'dequeue',
        payloadQueueTaskId: content.queueTaskId
      })

      const res = await this.handle(content)

      return res
    })

    return this
  }

  static async handle(payload) {
    const task = await this.findOne(payload.queueTaskId)

    if (!task) {
      const error = new QueueTaskNotFoundError('queueTask not found', {
        payload,
        code: 'queue_task_not_found'
      })

      const errMsg = 'queueTask not found'

      Logger.log('queueTask', 'error', {
        error,
        action: 'handle',
        payloadQueueTaskId: payload.queueTaskId
      })

      throw error
    }

    let res

    try {
      res = await this.trigger(task.taskType, 'handler', task)
      await task.remove()

      await this.trigger(task.taskType, 'onSuccess', task)
    } catch (error) {
      let err = error

      if (!err.toJSON) {
        err = err.message
      }

      Logger.log('queueTask', 'error', {
        task,
        err,
        action: 'handle',
        payloadQueueTaskId: payload.queueTaskId
      })

      await this.trigger(task.taskType, 'onError', { ...task, error: err })

      throw err
    }

    Logger.log('queueTask', 'trace', {
      task,
      res,
      action: 'handle',
      payloadQueueTaskId: payload.queueTaskId
    })

    return res
  }

  static register(taskType, queue, messageExpireTimeSec = 60 * 60 * 24) {
    if (!this.taskQueues) {
      this.taskQueues = {}
    }
    if (!this.queues) {
      this.queues = []
    }
    if (!this.taskTypeEnum) {
      this.taskTypeEnum = []
    }

    this.taskQueues = {
      ...this.taskQueues,
      [taskType]: {
        queue,
        messageExpireTimeSec,
      },
    }

    if (!this.queues.includes(queue)) {
      this.queues = [...this.queues, queue]
    }

    if (!this.taskTypeEnum.includes(taskType)) {
      this.taskTypeEnum = [...this.taskTypeEnum, taskType]
    }
  }

  static on(taskType, event, handler) {
    if (!this.listeners) {
      this.listeners = {}
    }

    this.listeners = {
      ...this.listeners,
      [taskType]: {
        ...this.listeners[taskType],
        [event]: handler
      }
    }
  }

  static async trigger(taskType, event, task) {
    //suppressing error when accessing listener
    try {
      const listener = this.listeners[taskType][event]
      return await listener(task)
    } catch (e) {
      const err = new QueueTaskTriggerError(
        'queue task trigger listener error',
        { taskType, event, task, error: e }
      )

      Logger.log('queueTask', 'error', {
        action: 'trigger',
        err
      })

      if (event === 'handler') {
        throw e
      }
    }
  }
}

module.exports = QueueTask
