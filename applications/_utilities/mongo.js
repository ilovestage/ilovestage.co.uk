'use strict';

var bson = require('bson');
// var MongoClient = require('mongodb').MongoClient;
var monk = require('monk');
// var thunkify = require('thunkify');
// var wrap = require('mongodb-next').collection;
// var wrap = require('co-monk');

var mongo = {
  connect: function(configuration) {
    // var connect = thunkify(MongoClient.connect);
    // return connect(mongo.connectionString(configuration));
    return monk(mongo.connectionString(configuration));
  },

  // connection: function(configuration) {
  //   if (typeof configuration === 'undefined') {
  //     return false;
  //   }
  //
  //   // private property
  //   var connection;
  //
  //   // private constructor
  //   var __construct = (function(configuration) {
  //     var connectionString;
  //
  //     if (typeof configuration === 'string') {
  //       connectionString = configuration;
  //     } else {
  //       connectionString = mongo.connectionString(configuration);
  //     }
  //
  //     connection = monk(connectionString);
  //
  //     return connection;
  //   })(configuration);
  //
  //   mongo.connection.collection = function(collection, thunk) {
  //     if (thunk === true) {
  //       console.log('thunk', true);
  //       return wrap(connection.get(collection));
  //     } else {
  //       console.log('thunk', false);
  //       return connection.get(collection);
  //     }
  //   };
  //
  // },

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
  },

  wrap: function(collection) {
    console.log('wrap', wrap);
    return wrap(connection.collection(collection));
  }
};

// var db = mongo.connect();
// db();

module.exports = mongo;
