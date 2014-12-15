'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Event = model('events', connectionString);

// var index = {
//   'showid': 1,
//   'starttime': 1
// };

// Event.ensureIndex(index);
// var info = Event.indexInformation(index);

Event.schema = {};

Event.schema.update = {
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

Event.schema.create = JSON.parse(JSON.stringify(Event.schema.update));

Event.schema.create.required = [
  'showid',
  'starttime',
  'endtime',
  'createtime',
  'updatetime'
];

Event.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Event.schema.create;
  } else if (method === 'update') {
    currentSchema = Event.schema.update;
  }

  return schema.check(document, currentSchema);
};

module.exports = Event;
