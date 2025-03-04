const inflection = require('inflection');
const grpc = require('@grpc/grpc-js');
const Definition = require('./Definition');
const gRpcClientError = require('./gRpcClientError');

class gRpcClient {
  constructor(packageName, autoLoadPaths) {
    this.serviceName = inflection.underscore(packageName);

    this.isUseSsl = !!(process.env[`GRPC_${this.serviceName}_SSL`.toUpperCase()] === 'true');
    this.endpoint = process.env[`GRPC_${this.serviceName}_ENDPOINT`.toUpperCase()];

    Definition.preload(autoLoadPaths);

    this.services = Definition.loadServices(packageName);
    this.serviceClients = {};
  }

  request(serviceName, methodName, payload) {
    const Service = this.services[serviceName];
    if (!serviceName || !Service || !methodName) {
      log('sl-express', 'info', {
        message: `Unable to resolve ${serviceName}#${methodName}`,
      });
      return Promise.reject(
        new gRpcClientError(`Unable to resolve ${serviceName}#${methodName}`, { code: 'ARGUMENT_MISSING' }),
      );
    }

    // Create only 1 client for all requests
    if (!this.serviceClients[serviceName]) {
      this.serviceClients[serviceName] = new Service(
        this.endpoint,
        this.isUseSsl ? grpc.credentials.createSsl() : grpc.credentials.createInsecure(),
      );
      log('sl-express', 'info', {
        message: `Created service client for ${serviceName}`,
      });
    }

    const client = this.serviceClients[serviceName];
    if (!client[methodName]) {
      log('sl-express', 'info', {
        message: `Unable to resolve ${serviceName}#${methodName}`,
      });
      return Promise.reject(
        new gRpcClientError(`Unable to resolve ${serviceName}#${methodName}`, { code: 'INVALID_METHOD' }),
      );
    }
    return new Promise((resolve, reject) => {
      client[methodName](payload, (err, res) => {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  }
}

module.exports = gRpcClient;
