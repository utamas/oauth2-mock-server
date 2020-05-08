'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const service = Symbol('authService');
const requestHandler = Symbol('requestHandler');

const sub = Symbol('sub');

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
    this[sub] = undefined;
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
    this[sub] = req.body;

    this[service].on('beforeTokenSigning', this[beforeTokenSigningBinded]);
    this[service].on('beforeUserinfo', this[beforeUserinfoBinded]);

    res.json({
      status: 'ok',
      message: `Username ${req.body.name} is set`,
    });
  }

  [deleteSubHandler](req, res) {
    const subject = this[sub];

    this[sub] = undefined;
    this[service].removeListener('beforeTokenSigning', this[beforeTokenSigningBinded]);
    this[service].removeListener('beforeUserinfo', this[beforeUserinfoBinded]);

    res.json({
      status: 'ok',
      message: `Username ${subject.sub} is unset`,
    });
  }


  // eslint-disable-next-line no-unused-vars
  [beforeUserinfo](userInfoResponse, _) {
    // eslint-disable-next-line no-param-reassign
    userInfoResponse.body = this[sub];
  }

  [beforeTokenSigning](token) {
    Object.assign(token.payload, this[sub]);
  }
}

module.exports = ManagementService;
