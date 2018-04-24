module.exports = function(req, res, next) {

  req._startTime = new Date

  res.on('finish', function() {

    let log = {
      res: { statusCode: res.statusCode },
      req: {
        url: req.url,
        headers: req.headers,
        method: req.method,
        httpVersion: req.httpVersion,
        originUrl: req.originalUrl,
        body: req.body,
        query: req.params
      },
      responseTime: new Date - req._startTime,
      level: "info",
      message: `${req.method} ${req.url} HTTP/${req.httpVersion}`,
      timestamp: + req._startTime
    }

    Logger.log('api', 'info', log)

  })

  res.on('close', function() {

    //don't know if we need this

  })

  return next()

}
