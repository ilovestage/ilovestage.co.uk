'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Booking = model('bookings', connectionString);

Booking.schema = {
  'title': 'Booking Schema',
  'type': 'object',
  'properties': {
    'userid': {
      'format': 'object-id'
    },
    'eventid': {
      'format': 'object-id'
    },
    'tickets': {
      'type': 'integer',
      'minimum': 1,
      'maximum': 100
    },
    'status': {
      'type': 'string',
      'enum': [
        'failure',
        'pending',
        'success'
      ]
    },
    'rate': {
      'type': 'string',
      'enum': [
        'group',
        'single'
      ]
    },
    'createtime': {
      'format': 'date-time'
    },
    'updatetime': {
      'format': 'date-time'
    }
  },
  'required': [
    'userid',
    'eventid',
    'tickets',
    'status',
    'rate',
    'createtime',
    'updatetime'
  ]
};

Booking.validate = function(document) {
  return schema.validateResult(document, Booking.schema, false, true);
};

module.exports = Booking;
