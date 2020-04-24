'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const service = Symbol('authService');
const requestHandler = Symbol('requestHandler');

const username = Symbol('username');
const email = Symbol('email');
const requestHandlerBuilder = Symbol('requestHandlerBuilder');

const beforeUserinfo = Symbol('beforeUserinfo');
const beforeUserinfoBinded = Symbol('beforeUserinfoBinded');
const setSubHandler = Symbol('setSubHandler');
const deleteSubHandler = Symbol('deleteSubHandler');

const beforeTokenSigning = Symbol('beforeTokenSigning');
const beforeTokenSigningBinded = Symbol('beforeTokenSigningBinded');

const SUBJECT = '/sub';

class ManagementService {
  constructor(authService) {
    this[username] = undefined;
    this[service] = authService;
    this[requestHandler] = this[requestHandlerBuilder]();
    this[beforeUserinfoBinded] = this[beforeUserinfo].bind(this);
    this[beforeTokenSigningBinded] = this[beforeTokenSigning].bind(this);
  }

  get requestHandler() {
    return this[requestHandler];
  }

  [requestHandlerBuilder]() {
    const app = express();
    app.disable('x-powered-by');
    app.use(cors());
    app.use(bodyParser.json());

    app.post(SUBJECT, this[setSubHandler].bind(this));
    app.delete(SUBJECT, this[deleteSubHandler].bind(this));

    return app;
  }

  [setSubHandler](req, res) {
    this[username] = req.body.username;
    this[email] = req.body.email;

    this[service].on('beforeTokenSigning', this[beforeTokenSigningBinded]);
    this[service].on('beforeUserinfo', this[beforeUserinfoBinded]);

    res.json({
      status: 'ok',
      message: `Username ${req.body.username} is set`,
    });
  }

  [deleteSubHandler](req, res) {
    const user = this[username];

    this[username] = undefined;
    this[email] = undefined;
    this[service].removeListener('beforeTokenSigning', this[beforeTokenSigningBinded]);
    this[service].removeListener('beforeUserinfo', this[beforeUserinfoBinded]);

    res.json({
      status: 'ok',
      message: `Username ${user} is unset`,
    });
  }

  // eslint-disable-next-line no-unused-vars
  [beforeUserinfo](userInfoResponse, _) {
    // eslint-disable-next-line no-param-reassign
    userInfoResponse.body.sub = this[username];
  }

  [beforeTokenSigning](token) {
    // eslint-disable-next-line no-param-reassign
    token.payload.sub = this[username];
    if (typeof this[email] === 'string') {
      // eslint-disable-next-line no-param-reassign
      token.payload.email = this[email];
    }
  }
}

module.exports = ManagementService;
