'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Event = model('events', connectionString);

// console.log(Event);

var index = {
  'showid': 1,
  'starttime': 1
};

Event.ensureIndex(index);

// var info = Event.indexInformation(index);

// console.log('info', info);

Event.schema = {
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
  },
  'required': [
    'showid',
    'starttime',
    'endtime',
    'createtime',
    'updatetime'
  ]
};

Event.validate = function(document) {
  return schema.validateResult(document, Event.schema, false, true);
};

module.exports = Event;
