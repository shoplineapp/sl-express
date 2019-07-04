require(process.cwd() + '/test/bootstrap.js')
const QueueTaskPlugin = require(`${libPath}/plugins/queueTask/lib/QueueTaskPlugin.js`)
const QueueTask = require(`${libPath}/services/QueueTask.js`)

class TestSuite extends TestCombo {
  get title() {
    return 'QueueTaskPlugin.loadConfig'
  }

  get args() {
    return ['queueTasks']
  }

  get argTypes() {
    return {
      queueTasks: ['correct']
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() {
    return []
  }

  beforeAll(test, combination) {}

  beforeEach(test, combination) {
    test.queueTasks = [
      {
        type: 'TypeA',
        queue: 'highPriority',
        handler: 'ModelA.taskA',
        description: ''
      },
      {
        type: 'TypeB',
        queue: 'highPriority',
        handler: 'ModelB.taskB',
        description: ''
      },
      {
        type: 'TypeC',
        queue: 'default',
        handler: 'ModelC.taskC',
        description: ''
      }
    ]

    return this.runTest(test, combination)
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      queueTasks: {
        correct: test.queueTasks
      }
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [queueTasks] = argValues

    QueueTask.init({
      host: 'redis',
      port: 6379,
      database: 10
    })

    const queueTaskPlugin = new QueueTaskPlugin()

    return queueTaskPlugin.loadConfig({
      config: { queueTasks },
      services: { QueueTask }
    })
  }

  shouldSuccess(combination) {
    const [queueTasks] = combination

    return queueTasks.match(/correct/)
  }

  successAssert(test, combination) {
    it('should have correct taskQueues', () => {
      expect(QueueTask.taskQueues).toEqual({
        TypeA: 'highPriority',
        TypeB: 'highPriority',
        TypeC: 'default'
      })
    })

    it('should have correct taskTypeEnum', () => {
      expect(QueueTask.taskTypeEnum).toEqual(
        expect.arrayContaining(['TypeA', 'TypeB', 'TypeC'])
      )
    })

    it('should have correct queues', () => {
      expect(QueueTask.queues).toEqual(
        expect.arrayContaining(['default', 'highPriority'])
      )
    })

    it('should have correct listeners', () => {
      QueueTask.taskTypeEnum.forEach(taskType => {
        expect(QueueTask.listeners[taskType]).toHaveProperty('handler')
        expect(QueueTask.listeners[taskType]).toHaveProperty('onError')
        expect(QueueTask.listeners[taskType]).toHaveProperty('onSuccess')
      })
    })
  }

  failureAssert(test, combination) {}
}

const testSuite = new TestSuite()
testSuite.run()
