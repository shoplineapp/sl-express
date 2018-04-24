let _mongoose

class MongooseModel {

  static load(key) {

    let schema = new this.mongoose.Schema(this.schema(this.mongoose))

    schema.loadClass(this)

    let self = this

    schema.pre('init', function(next) { self.beforeInit(this, next) })
    schema.pre('validate', function(next) { self.beforeValidate(this, next) })
    schema.pre('save', function(next) { self.beforeSave(this, next) })
    schema.pre('remove', function(next) { self.beforeRemove(this, next) })

    schema.post('init', function(doc, next) { self.afterInit(doc, next) })
    schema.post('validate', function(doc, next) { self.afterValidate(doc, next) })
    schema.post('save', function(doc, next) { self.afterSave(doc, next) })
    schema.post('remove', function(doc, next) { self.afterRemove(doc, next) })

    return this.mongoose.model(key, schema)

  }

  static get mongoose() {

    if (!_mongoose) {

      _mongoose = require('mongoose')

    }

    return _mongoose

  }

  static schema() {

    return {}

  }

  /*
   * We try to map these function to the middlewares
   * http://mongoosejs.com/docs/middleware.html
   */

  static beforeInit(obj, next) { return next() }
  static beforeValidate(obj, next) { return next() }
  static beforeSave(obj, next) { return next() }
  static beforeRemove(obj, next) { return next() }

  static afterInit(obj, next) { return next() }
  static afterValidate(obj, next) { return next() }
  static afterSave(obj, next) { return next() }
  static afterRemove(obj, next) { return next() }

}

module.exports = MongooseModel
