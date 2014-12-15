'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Payment = model('payments', connectionString);

Payment.schema = {};

Payment.schema.update = {
  'title': 'Payment Schema',
  'type': 'object',
  'properties': {
    'userid': {
      'format': 'object-id'
    },
    'bookingid': {
      'format': 'object-id'
    },
    'processor': {
      'type': 'string',
      'enum': [
        'Apple Pay',
        'Google Wallet',
        'PayPal',
        // 'Stripe',
        'STPCard'
      ]
    },
    'amount': {
      'type': 'integer',
      'minimum': 1,
      'maximum': 500000
    },
    'currency': {
      'type': 'string',
      'format': 'currency-code'
    },
    'token': {
      'type': 'string',
      'maxLength': 255
    },
    'receipt_email': {
      'type': 'string',
      'format': 'email'
    },
    'statement_description': {
      'type': 'string',
      'maxLength': 255
    },
    'createtime': {
      'format': 'date-time'
    },
    'updatetime': {
      'format': 'date-time'
    }
  }
};

Payment.schema.create = JSON.parse(JSON.stringify(Payment.schema.update));

Payment.schema.create.required = [
  'userid',
  'bookingid',
  'processor',
  'amount',
  'currency',
  'createtime',
  'updatetime'
];

Payment.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Payment.schema.create;
  } else if (method === 'update') {
    currentSchema = Payment.schema.update;
  }

  return schema.check(document, currentSchema);
};

module.exports = Payment;
