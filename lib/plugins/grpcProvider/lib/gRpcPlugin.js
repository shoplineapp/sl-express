const Definition = require("./Definition");
const GRpcServer = require("./gRpcServer");

class gRpcPlugin {
  didLoadFramework(app) {
    if (app.config.grpcProvider) {
      const {
        autoloadPaths,
        port,
        packageName,
        setupHealthCheck,
        setupReflection,
      } = app.config.grpcProvider;
      Definition.preload(autoloadPaths);
      app.gRpcServer = new GRpcServer("0.0.0.0", port, {
        packageName,
        autoloadPaths,
        setupHealthCheck,
        setupReflection,
      });
    }
  }
}

module.exports = gRpcPlugin;
