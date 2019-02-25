module.exports = {

  port: process.env.PORT || 3000,
  role: process.env.APP_ROLE,
  consumerQueueId: process.env.CONSUMER_QUEUE_ID,
  moduleDelimiter: '_',
  directory: 'api',
  plugins: [],

}
