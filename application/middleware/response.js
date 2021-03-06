'use strict';

var js2xmlparser = require('js2xmlparser');

module.exports = function() {

  return function* Response(next) {

    this.locals = this.locals || {};

    this.locals.body = this.locals.body || {};
    this.locals.status = this.locals.status || 500;

    switch (this.locals.status) {
      case 100:
        this.locals.message = this.locals.messages.continue;
        break;
      case 200:
        this.locals.message = this.locals.messages.ok;
        break;
      case 201:
        this.locals.message = this.locals.messages.created;
        break;
      case 202:
        this.locals.message = this.locals.messages.accepted;
        break;
      case 400:
        this.locals.message = this.locals.messages.badRequest;
        break;
      case 401:
        this.locals.message = this.locals.messages.unauthorised;
        break;
      case 403:
        this.locals.message = this.locals.messages.forbidden;
        break;
      case 404:
        this.locals.message = this.locals.messages.resourceNotFound;
        break;
      case 413:
        this.locals.message = this.locals.messages.requestEntityTooLarge;
        break;
      case 415:
        this.locals.message = this.locals.messages.specifyContentType;
        break;
      case 422:
        this.locals.message = this.locals.messages.unprocessableEntity;
        break;
      case 500:
        this.locals.message = this.locals.messages.internalServerError;
        break;
      case 501:
        this.locals.message = this.locals.messages.notImplemented;
        break;
      case null:
        this.locals.status = 500;
        this.locals.message = this.locals.messages.unknownError;
        break;
    }

    this.locals.body.originalUrl = this.request.originalUrl;
    this.locals.body.status = this.locals.status; // use HTTP status code
    this.locals.body.message = this.locals.message;
    this.locals.body.error = this.locals.error;
    this.locals.body.querystringParameters = this.locals.querystringParameters;
    this.locals.body.queryOperators = this.locals.queryOperators;
    this.locals.body.result = this.locals.result;

    if ((this.request.header['content-type'] === 'application/vnd.api+xml') || (this.query.format === 'xml')) {
      this.body = js2xmlparser('response', this.locals.body);
      this.type = 'application/vnd.api+xml';
    } else {
      this.body = this.locals.body;
      this.type = 'application/vnd.api+json';
    }

    this.status = this.locals.status;

    yield next;
  };

};
