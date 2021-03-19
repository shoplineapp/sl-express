module.exports = {

  port: process.env.PORT || 3000,
  role: process.env.APP_ROLE,
  consumerQueueId: process.env.CONSUMER_QUEUE_ID,
  moduleDelimiter: '_',
  directory: 'api',
  plugins: [],
  keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT || 65) * 1000,
  headersTimeout: parseInt(process.env.HEADERS_TIMEOUT || 60) * 1000,
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || 60) * 1000,
}
