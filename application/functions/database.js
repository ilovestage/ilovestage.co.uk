'use strict';

var DB = require('mongodb-next');

var mongo = require('application/utilities/mongo');

module.exports = function Database(configuration) {
  var connectionString = mongo.connectionString(configuration);
  var db = DB(connectionString);

  db.connect.then(function() {
    console.log('Connected to database: ' + connectionString);
    // db.collection('users').find({}).then(function(docs) {
    //   console.log('docs', docs);
    // });
  });

  return db;
};
