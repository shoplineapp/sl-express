module.exports = {
  accessKeyId: process.env.SQS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY,
  apiVersion: '2012-11-05',
  region: process.env.SQS_REGION,
  queuePrefix: process.env.SQS_QUEUE_PREFIX,
  queueMap: {
    highPriority: process.env.MQ_HIGH_PRIORITY_QUEUE,
    default: process.env.MQ_DEFAULT_QUEUE,
  },
  maxNumberOfMessages: process.env.SQS_MAX_NUMBER_OF_MESSAGES
}
