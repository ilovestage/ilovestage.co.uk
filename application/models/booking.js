'use strict';

var model = require('mongel');

var validator = require('application/utilities/validator');

var Model = model();

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

Model.describe = function() {
  return schema;
};

Model.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = schema.create;
  } else if (method === 'update') {
    currentSchema = schema.update;
  }

  return validator.check(document, currentSchema);
};

module.exports = Model;
