'use strict';

module.exports = function() {

  return function* authenticationCheck(next) {
    if(this.request.header.uid) {
      if (this.locals.currentUser) {
        this.locals.status = 200;
        // yield next;
      } else {
        this.locals.message = this.locals.messages.noUserForUid;
        this.locals.status = 401;
      }
    } else {
      if(!this.request.header.uid) {
        this.locals.message = this.locals.messages.noUid;
      } else {
        this.locals.message = this.locals.messages.invalidUid;
      }

      this.locals.status = 401;
    }

    this.locals.body.status = this.locals.status; // use HTTP status code
    this.locals.body.error = this.locals.message;
    this.locals.body.result = this.locals.result;

    yield next;
  };

};
