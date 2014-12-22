'use strict';

var model = require('mongel');

var schema = require('_utilities/schema');

var Event = model();

var schema = {};

schema.update = {
  'title': 'Event Schema',
  'type': 'object',
  'properties': {
    'showid': {
      'format': 'object-id'
    },
    'starttime': {
      'type': 'object'
    },
    'endtime': {
      'type': 'object'
    },
    'priceband': {
      'type': 'string',
      'enum': [
        'Best Available'
      ]
    },
    'singlefacevalue': {
      'type': 'number',
      'minimum': 0,
      'maximum': 1000
    },
    'singlediscountprice': {
      'type': 'number',
      'minimum': 0,
      'maximum': 1000
    },
    'groupfacevalue': {
      'type': 'number',
      'minimum': 0,
      'maximum': 1000
    },
    'groupdiscountprice': {
      'type': 'number',
      'minimum': 0,
      'maximum': 1000
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
  'showid',
  'starttime',
  'endtime',
  'createtime',
  'updatetime'
];

Event.prototype.describe = function() {
  return schema;
};

Event.prototype.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Event.schema.create;
  } else if (method === 'update') {
    currentSchema = Event.schema.update;
  }

  return schema.check(document, currentSchema);
};

module.exports = Event;
