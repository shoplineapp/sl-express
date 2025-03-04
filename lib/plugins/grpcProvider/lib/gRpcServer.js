const grpc = require('@grpc/grpc-js');
const inflection = require('inflection');
const getMethodNames = require('./getMethodNames');
const Definition = require('./Definition');
const GRpcRouter = require('./gRpcRouter');

let grpcHealthCheckPkg;

class GRpcServer {
  constructor(ip, port, extras) {
    const { packageName, autoloadPaths, setupHealthCheck = false } = extras;
    this.ip = ip;
    this.port = port;
    this.services = {};
    this.packageName = packageName;
    this.autoloadPaths = autoloadPaths;
    this.executeRequest = undefined;
    this.executeChainStep = undefined;
    this.router = new GRpcRouter();
    this.errorHandler = undefined; // Allow app to override error handler on it's need
    this.server = undefined;
    this.setupHealthCheck = setupHealthCheck;
    if (setupHealthCheck && !grpcHealthCheckPkg) {
      // avoid breaking change if not requiring health check
      const { HealthImplementation } = require('grpc-health-check');
      grpcHealthCheckPkg = { HealthImplementation };
    }
  }

  configureRouter() {
    this.router.executeChainStep = this.executeChainStep;
  }

  generateRequestHandler(resource, action) {
    return (req, res) => {
      // Convert GRPC upper camelcase action to lower camelcase action of controller
      const controllerAction = inflection.camelize(action, true);
      const requestOptions = [
        req,
        res,
        {
          resource,
          action: controllerAction,
          errorHandler: this.errorHandler,
        },
      ];
      const handler = this.router.request.bind(this.router);
      if (this.executeRequest) {
        return this.executeRequest(handler, requestOptions);
      }
      return handler(...requestOptions);
    };
  }

  configureHealthCheck() {
    if (!this.setupHealthCheck) return;
    if (!grpcHealthCheckPkg || !this.server) return;

    // Define service status map. Key is the service name, value is the corresponding status.
    // By convention, the empty string '' key represents that status of the entire server.
    const statusMap = {
      '': 'NOT_SERVING',
    };

    const healthImpl = new grpcHealthCheckPkg.HealthImplementation(statusMap);
    healthImpl.addToServer(this.server);

    return healthImpl;
  }

  run() {
    this.server = new grpc.Server();
    const healthImpl = this.configureHealthCheck();
    this.configureRouter();

    this.services = Definition.loadServices(this.packageName);

    Object.keys(this.services).forEach((resource) => {
      if (app.controllers[`${resource}Controller`]) {
        const handlers = getMethodNames(app.controllers[`${resource}Controller`]).reduce((mappings, key) => {
          mappings[key] = this.generateRequestHandler(resource, key);
          return mappings;
        }, {});

        this.server.addService(this.services[resource].service, handlers);
      }
    });

    // Start server
    this.server.bindAsync(`${this.ip}:${this.port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) {
        log('sl-express', 'error', { err });
        return;
      }
      log('sl-express', 'info', { message: `Starting grpc server on 0.0.0.0:${port}` });
      this.server.start();
      // Set to SERVING status
      if (healthImpl) {
        healthImpl.setStatus('', 'SERVING');
      }
    });
  }

  stop() {
    if (!this.server) return;

    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => {
        log('sl-express', 'error', {
          message: `Timeout error while trying to stop grpc server`,
        });

        reject(new Error('Timeout error while trying to stop grpc server'));
      }, process.env.SHUTDOWN_GRPC_SERVER_TIMEOUT || 1000 * 60);

      try {
        this.server.tryShutdown(() => {
          log('sl-express', 'info', {
            message: `Shutting down grpc server on 0.0.0.0:${this.port}`,
          });

          clearTimeout(timeoutID);
          resolve();
        });
      } catch (error) {
        log('sl-express', 'error', {
          message: error,
        });

        clearTimeout(timeoutID);
        reject(error);
      }
    });
  }
}

module.exports = GRpcServer;
