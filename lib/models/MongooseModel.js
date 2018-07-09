
/*
 * @class MongooseModel
 *
 * @descrption This model wants to: 1. make class declaration using class instead of using prototype 2. handle the way of mixing the mongoose schema and the class by using mongoose.model 3. provide a more user friendly way to use the mongoose pre and post hook. Please subclass this class when you use it.
 */

let _mongoose

class MongooseModel {

  /*
   * @description part of the main logic of MongooseModel. Our App.js will call this load method if exist.
   * this load method will setup everything between the Class and the mongoose, like hookings, export schema
   *
   * @method load
   *
   * @param {String} key the key that the App is going to assign this class to.
   *
   * @return {Object}
   */

  //TODO: bind more hook even to the MongooseModel
  static load(key) {

    const timestamps = { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    let schema = new this.mongoose.Schema(this.schema(this.mongoose), timestamps)

    schema.loadClass(this)

    let self = this

//    schema.pre('init', function(next) { self.beforeInit(this, next) })
    schema.pre('validate', function(next) { self.beforeValidate(this, next) })
    schema.pre('save', function(next) { self.beforeSave(this, next) })
    schema.pre('remove', function(next) { self.beforeRemove(this, next) })

//    schema.post('init', function(doc, next) { self.afterInit(doc, next) })
    schema.post('validate', function(doc, next) { self.afterValidate(doc, next) })
    schema.post('save', function(doc, next) { self.afterSave(doc, next) })
    schema.post('remove', function(doc, next) { self.afterRemove(doc, next) })

    return this.mongoose.model(key, schema)

  }

  /*
   * @description the getter method of the mongoose lib. This is the lazy loading pattern. It ensures the lib would not be required if the service is not used.
   *
   * @method mongoose
   *
   * @return {Object} the mongoose lib
   */

  static get mongoose() {

    if (!_mongoose) {

      _mongoose = require('mongoose')

    }

    return _mongoose

  }

  /*
   * @description the schema of the model. the object return will be directly port to the mongoose. remember you can easily access the mongoose with this.mongoose
   *
   * @method schema
   *
   * @return {Object} the schema object for mongoose
   */

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
