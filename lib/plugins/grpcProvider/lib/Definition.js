const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');

const packages = {};
let packageDefinitions;

class Definition {
  static lookupFiles(dirname) {
    let result = [];
    let files;
    try {
      files = fs.readdirSync(dirname);
    } catch (e) {}
    if (!files) {
      return result;
    }

    files.forEach((file) => {
      const filepath = `${dirname}/${file}`;
      if (fs.statSync(filepath).isDirectory()) {
        result = result.concat(this.lookupFiles(filepath));
      } else {
        const match = file.match(/^(.+)\.proto?$/);
        if (!match) {
          return;
        }
        result.push(filepath);
      }
    });

    return result;
  }

  static preload(autoloadPaths) {
    const paths = autoloadPaths.reduce((acc, dir) => {
      acc.push(...this.lookupFiles(dir));
      return acc;
    }, []);
    packageDefinitions = protoLoader.loadSync(paths, {
      keepCase: true, // Preserve field names. The default is to change them to camel case.
      longs: String, // The type to use to represent long values. Defaults to a Long object type.
      enums: String, // The type to use to represent enum values. Defaults to the numeric value.
      defaults: false, // Set default values on output objects. Defaults to false.
      arrays: false, // Set empty arrays for missing array values even if defaults is false Defaults to false.
      objects: false, // Set empty objects for missing object values even if defaults is false Defaults to false.
      oneofs: true, // Set virtual oneof properties to the present field's name. Defaults to false.
    });
    const descriptor = grpc.loadPackageDefinition(packageDefinitions);
    Object.keys(descriptor).forEach((pkg) => {
      if (packages[pkg] === undefined) {
        packages[pkg] = {};
      }
      Object.assign(packages[pkg], descriptor[pkg]);
    });
  }

  static loadServices(packageName) {
    const services = {};

    // Check if the package name is matching the server config
    if (packages[packageName]) {
      const grpcPackage = packages[packageName];
      Object.keys(grpcPackage).forEach((key) => {
        // Export service
        if (grpcPackage[key].service) {
          services[key] = grpcPackage[key];
        }
      });
    }

    return services;
  }

  static getDefinitions() {
    return packageDefinitions;
  }
}

module.exports = Definition;
