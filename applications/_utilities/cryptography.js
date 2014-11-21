'use strict';

var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var crypto = require('crypto');

var cryptography = {

  encryptUid: function(uid) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.uid);
    hash.update(uid.toString());
    return hash.digest('hex');
  },

  encryptPassword: function(password) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.password);
    hash.update(password.toString());
    return hash.digest('hex');
  }

};

module.exports = cryptography;
