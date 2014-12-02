'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require(__dirname + '/../_utilities/mongo');
var validator = require(__dirname + '/../_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Event = model('events', connectionString);

// console.log(Event);

var index = {
  'showid': 1,
  'starttime': 1
};

Event.ensureIndex(index);

var info = Event.indexInformation(index);

console.log('info', info);

Event.schema = {
  'title': 'Event Schema',
  'type': 'object',
  'properties': {
  },
  'required': [
  ]
};

Event.validate = function(document) {
  return validator.validateResult(document, Event.schema, false, true);
};

module.exports = Event;
