'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var validator = require('_utilities/validator');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Payment = model('payments', connectionString);

Payment.schema = {
  'title': 'Payment Schema',
  'type': 'object',
  'properties': {
    'userid': {
      'type': 'string',
      'format': 'object-id'
    },
    'bookingid': {
      'type': 'string',
      'format': 'object-id'
    },
    'processor': {
      'type': 'string',
      'enum': [
        'stripe',
        'applepay'
      ]
    },
    'amount': {
      'type': 'integer',
      'minimum': 1,
      'maximum': 5000
    },
    'currency': {
      'type': 'string',
      'format': 'currency-code'
    },
    'description': {
      'type': 'string',
      'maxLength': 100
    },
    'createtime': {
      'type': 'object'
    },
    'updatetime': {
      'type': 'object'
    }
  },
  'required': [
    'userid',
    'bookingid',
    'processor',
    'amount',
    'currency'
  ]
};

Payment.validate = function(document) {
  return validator.validateResult(document, Payment.schema, false, true);
};

module.exports = Payment;
