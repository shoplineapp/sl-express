let repl = require('repl')
let stubber = require('async-repl/stubber');
let app = require(`${process.cwd()}/app.js`)

app
  .prepare()
  .then(() => {
    app
      .connectDependencies()
      .then(() => {
        let replInstance = repl.start({})
        stubber(replInstance);
        replInstance.on('exit', () => {
          return app.disconnectDependencies()
        })
      })
      .catch(console.log)
  })
  .catch(console.log)
