'use strict';

var cryptography = require('application/utilities/cryptography');

module.exports = function authorization(_id) {
  var authorizationStatus;
  var uid;

  if (typeof _id === 'undefined') {
    uid = null;
  } else {
    uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
  }

  // console.log('_id', _id);
  // console.log('uid', uid);
  // console.log('this.locals.currentUser', this.locals.currentUser);

  if (this.locals.bypassAuthentication === true) {
    console.log('case 1');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!this.locals.currentUser || !this.locals.currentUser.uid) {
    console.log('case 2');
    this.locals.status = 401;
    authorizationStatus = false;
  } else if (this.locals.currentUser.role === 'admin') {
    console.log('case 3');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!_id) {
    console.log('case 4');
    this.locals.status = 500;
    authorizationStatus = false;
  } else if (uid === this.locals.currentUser.uid) {
    console.log('case 5');
    this.locals.status = 404;
    authorizationStatus = true;
  } else {
    console.log('case 6');
    this.locals.status = 403;
    authorizationStatus = false;
  }

  return authorizationStatus;
};
