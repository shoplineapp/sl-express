module.exports = function(req, res, next) {

  req._startTime = new Date

  let oldWrite = res.write
  let oldEnd = res.end

  let chunks = []

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

    if (res.statusCode >= 400) {
      log.error = res.body
    }

    Logger.log('api', 'trace', log)

  })


  res.write = function(chunk) {

    chunks.push(chunk)

    oldWrite.apply(res, arguments)

  }

  res.end = function(chunk) {

    if (chunk) { chunks.push(chunk) }

    res.body = chunks.toString('utf8')

    oldEnd.apply(res, arguments)

  }

  res.on('close', function() {

    //don't know if we need this

  })

  return next()

}
