'use strict';

var model = require('mongel');

var validator = require('application/utilities/validator');

var Model = model();

var schema = {};

schema.update = {
  'title': 'Note Schema',
  'type': 'object',
  'properties': {
    'userid': {
      'format': 'object-id'
    },
    'description': {
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
  'description',
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
