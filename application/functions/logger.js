'use strict';

var logger = require('koa-logger');

module.exports = function Logger(configuration, app) {
  app.use(logger()); // very verbose
  app.use(function* (next) {
    var start = new Date();
    var ms = new Date() - start;
    console.log('%s %s - %s', this.method, this.url, ms);
    console.log(this, this.request, this.response);
    console.log(this.request.header);
    yield next;
  });
};
