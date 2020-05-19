let repl = require('repl')
let app = require(`${process.cwd()}/app.js`)

process.env.NODE_OPTIONS="--experimental-repl-await"

app
  .prepare()
  .then(() => {
    app
      .connectDependencies()
      .then(() => {
        repl.start({}).on('exit', () => {
          return app.disconnectDependencies()
        })
      })
      .catch(console.log)
  })
  .catch(console.log)
