'use strict';

var model = require('mongel');

var validator = require('application/utilities/validator');

var Model = model();

var schema = {};

schema.update = {
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
    'description': {
      'type': 'string',
      'maxLength': 255
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

schema.create = JSON.parse(JSON.stringify(schema.update));

schema.create.required = [
  'userid',
  'bookingid',
  'processor',
  'amount',
  'currency',
  'createtime',
  'updatetime'
];

Model.describe = function() {
  return schema;
};

Model.validate = function(document, method) {
  var currentSchema;

  if (method === 'create') {
    currentSchema = Model.schema.create;
  } else if (method === 'update') {
    currentSchema = Model.schema.update;
  }

  return validator.check(document, currentSchema);
};

module.exports = Model;
