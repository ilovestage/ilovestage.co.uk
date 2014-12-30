'use strict';

var js2xmlparser = require('js2xmlparser');

module.exports = function() {

  return function* Authentication(next) {

    try {
      yield next;
    } catch (error) {
      if (401 === error.status) {
        this.locals.error = this.locals.messages.unauthorised;
        this.locals.status = error.status; // use HTTP status code

        this.locals.body.originalUrl = this.request.originalUrl;
        this.locals.body.status = this.locals.status; // use HTTP status code
        this.locals.body.message = this.locals.message;
        this.locals.body.error = this.locals.error;
        this.locals.body.result = this.locals.result;

        if ((this.request.header['content-type'] === 'application/vnd.api+xml') || (this.query.format === 'xml')) {
          this.body = js2xmlparser('response', this.locals.body);
          this.type = 'application/vnd.api+xml';
        } else {
          this.body = this.locals.body;
          this.type = 'application/vnd.api+json';
        }

        this.status = this.locals.status;

        this.set('WWW-Authenticate', 'Basic');
      } else {
        throw error;
      }

    }

    yield next;
  };

};
