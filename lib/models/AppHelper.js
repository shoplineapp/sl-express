const fs = require('fs');
const deepExtend = require('deep-extend');
const flat = require('flat')
const inflection = require('inflection')

class AppHelper {

  static loadRecursively(filePath, options={}) {
    const handler = options.handler || function(klass, key) {};
    const delimiter = options.moduleDelimiter || '_'

    let klasses = this.importDir(filePath, { recursive: true, required: options.required })

    klasses = flat(klasses, { delimiter })

    let result = {}

    Object.keys(klasses).forEach( (key) => {

      let klass = klasses[key]

      let tmpKey = key.split(delimiter).slice(-1)[0]

      let newKey = key.split(delimiter).map( str => inflection.camelize(str) ).join(delimiter)

      result[newKey] = handler(klass, tmpKey)

    })

    return result

  }

  static importPlugins(dirname, options = {}) {
    const result = {}

    let files

    try {
      files = fs.readdirSync(dirname);
    } catch (e) {
      if (e.message.indexOf('no such file or directory')) {
        if (options.required === true) { console.warn('Missing required directory ', dirname) }
      } else {
        console.error('Unable to import directory', dirname)
        console.error(e)
      }
    }

    if (!files) { return result; }

    files.forEach((file) => {
      var filepath = dirname + '/' + file;
      if (!fs.statSync(filepath).isDirectory()) return

      try {
        result[file] = require(`${filepath}/index.js`);
      } catch(e) {
        console.log(e)
        console.error('Unable to load file ', filepath);
      }
    })

    return result;
  }

  static importDir(dirname, params={}) {
    const options = {
      required: true,
      ...params
    }
    const result = {}
    let files;
    try {
      files = fs.readdirSync(dirname);
    } catch (e) {
      if (e.message.indexOf('no such file or directory')) {
        if (options.required === true) { console.warn('Missing required directory ', dirname) }
      } else {
        console.error('Unable to import directory', dirname)
        console.error(e)
      }
    }
    if (!files) { return result; }

    files.forEach((file) => {
      var filepath = dirname + '/' + file;
      if (fs.statSync(filepath).isDirectory()) {
        result[file] = this.importDir(filepath, options)
      } else {
        try {
          const match = file.match(/^([^\.].*)\.js(on)?$/);
          if (!match) { return; }

          const moduleName = match[1];
          result[moduleName] = require(filepath);
        } catch(e) {
          console.error('Unable to load file ', filepath);
        }
      }
    })

    return result;
  }

  static loadWithOverride(pathWithOpts = [], deepMerge = false) {
    const handler = deepMerge ? deepExtend : Object.assign

    const tmp = pathWithOpts.map( ({ path, opts }) => {
      return this.importDir(path, opts)
    })

    return handler({}, ...tmp)
  }
}

module.exports = AppHelper
