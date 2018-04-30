class AwesomeOrder extends MongooseModel {

  static schema() {

    return {

      orderRemark: { type: String }

    }

  }

}

module.exports = AwesomeOrder
