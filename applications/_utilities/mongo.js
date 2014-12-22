'use strict';

// var packageJson = require('package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var bson = require('bson');

// var assert = require('assert');
var DB = require('mongodb-next');
// var MongoDB = require('mongodb');
// var Promise = require('native-or-bluebird');

var mongo = {
  // collection: function(collectionName) {
  //   return db.then(function() {
  //     var collection = db.collection(collectionName);
  //     // console.log('collection', collection);
  //     // var results = collection.find({}).then(function(docs) {
  //     //   console.log('results', docs);
  //     // });
  //     return collection;
  //   });
  // },

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

  // wrap: function(collectionName) {
  //   db.then(function() {
  //     console.log('wrap before', wrap);
  //     var wrap = wrap(mongo.collection(collectionName));
  //     console.log('wrap after', wrap);
  //     return wrap;
  //   });
  // }
};

// var db = new DB(mongo.connectionString(packageJson.config.environment[environment].server.database));

module.exports = mongo;
