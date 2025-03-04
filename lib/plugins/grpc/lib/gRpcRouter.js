const {
  status: { OK, INTERNAL },
} = require('@grpc/grpc-js');
const { v4: uuidv4 } = require('uuid');
const { Router } = require('@shopline/sl-express');

const Retryable = require('./utils/Retryable');

const readableGrpcCode = [
  'OK',
  'CANCELLED',
  'UNKNOWN',
  'INVALID_ARGUMENT',
  'DEADLINE_EXCEEDED',
  'NOT_FOUND',
  'ALREADY_EXISTS',
  'PERMISSION_DENIED',
  'RESOURCE_EXHAUSTED',
  'FAILED_PRECONDITION',
  'ABORTED',
  'OUT_OF_RANGE',
  'UNIMPLEMENTED',
  'INTERNAL',
  'UNAVAILABLE',
  'DATA_LOSS',
  'UNAUTHENTICATED',
];

// Extending sl-express router to include an extra middleware
// proxing grpc request to actions
class GRpcRouter extends Router {
  configure({ controllers, middlewares, routes }) {
    this.routes = routes;
    this.middlewares = middlewares;
    this.controllers = controllers;
    this.executeChainStep = undefined;
  }

  async request(req, res, { mockController, resource, action, errorHandler }) {
    req.extras = {
      ...req.extras,
      resource,
      action,
      start: new Date(),
      response: {},
    };
    if (req.extras.requestId === undefined) {
      req.extras.requestId = uuidv4();
    }

    const chain = await this.loadRequestChain(req);

    // Allow controller as param for unit test
    let controller;
    if (mockController) {
      controller = mockController;
    } else {
      controller = this.controllers[`${resource}Controller`]?.[action];
    }

    if (controller) {
      // Load route-based middleware
      this.routes.routes
        .reduce((acc, route) => {
          if (route.search(new RegExp(`${resource}Controller.${action}$`)) >= 0) {
            return acc.concat(route.split(' ').slice(' ').slice(0, -1));
          }
          return acc;
        }, [])
        .forEach((name) => {
          if (this.middlewares[name]) {
            chain.push({ name, handler: this.middlewares[name] });
          } else {
            log('sl-express', 'warn', { message: `middleware ${name} is missing` });
          }
        });

      // Add controller action handler
      chain.push({
        name: 'controller',
        handler: async (q, s) => {
          try {
            await this.controllers[`${resource}Controller`][action](q, s);
            q.extras.response.code = OK;
          } catch (err) {
            if (errorHandler) {
              errorHandler(err, req, res);
            } else {
              const payload = { code: INTERNAL, message: `Failed to process with ${resource}#${action}` };
              s(payload);
              log('request', 'error', { message: payload.message, error: err });
              q.extras.response = payload;
            }
          }
        },
      });
    } else {
      chain.push({
        name: 'controller',
        handler: () => {
          log('sl-express', 'error', { message: `Handler of ${resource}#${action} is missing` });
        },
      });
    }

    await this.routeRoute(req, res, chain);
    return true;
  }

  async loadRequestChain(req) {
    const { resource, action } = req.extras;
    const chain = [];

    // Add extra pre middleware to log incoming request
    chain.push({
      name: 'reqLog',
      handler: async (q) => {
        q.resource = resource;
        q.action = action;

        log('request', 'info', {
          ...q.extras,
          level: 'info',
          message: `Processing by ${resource}Controller#${action}`,
          parameters: q.request,
        });
      },
    });

    // Load custom pre middleware
    this.routes.preMiddlewares.forEach((value) => {
      const middlewares = value.split(' ');
      middlewares.forEach((name) => {
        if (this.middlewares[name]) {
          chain.push({ name, handler: this.middlewares[name] });
        } else {
          log('sl-express', 'warn', { message: `middleware ${name} is missing` });
        }
      });
    });

    return chain;
  }

  async loadRequestPostChain() {
    const chain = [];

    // Load custom post middleware
    this.routes.postMiddlewares.forEach((value) => {
      const middlewares = value.split(' ');
      middlewares.forEach((name) => {
        if (this.middlewares[name]) {
          chain.push({ name, handler: this.middlewares[name] });
        } else {
          log('sl-express', 'warn', { message: `Middleware ${name} is missing` });
        }
      });
    });

    // Add extra post middleware to log request time
    chain.push({
      name: 'resLog',
      handler: (q) => {
        const {
          extras: {
            requestId,
            start,
            response: { code },
          },
        } = q;
        const codeStr = readableGrpcCode[code] || 'UNKNOWN';
        const runtime = `${new Date() - start}ms`;
        log('request', 'info', { requestId, message: `Completed ${codeStr} in ${runtime}`, runtime, codeStr });
      },
    });

    return chain;
  }

  async processChain(chain, { handlerArgs, onFailure, onChainInterrupted, onComplete }) {
    let current;
    let processNext = true;

    // while loop with async/await
    await Retryable.with({ maxRetryCount: -1 })
      .while(() => processNext && chain.length > 0)
      .exec(async () => {
        const { name, handler } = chain.shift();
        current = handler.bind(this);
        processNext = false;
        try {
          if (current.constructor.name === 'AsyncFunction') {
            if (this.executeChainStep) {
              await this.executeChainStep(name, current, null, handlerArgs);
            } else {
              await current.apply(this, handlerArgs);
            }
            processNext = true; // Auto-next if no error is throw for async function
          } else {
            const callback = () => {
              processNext = true; // Manual callback like express
            };
            if (this.executeChainStep) {
              await this.executeChainStep(name, current, callback, handlerArgs);
            } else {
              current.apply(this, [...handlerArgs, callback]);
            }
          }
        } catch (err) {
          onFailure(name, err);
          processNext = false;
        }
        if (processNext === false && onChainInterrupted) {
          // The chain stopped working with error or skipping next intensionally
          onChainInterrupted.apply(this, [...handlerArgs]);
        }
      });

    if (onComplete) {
      await onComplete.apply(this, [...handlerArgs]);
    }
    return true;
  }

  async routeRoute(req, res, chain) {
    // preMiddlewares and controller chain
    await this.processChain(chain, {
      handlerArgs: [req, res],
      onFailure: (name, err) => {
        // Unexpected error from chain handler
        log('request', 'error', {
          ...req.extras,
          message: `Failed to handle ${name}`,
          error: `${err.name}: ${err.message}`,
        });
      },
      onChainInterrupted: (q, s) => {
        // Chain interrupted without proper response, give something else
        if (q.response && !q.response.code) {
          const payload = {
            code: INTERNAL,
            message: 'Internal error',
          };
          s(payload);
          q.extras.response = payload;
        }
      },
    });

    // postMiddlewares
    await this.processChain(await this.loadRequestPostChain(req), {
      handlerArgs: [req, res],
      onFailure: (name, err) => {
        log('request', 'error', {
          ...req.extras,
          message: `Failed to handle ${name}`,
          error: `${err.name}: ${err.message}`,
        });
      },
    });

    return true;
  }
}

module.exports = GRpcRouter;
