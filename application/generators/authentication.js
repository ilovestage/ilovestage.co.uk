'use strict';

var debug = require('debug');

module.exports = function* authentication(next) {
  if (this.request.header.uid) {
    debug('authentication: uid set in header', this.request.header.uid);
    if (this.locals.currentUser) {
      debug('authentication: currentUser: ', this.locals.currentUser);
      this.locals.status = 404;
    } else {
      debug('authentication: currentUser not set');
      this.locals.message = this.locals.messages.noUserForUid;
      this.locals.status = 401;
    }
  } else {
    if (!this.request.header.uid) {
      debug('authentication: uid not set in header');
      this.locals.message = this.locals.messages.noUid;
    } else {
      debug('authentication: uid in header is invalid');
      this.locals.message = this.locals.messages.invalidUid;
    }

    this.locals.status = 401;
  }

  this.locals.body.status = this.locals.status; // use HTTP status code
  this.locals.body.error = this.locals.message;
  this.locals.body.result = this.locals.result;

  yield next;
};
