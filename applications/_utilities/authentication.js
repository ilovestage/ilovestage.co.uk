'use strict';

function* authentication(next) {
  console.log('called 2', next);
  if(this.request.header.uid) {
    console.log('case 1');
    if (this.locals.currentUser) {
      console.log('case 1a');
      this.locals.status = 404;
    } else {
      console.log('case 1b');
      this.locals.message = this.locals.messages.noUserForUid;
      this.locals.status = 401;
    }
  } else {
    console.log('case 2');
    if(!this.request.header.uid) {
      console.log('case 2a');
      this.locals.message = this.locals.messages.noUid;
    } else {
      console.log('case 2b');
      this.locals.message = this.locals.messages.invalidUid;
    }

    this.locals.status = 401;
  }

  this.locals.body.status = this.locals.status; // use HTTP status code
  this.locals.body.error = this.locals.message;
  this.locals.body.result = this.locals.result;

  console.log('here at end', next);

  yield next;
}

module.exports = authentication;
