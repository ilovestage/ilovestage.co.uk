'use strict';

var cryptography = require('application/utilities/cryptography');
var debug = require('debug');

module.exports = function authorization(_id) {
  var authorizationStatus;

  var uid = (typeof _id === 'undefined') ? null : cryptography.encryptId(_id.toString()); // to be sent encrypted

  // var uid;
  // if (typeof _id === 'undefined') {
  //   uid = null;
  // } else {
  //   uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
  // }

  debug('authorization: _id', _id);
  debug('authorization: uid', uid);
  debug('authorization: this.locals.currentUser', this.locals.currentUser);
  debug('authorization: this.locals.bypassAuthentication', this.locals.bypassAuthentication);

  if (this.locals.bypassAuthentication === true) {
    debug('authorization: this.locals.bypassAuthentication === true');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!this.locals.currentUser || !this.locals.currentUser.uid) {
    debug('authorization: !this.locals.currentUser || !this.locals.currentUser.uid');
    this.locals.status = 401;
    authorizationStatus = false;
  } else if (this.locals.currentUser.role === 'admin') {
    debug('authorization: this.locals.currentUser.role === \'admin\'');
    this.locals.status = 404;
    authorizationStatus = true;
  } else if (!_id) {
    debug('authorization: !_id');
    this.locals.status = 500;
    authorizationStatus = false;
  } else if (uid === this.locals.currentUser.uid) {
    debug('authorization: uid === this.locals.currentUser.uid');
    this.locals.status = 404;
    authorizationStatus = true;
  } else {
    debug('authorization: else');
    this.locals.status = 403;
    authorizationStatus = false;
  }

  return authorizationStatus;
};
