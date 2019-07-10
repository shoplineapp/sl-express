function listQueues(params) {
  return {
    promise: function() {
      const url = `${params.QueueNamePrefix}sqs-stg`
      return {
        QueueUrls: [url]
      }
    }
  }
}

function sendMessage(params) {
  return {
    promise: function() {
      return new Promise(function(resolve) {
        resolve({
          ResponseMetadata: params,
          MD5OfMessageBody: params.MessageBody,
          MessageId: 123
        })
      })
    }
  }
}

class SQS {
  constructor() {
    this.listQueues = listQueues
    this.sendMessage = sendMessage
  }
}

module.exports = SQS
