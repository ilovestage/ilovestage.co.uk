'use strict';

var js2xmlparser = require('js2xmlparser');

module.exports = function() {

  return function* authSetup(next) {
    // console.log('authSetup', this.locals.db, this.locals.models);

    if (this.locals.db && this.locals.models) {
      // console.log('this.locals.db && this.locals.models');

      var db = this.locals.db;
      var models = this.locals.models;

      var User = models.user;

      // console.log('this.locals.db', this.locals.db);
      // console.log('this.locals.models', this.locals.models);

      var returnFields = {};
      var searchFields = {};

      console.log('this.query.bypass', this.query.bypass);

      if (this.query.bypass === 'true') {
        this.locals.bypassAuthentication = true;
        this.locals.currentUser = 'bypassed';
      } else {
        this.locals.bypassAuthentication = false;

        if (this.request.header.uid) {
          returnFields = {
            _id: 1,
            uid: 1,
            role: 1
          };

          searchFields.uid = this.request.header.uid;
          // searchFields.uid = mongo.toObjectId(this.request.header.uid);

          // console.log('users2', users);

          // var currentUser = yield users.findOne(searchFields, returnFields);

          // var currentUser = users.find({}).then(function(docs) {
          //   console.log('currentUser', docs);
          // });

          // var currentUser = yield db.users.findOne(searchFields).then(User);
          // var currentUser = db.users.findOne(searchFields).then(User);

          var currentUser = yield db.collection('users').findOne(searchFields).then(User);

          console.log('currentUser', currentUser);

          if (currentUser instanceof Object) {
            this.locals.currentUser = currentUser;
          } else {
            this.locals.currentUser = {};
          }

          this.locals.status = (typeof this.locals.currentUser !== 'undefined') ? 404 : 403;

          console.log('this.locals.currentUser', this.locals.currentUser);
          console.log('this.request.header.uid', this.request.header.uid);
          console.log('searchFields.uid', searchFields.uid);
        } else {
          this.locals.status = 401;
        }
      }

    }

    try {
      yield next;
    } catch (error) {
      if (401 === error.status) {
        this.locals.error = this.locals.messages.unauthorised;
        this.locals.status = error.status; // use HTTP status code

        this.locals.body.originalUrl = this.request.originalUrl;
        this.locals.body.status = this.locals.status; // use HTTP status code
        this.locals.body.message = this.locals.message;
        this.locals.body.error = this.locals.error;
        this.locals.body.result = this.locals.result;

        if ((this.request.header['content-type'] === 'application/vnd.api+xml') || (this.query.format === 'xml')) {
          this.body = js2xmlparser('response', this.locals.body);
          this.type = 'application/vnd.api+xml';
        } else {
          this.body = this.locals.body;
          this.type = 'application/vnd.api+json';
        }

        this.status = this.locals.status;

        this.set('WWW-Authenticate', 'Basic');
      } else {
        throw error;
      }

    }

  };

};
