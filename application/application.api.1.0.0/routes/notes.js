'use strict';

// var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
// var operators = require('application/utilities/operators');

module.exports = function NotesRoutes(configuration, router, db, models) {
  var routes = new router();

  var Note = models.note;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'notes';

  routes.del('delete note', '/:id', authentication, function* (next) {
    var note;

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

      note = yield db.collection('notes').findOne(this.locals.queryOperators).then(Note);

      if (note instanceof Object) {
        if (authorization.apply(this, [note.userid]) === true) {
          note = null;

          note = yield db.collection('notes').remove({
            _id: this.params.id
          });

          this.locals.result = note;
          this.locals.status = 204;
        }
      }
    }

    yield next;
  });

  routes.get('read notes', '/', function* (next) {
    var notes;
    // var limit = this.query.limit ? parseInt(this.query.limit) : 50;
    var returnFields = {};

    if (authorization.apply(this, [this.query.userid])) {
      notes = yield db.collection('notes').find(this.locals.queryOperators, returnFields).then(Note);

      if (notes.length > 0) {
        this.locals.result = notes;
        this.locals.status = 200;
      }

    }

    yield next;
  });

  routes.get('describe note', '/schema', authentication, function* (next) {
    var schema = Note.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('read note', '/:id', authentication, function* (next) {
    var note;
    var event;
    var returnFields = {};

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

      note = yield db.collection('notes').findOne(this.locals.queryOperators, returnFields).then(Note);

      if (note instanceof Object) {

        if (authorization.apply(this, [note.userid]) === true) {

          if (event instanceof Object) {
            this.locals.result = note;
            this.locals.status = 200;
          }
        }
      }
    }

    yield next;
  });

  routes.post('create note', '/', function* (next) {
    var note;
    // var returnFields = {};
    // var this.locals.queryOperators;
    var validator;

    if (authorization.apply(this, [this.locals.document.userid]) === true) {
      validator = Note.validate(this.locals.document, 'create');

      if (validator.valid === true) {
        console.log('here 2');
        note = yield db.collection('notes').insert(this.locals.document).then(Note);
        console.log('here 3', note);
        if (note instanceof Object) {
          this.locals.result = note;
          this.locals.status = 201;
        }

      } else {
        this.locals.error = validator;
        this.locals.status = 400;
      }

    }

    yield next;
  });

  routes.put('update note', '/:id', function* (next) {
    var note;
    var updateFields = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    // this.locals.document.updatetime = moment().toDate();

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, [this.locals.document.userid]) === true) {
      note = yield db.collection('notes').update(this.locals.queryOperators, updateFields);

      if (note instanceof Object) {
        this.locals.result = note;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get('note not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
