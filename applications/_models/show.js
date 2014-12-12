'use strict';

var packageJson = require('package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var model = require('mongel');

var mongo = require('_utilities/mongo');
var schema = require('_utilities/schema');

var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var Show = model('shows', connectionString);

Show.schema = {
  'title': 'Show Schema',
  'type': 'object',
  'properties': {
    'reference': {
      'type': 'integer',
      'minLength': 1,
      'maxLength': 9999
    },
    'translations': {
      'type': 'array',
      'items': {
        '$ref': '#/definitions/translation'
      },
      'additionalItems': false,
      'minItems': 1,
      'uniqueItems': true
    },
    'theatre': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'address': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'latitude': {
      'type': 'number',
      'minLength': 0,
      'maxLength': 20
    },
    'longitude': {
      'type': 'number',
      'minLength': 0,
      'maxLength': 20
    },
    'images': {
      'type': 'array',
      'items': {
        '$ref': '#/definitions/media'
      }
    },
    'videos': {
      'type': 'array',
      'items': {
        '$ref': '#/definitions/video'
      }
    },
    'metadata': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'groupdiscountprice': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'groupfacevalue': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'singlediscountprice': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'singlefacevalue': {
      'type': 'string',
      'minLength': 0,
      'maxLength': 255
    },
    'priceband': [
      'Best Available'
    ],
    'countrycodealpha2': {
      'type': 'string',
      'format': 'country-code-alpha2'
    },
    'countrycodealpha3': {
      'type': 'string',
      'format': 'country-code-alpha3'
    },
    'createtime': {
      'format': 'date-time'
    },
    'updatetime': {
      'format': 'date-time'
    }
  },
  'definitions': {
    'tag': {
      'type': 'string',
      'minLength': 2,
      'maxLength': 255
    },
    'media': {
      'type': 'object',
      'properties': {
        'file': {
          'type': 'object',
          'properties': {
            'basename': {
              'description': 'File name without extension e.g. the basename of "/path/to/myfile.ext" would be "myfile"',
              'type': 'string',
              'minLength': 2,
              'maxLength': 255
            },
            'extension': {
              'description': 'File extension e.g. "jpeg", "png", etc',
              'type': 'string',
              'minLength': 2,
              'maxLength': 255
            },
            'type': {
              'description': 'File MIME/content type e.g. "image/jpeg", "image/png", etc',
              'type': 'string',
              'minLength': 2,
              'maxLength': 255
            },
            'path': {
              'description': 'Path to file including trailing slash e.g. "/path/to/file/"',
              'type': 'string',
              'minLength': 2,
              'maxLength': 255
            }
          },
          'required': [
            'basename',
            'extension',
            'type',
            'path'
          ]
        },
        'title': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'caption': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'description': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'type': {
          'enum': [
            'featured',
            'standard'
          ]
        },
        'tags': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/tag'
          },
          'uniqueItems': true
        }
      },
      'required': [
        'file',
        'title'
      ]
    },
    'video': {
      'type': 'object',
      'properties': {
        'poster': {
          'format': 'object-id'
        },
        'sources': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/media'
          },
          'uniqueItems': true
        },
        'track': {
          'type': 'object',
          'properties': {
            'file': {
              'type': 'string',
              'format': 'object-id'
            },
            'label': {
              'type': 'string',
              'minLength': 0,
              'maxLength': 255
            },
            'kind': {
              'enum': [
                'captions',
                'chapters',
                'descriptions',
                'metadata',
                'subtitles'
              ]
            },
            'language': {
              'type': 'string',
              'format': 'language-code-alpha2'
            },
            'type': {
              'enum': [
                'default',
                'standard'
              ]
            }
          }
        },
        'title': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'caption': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'description': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        },
        'type': {
          'enum': [
            'featured',
            'standard'
          ]
        },
        'tags': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/tag'
          },
          'uniqueItems': true
        }
      },
      'required': [
        'file',
        'title'
      ]
    },
    'time': {
      'type': 'string',
      'format': 'time'
    },
    'performance': {
      'type': 'object',
      'properties': {
        'day': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        },
        'times': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/time',
          },
          'additionalItems': false,
          'uniqueItems': true
        }
      },
      'required': [
        'day',
        'times'
      ]
    },
    'review': {
      'type': 'object',
      'properties': {
        'author': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        },
        'evaluation': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 1023
        }
      },
      'required': [
      'author',
      'evaluation'
      ]
    },
    'translation': {
      'type': 'object',
      'properties': {
        'language': {
          'type': 'string',
          'format': 'language-code-alpha2'
        },
        'name': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        },
        'synopsis': {
          'type': 'string',
          'minLength': 2,
          'maxLength': 255
        },
        'reviews': {
          'type': 'array',
          'items': {
            '$ref': '#/definitions/review',
          },
          'additionalItems': false,
          // 'minItems': 1,
          'uniqueItems': true
        }
      },
      'required': [
        'language',
        'name',
        'synopsis'
      ]
    }
  },
  'required': [
    'reference',
    'translations',
    'theatre',
    'address',
    'latitude',
    'longitude',
    'createtime',
    'updatetime'
  ]
};

Show.validate = function(document) {
  return schema.validateResult(document, Show.schema, false, true);
};

module.exports = Show;
