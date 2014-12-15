'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Booking = model('bookings', connectionString);

Booking.schema = {};

Booking.schema.update = {
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
  }
};

Booking.schema.create = JSON.parse(JSON.stringify(Booking.schema.update));

Booking.schema.create.required = [
  'userid',
  'eventid',
  'tickets',
  'status',
  'rate',
  'createtime',
  'updatetime'
];

Booking.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Booking.schema.create;
  } else if (method === 'update') {
    currentSchema = Booking.schema.update;
  }

  return schema.check(document, currentSchema);
};

module.exports = Booking;
