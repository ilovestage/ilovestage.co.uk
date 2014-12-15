'use strict';

var _ = require('lodash');
var deleteKey = require('key-del');

var internationalization = {

  translate: function(data, lang) {
    if (typeof data !== 'object') {
      return data;
    }

    data._id = data._id.toString(); // to prevent corruption of object type

    var translation = _.find(data.translations, function(translation) {
      // return translation.lang = lang;
      return (translation.lang === lang);
    });

    data = deleteKey(data, ['translations']);

    data = _.merge(translation, data);

    // console.log('data: ' + data._id, data);

    return data;
  }

};

module.exports = internationalization;
