'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var validator = require('_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Show = model('shows', connectionString);

Show.schema = {
  'title': 'Show Schema',
  'type': 'object',
  'properties': {
  },
  'required': [
  ]
};

Show.validate = function(document) {
  return validator.validateResult(document, Show.schema, false, true);
};

module.exports = Show;
