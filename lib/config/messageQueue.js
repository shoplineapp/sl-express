module.exports = {

  host: `${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}`,
  port: process.env.RABBITMQ_PORT,
  prefetch: process.env.RABBITMQ_PREFETCH_COUNT,
  queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || (new Date).getTime()

}
