module.exports = {
  user: process.env.MONGODB_USER,
  pass: process.env.MONGODB_PASS,
  host: process.env.MONGODB_HOST,
  port: process.env.MONGODB_PORT,
  database: process.env.MONGODB_DATABASE,
  opts: {
    useNewUrlParser: true,
  },
}
