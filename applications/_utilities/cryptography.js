'use strict';

var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var crypto = require('crypto');

var cryptography = {

  encryptId: function(id) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.id);
    hash.update(id.toString());
    return hash.digest('hex');
  },

  encryptPassword: function(password) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.password);
    hash.update(password.toString());
    return hash.digest('hex');
  },

  encryptPasswordResetToken: function(id) {
    var hash = crypto.createHmac('sha512', packageJson.config.salts.passwordreset);
    hash.update(id.toString());
    return hash.digest('hex');
  },

};

module.exports = cryptography;
