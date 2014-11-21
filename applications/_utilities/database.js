'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
// var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var wrap = require('co-monk');
var monk = require('monk');

var mongo = require(__dirname + '/mongo');

var database = function(configuration) {

  	if(typeof configuration === 'undefined') {
  		return false;
  	}

  // private property
  var connection;

  // private constructor
  var __construct = (function(configuration) {
    // console.log('Object Created.');
    var connectionString = mongo.connectionString(configuration);

    // e.g. mongodb://nodejitsu:31446693dac807d62cbe52f522408bf6@troup.mongohq.com:10026/nodejitsudb1124257398

    connection = monk(connectionString);
    // console.log('connection', connection);
  })();

  this.collection = function(collection) {
    return wrap(connection.get(collection));
  };

  this.collectionSync = function(collection) {
    return connection.get(collection);
  };

};

module.exports = database;
