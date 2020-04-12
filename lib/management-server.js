'use strict';

const HttpServer = require('./http-server');
const ManagementService = require('./management-service');

class ManagementServer extends HttpServer {
  constructor(authService) {
    super(new ManagementService(authService).requestHandler);
  }
}

module.exports = ManagementServer;
