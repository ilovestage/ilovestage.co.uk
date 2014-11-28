'use strict';


var cryptography = require(__dirname + '/../_utilities/cryptography');

module.exports = function() {

  return function* authorizationCheck(_id) {
    var authorizationStatus;
    var uid;

    this.locals.status = 200;

    // if(!_id || !this.locals.currentUser) {
    //   authorizationStatus = false;
    // }

    if(typeof _id === 'undefined') {
      uid = null;
    } else {
      uid = cryptography.encryptId(_id.toString()); // to be sent encrypted
    }

    // console.log('_id', _id);
    // console.log('uid', uid);
    // console.log('this.locals.currentUser.uid', this.locals.currentUser.uid);
    // console.log('this.locals.currentUser', this.locals.currentUser);

    if(this.locals.bypassAuthentication === true) {
      // console.log('case 1');
      authorizationStatus = true;
    } else if(uid === this.locals.currentUser.uid) {
      // console.log('case 2');
      authorizationStatus = true;
    } else if(this.locals.currentUser.role === 'admin') {
      // console.log('case 3');
      authorizationStatus = true;
    } else {
      // console.log('case 4');
      this.locals.status = 403;
      authorizationStatus = false;
    }

    yield next;

    return function (cb) {
      console.log('authorizationStatus', authorizationStatus);
      cb(false, authorizationStatus);
    };

  };

};
