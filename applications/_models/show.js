'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require(__dirname + '/../_utilities/mongo');
var validator = require(__dirname + '/../_utilities/validator');

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
  var valid = validator.validate(document, Show.schema, false, true);

  if(valid === true) {
    return valid;
  } else {
    return validator;
  }

};

module.exports = Show;
