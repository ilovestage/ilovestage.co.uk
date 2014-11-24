'use strict';

// var packageJson = require(__dirname + '/../../package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var bson = require('bson');

var mongo = {

  connectionString: function(configuration) {

  	if(typeof configuration === 'undefined') {
  		return false;
  	}

    var connectionString = '';

    connectionString += configuration.protocol;
    connectionString += '://';

    if((configuration.credentials.username !== null) && (configuration.credentials.password)) {
      connectionString += configuration.credentials.username;
      connectionString += ':';
      connectionString += configuration.credentials.password;
      connectionString += '@';
    }

    connectionString += configuration.host;
    connectionString += ':';
    connectionString += configuration.port;
    connectionString += '/';
    connectionString += configuration.name;

    return connectionString;
  },

  toObjectId: function (hex) {
    if (hex instanceof bson.BSONPure.ObjectID) {
      return hex;
    }

    if (!hex || hex.length !== 24) {
      return hex;
    }

    return bson.BSONPure.ObjectID.createFromHexString(hex);
  },

  validateObjectId: function(id) {
    var bool = false;

    // if(id.length === 24) {
    //   bool = /[a-f]+/.test(id);
    // }
    // console.log('obj:', bson.BSONPure.ObjectID);

    try {
      bool = bson.BSONPure.ObjectID(id);
    } catch(error) {
      console.log('error', error);
    }

    return bool;
  }

};

module.exports = mongo;
