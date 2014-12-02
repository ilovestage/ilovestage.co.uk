'use strict';

var cryptography = require('_utilities/cryptography');

function authorizationCheck(_id) {
  var authorizationStatus;
  var uid;

  this.locals.status = 200;

  console.log('_id', _id);

  if(typeof _id === 'undefined') {
    uid = null;
  } else {
    uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
  }

  console.log('uid', uid);
  // console.log('this.locals.currentUser.uid', this.locals.currentUser.uid);
  // console.log('this.locals.currentUser', this.locals.currentUser);

  if(this.locals.bypassAuthentication === true) {
    // console.log('case 1');
    authorizationStatus = true;
  } else if(!_id || !this.locals.currentUser) {
    // console.log('case 2');
    authorizationStatus = false;
  } else if(uid === this.locals.currentUser.uid) {
    // console.log('case 3');
    authorizationStatus = true;
  } else if(this.locals.currentUser.role === 'admin') {
    // console.log('case 4');
    authorizationStatus = true;
  } else {
    // console.log('case 5');
    this.locals.status = 403;
    authorizationStatus = false;
  }

  // return yield Promise.resolve(authorizationStatus);
  // return Promise.resolve(authorizationStatus);
  return authorizationStatus;
}

module.exports = authorizationCheck;
