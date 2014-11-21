'use strict';

var _ = require('lodash');

var internationalization = {

  translate: function(data, fields, lang) {

    function filterLanguage(data, field, lang) {
      var newValue = null;

      for(var key in data[field]) {
        if(key.indexOf(lang) === 0) {
          newValue = data[field][key];
        }

        delete data[field][key];
      }

      data[field] = newValue;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (!lang) {
      lang = 'en';
    }

    if(Array.isArray(fields)) {
      _(fields).forEach(function(field) {
        filterLanguage(data, field, lang);
      });
    } else if (typeof fields === 'string') {
      filterLanguage(data, fields, lang);
    }

    // use dot notation like 'reviews[0].name' with dot-object e.g. dj.object(result);

    return data;

    /* USAGE:

      var lang = 'ko';

      var data = {
        'item1': {
        'en': 'value in en',
        'fr': 'value in fr',
        'ko': 'value in ko'
      }
    };

    var fields = ['item1'];

    handleInternationalization(data, fields, lang);
    */
  }

};

module.exports = internationalization;
