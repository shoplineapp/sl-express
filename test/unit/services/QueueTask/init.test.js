require(process.cwd() + '/test/bootstrap.js')
const QueueTask = require(`${libPath}/services/QueueTask.js`)

class TestSuite extends TestCombo {
  get title() { return 'QueueTask.init' }

  get args() {
    return ['queueTasks', 'modelMap']
  }

  get argTypes() {
    return {
      queueTasks: ['correct'],
      modelMap: ['correct'],
    }
  }

  filter(combination) {
    return true
  }

  extraCombinations() { return [] }

  beforeAll(test, combination) {
  }

  beforeEach(test, combination) {
    test.queueTasks = [
      {
        type: 'TypeA',
        queue: 'highPriority',
        handler: 'ModelA.taskA',
        description: '',
      },
      {
        type: 'TypeB',
        queue: 'highPriority',
        handler: 'ModelB.taskB',
        description: '',
      },
      {
        type: 'TypeC',
        queue: 'highPriority',
        handler: 'ModelC.taskC',
        description: '',
      },
    ]

    test.modelMap = {
      ModelA: class ModelA { static taskA() {} },
      ModelB: class ModelB { static taskB() {} },
      ModelC: class ModelC { static taskC() {} },
    }

    return this.runTest(test, combination);
  }

  afterAll(test, combination) {}

  afterEach(test, combination) {
    jest.restoreAllMocks()
  }

  getArgValues(test, combination, arg, argType) {
    const argValues = {
      queueTasks: {
        correct: test.queueTasks
      },
      modelMap: {
        correct: test.modelMap
      }
    }

    return argValues[arg][argType]
  }

  testMethod(test, combination, argValues) {
    const [queueTasks, modelMap] = argValues

    return QueueTask.init({ queueTasks, modelMap })
  }

  shouldSuccess(combination) {
    const [queueTasks, modelMap] = combination

    return queueTasks.match(/correct/)
      && modelMap.match(/correct/)
  }

  successAssert(test, combination) {
    it('should have correct properties', () => {
      expect(QueueTask.queueTasks).toEqual(test.queueTasks)
      expect(QueueTask.modelMap).toEqual(test.modelMap)
    })

    it('should have correct handlerMap', () => {
      expect(QueueTask.handlerMap).toEqual({
        TypeA: 'ModelA.taskA',
        TypeB: 'ModelB.taskB',
        TypeC: 'ModelC.taskC',
      })
    })

    it('should have correct taskTypeEnum', () => {
      expect(QueueTask.taskTypeEnum).toEqual([
        'TypeA',
        'TypeB',
        'TypeC',
      ])
    })

    it('should have correct queueus', () => {
      expect(QueueTask.queues).toEqual(expect.arrayContaining([
        'default',
        'highPriority',
      ]))
    })

    it('should have correct queueTaskDict', () => {
      const dict = {
        TypeA: {
          type: 'TypeA',
          queue: 'highPriority',
          handler: 'ModelA.taskA',
          description: '',
        },
        TypeB: {
          type: 'TypeB',
          queue: 'highPriority',
          handler: 'ModelB.taskB',
          description: '',
        },
        TypeC: {
          type: 'TypeC',
          queue: 'highPriority',
          handler: 'ModelC.taskC',
          description: '',
        }
      }

      expect(QueueTask.queueTaskDict).toEqual(dict)
    })
  }

  failureAssert(test, combination) {
  }
}

const testSuite = new TestSuite()
testSuite.run()
