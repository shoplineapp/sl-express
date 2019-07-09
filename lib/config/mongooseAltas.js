module.exports = {
  user: process.env.ATLAS_USER,
  pass: process.env.ATLAS_PASS,
  host: process.env.ATLAS_HOST,
  database: process.env.ATLAS_DATABASE,
  opts: {
    useNewUrlParser: true,
  },
}
