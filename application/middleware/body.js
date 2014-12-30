'use strict';

var deleteKey = require('key-del');
var DJ = require('dot-object');
var moment = require('moment');

var dj = new DJ();

module.exports = function() {

  return function* Body(next) {
    // console.log('this.request.method', this.request.method);

    if (this.request.body) {
      this.locals.document = this.request.body;

      dj.object(this.locals.document);

      if (this.request.method === 'POST') {
        this.locals.document.createtime = moment().toJSON();
        this.locals.document.updatetime = moment().toJSON();
      } else if (this.request.method === 'PUT') {
        this.locals.document.updatetime = moment().toJSON();
      }

      if (this.locals.document.format) {
        this.locals.document = deleteKey(this.locals.document, ['format']);
      }
    }

    yield next;
  };

};
