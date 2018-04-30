let repl = require("repl")
let app = require(`${process.cwd()}/app.js`)

app.prepare()
app.connectDependencies()
  .then( () => {

    repl.start({}).on('exit', () => {

      return app.disconnectDependencies()

    })

  }).catch(console.log)
