module.exports = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  database: process.env.REDIS_DATABASE,
  user: process.env.REDIS_USER,
  pass: process.env.REDIS_PASS,
  timeoutMs: process.env.REDIS_TIMEOUT_MS,
  maxRetryDelayMs: process.env.REDIS_MAX_RETRY_DELAY_MS,
}
