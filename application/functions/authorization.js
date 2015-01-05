'use strict';

var cryptography = require('application/utilities/cryptography');

module.exports = function authorization(_id) {
  var authorizationStatus;

  var uid = (typeof _id === 'undefined') ? null : cryptography.encryptId(_id.toString()); // to be sent encrypted

  // var uid;
  // if (typeof _id === 'undefined') {
  //   uid = null;
  // } else {
  //   uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
  // }

  console.log('authorization: _id', _id);
  console.log('authorization: uid', uid);
  console.log('authorization: this.locals.currentUser', this.locals.currentUser);
  console.log('authorization: this.locals.bypassAuthentication', this.locals.bypassAuthentication);

  if (this.locals.bypassAuthentication === true) {
    console.log('authorization: this.locals.bypassAuthentication === true');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!this.locals.currentUser || !this.locals.currentUser.uid) {
    console.log('authorization: !this.locals.currentUser || !this.locals.currentUser.uid');
    this.locals.status = 401;
    authorizationStatus = false;
  } else if (this.locals.currentUser.role === 'admin') {
    console.log('authorization: this.locals.currentUser.role === \'admin\'');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!_id) {
    console.log('authorization: !_id');
    this.locals.status = 500;
    authorizationStatus = false;
  } else if (uid === this.locals.currentUser.uid) {
    console.log('authorization: uid === this.locals.currentUser.uid');
    this.locals.status = 404;
    authorizationStatus = true;
  } else {
    console.log('authorization: else');
    this.locals.status = 403;
    authorizationStatus = false;
  }

  return authorizationStatus;
};
