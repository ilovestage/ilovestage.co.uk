'use strict';

var cryptography = require('_utilities/cryptography');

function authorizationCheck(_id) {
  var authorizationStatus;
  var uid;

  console.log('_id', _id);

  if(typeof _id === 'undefined') {
    uid = null;
  } else {
    uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
  }

  console.log('uid', uid);
  // console.log('this.locals.currentUser.uid', this.locals.currentUser.uid);
  console.log('this.locals.currentUser', this.locals.currentUser);

  if(!_id) {
    console.log('case 1');
    this.locals.status = 500;
    authorizationStatus = false;
  } else if(!this.locals.currentUser) {
    console.log('case 2');
    this.locals.status = 401;
    authorizationStatus = false;
  } else if(this.locals.bypassAuthentication === true) {
    console.log('case 3');
    this.locals.status = 200;
    authorizationStatus = true;
  } else if(this.locals.currentUser.role === 'admin') {
    console.log('case 4');
    this.locals.status = 200;
    authorizationStatus = true;
  } else if(uid === this.locals.currentUser.uid) {
    console.log('case 5');
    this.locals.status = 200;
    authorizationStatus = true;
  } else {
    console.log('case 6');
    this.locals.status = 403;
    authorizationStatus = false;
  }

  // return yield Promise.resolve(authorizationStatus);
  // return Promise.resolve(authorizationStatus);
  return authorizationStatus;
}

module.exports = authorizationCheck;
