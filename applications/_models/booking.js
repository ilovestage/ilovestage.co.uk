'use strict';

var model = require('mongel');

var schema = require('_utilities/schema');

var Booking = model();

var schema = {};

schema.update = {
  'title': 'Booking Schema',
  'type': 'object',
  'properties': {
    'userid': {
      'format': 'object-id'
    },
    'eventid': {
      'format': 'object-id'
    },
    'showid': {
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

schema.create = JSON.parse(JSON.stringify(schema.update));

schema.create.required = [
  'userid',
  'eventid',
  'showid',
  'tickets',
  'status',
  'rate',
  'createtime',
  'updatetime'
];

Booking.prototype.describe = function() {
  return schema;
};

Booking.prototype.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Booking.schema.create;
  } else if (method === 'update') {
    currentSchema = Booking.schema.update;
  }

  return schema.check(document, currentSchema);
};

module.exports = Booking;
