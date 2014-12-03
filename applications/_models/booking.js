'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var validator = require('_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Booking = model('bookings', connectionString);

Booking.schema = {
  'title': 'Booking Schema',
  'type': 'object',
  'properties': {
  },
  'required': [
  ]
};

Booking.validate = function(document) {
  return validator.validateResult(document, Booking.schema, false, true);
};

module.exports = Booking;
