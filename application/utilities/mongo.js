'use strict';

var bson = require('bson');

var DB = require('mongodb-next');

var mongo = {
  connect: function(configuration) {
    var db = new DB(mongo.connectionString(configuration));

    return db;
  },

  connectionString: function(configuration) {
    if (typeof configuration === 'undefined') {
      return false;
    }

    var connectionString = '';

    connectionString += configuration.protocol;
    connectionString += '://';

    if ((configuration.credentials.username !== null) && (configuration.credentials.password)) {
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

  toObjectId: function(hex) {
    if (!hex || hex.length !== 24) {
      return false;
    }

    if (hex instanceof bson.BSONPure.ObjectID) {
      return hex;
    }

    return bson.BSONPure.ObjectID.createFromHexString(hex);
  },

  validateObjectId: function(id) {
    var bool = false;

    try {
      bool = bson.BSONPure.ObjectID(id);
    } catch (error) {
      console.log('error', error);
    }

    return bool;
  }

};

module.exports = mongo;
