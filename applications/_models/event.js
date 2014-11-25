'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require(__dirname + '/../_utilities/mongo');
var validator = require(__dirname + '/../_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Event = model('events', connectionString);

Event.schema = {
  'title': 'Event Schema',
  'type': 'object',
  'properties': {
  },
  'required': [
  ]
};

Event.validate = function(document) {
  var valid = validator.validate(document, Event.schema, false, true);

  if(valid === true) {
    return valid;
  } else {
    return validator;
  }

};

module.exports = Event;
