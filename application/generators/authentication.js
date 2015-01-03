'use strict';

module.exports = function* authentication(next) {
  if (this.request.header.uid) {
    console.log('uid set in header', this.request.header.uid);
    if (this.locals.currentUser) {
      console.log('currentUser: ', this.locals.currentUser);
      this.locals.status = 404;
    } else {
      console.log('currentUser not set');
      this.locals.message = this.locals.messages.noUserForUid;
      this.locals.status = 401;
    }
  } else {
    if (!this.request.header.uid) {
      console.log('uid not set in header');
      this.locals.message = this.locals.messages.noUid;
    } else {
      console.log('uid in header is invalid');
      this.locals.message = this.locals.messages.invalidUid;
    }

    this.locals.status = 401;
  }

  this.locals.body.status = this.locals.status; // use HTTP status code
  this.locals.body.error = this.locals.message;
  this.locals.body.result = this.locals.result;

  yield next;
};
