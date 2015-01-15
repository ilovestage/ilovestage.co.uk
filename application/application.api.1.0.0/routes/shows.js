'use strict';

// var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
var internationalization = require('application/utilities/internationalization');
// var operators = require('application/utilities/operators');

module.exports = function ShowsRoutes(configuration, router, db, models) {
  var routes = new router();

  var Booking = models.booking;
  var Event = models.event;
  var Note = models.note;
  var Payment = models.payment;
  var Show = models.show;
  var User = models.user;

  routes.name = 'shows';

  var returnFieldsShow = {
    theatre: 1,
    address: 1,
    latitude: 1,
    longitude: 1,
    performances: 1,
    groupdiscountprice: 1,
    groupfacevalue: 1,
    singlediscountprice: 1,
    singlefacevalue: 1,
    priceband: 1,
    reference: 1,
    videourl: 1
  };

  routes.del('delete show', '/:id', authentication, function* (next) {
    // var this.locals.queryOperators = {};
    var show;

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (authorization.apply(this, ['admin']) === true) {
      show = yield db.collection('shows').remove(this.locals.queryOperators).then(Show);

      if (show instanceof Object) {
        this.locals.result = show;
        this.locals.status = 204;
      }
    }

    yield next;
  });

  routes.get('read shows', '/', function* (next) {
    var limit = 50;
    var returnFields = {};
    var _this = this;
    var shows;
    var showsModified = [];

    returnFields = returnFieldsShow;

    if (this.query.view === 'detailed') {
      returnFields.translations = 1;
    } else {
      returnFields.translations = {
        $elemMatch: {
          lang: this.locals.lang
        }
      };
    }

    if (this.query.view === 'detailed') {
      if (authorization.apply(this, ['admin']) === true) {
        returnFields = {};
      }
    }

    // if (typeof this.query.name !== 'undefined') {
    //   this.locals.queryOperators.translations[this.locals.lang].name = this.query.name;
    // } else if (typeof this.query.theatre !== 'undefined') {
    //   this.locals.queryOperators.theatre = this.query.theatre;
    // }

    if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
      limit = parseInt(this.query.limit);

      if (limit > 50) {
        limit = 50;
      }
    }

    shows = yield db.collection('shows').find(this.locals.queryOperators, returnFields, {
      limit: limit
    }).then(Show);

    if (shows.length > 0) {
      if (this.query.view !== 'detailed') {
        shows.forEach(function(document) {
          showsModified.push(internationalization.translate(document, _this.locals.lang));
        });

        shows = showsModified;
      }

      this.locals.result = shows;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('describe show', '/schema', authentication, function* (next) {
    var schema = Show.describe();

    if (authorization.apply(this, ['admin']) === true) {
      this.locals.result = schema;
      this.locals.status = 200;
    }

    yield next;
  });

  routes.get('read show', '/:id', function* (next) {
    var returnFields = {};
    // var this.locals.queryOperators = {};
    var show;

    var id = mongo.toObjectId(this.params.id);

    if (id) {
      this.locals.queryOperators._id = id;

      returnFields = returnFieldsShow;

      if (this.query.view === 'detailed') {
        returnFields.translations = 1;
      } else {
        returnFields.translations = {
          $elemMatch : {
            lang: this.locals.lang
          }
        };
      }

      if (this.query.view === 'detailed') {
        if (authorization.apply(this, ['admin']) === true) {
          returnFields = {};
        }
      }

      show = yield db.collection('shows').findOne(this.locals.queryOperators, returnFields).then(Show);

      if (show instanceof Object) {
        if (this.query.view !== 'detailed') {
          show = internationalization.translate(show, this.locals.lang);
        }

        this.locals.result = show;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.post('create show', '/', authentication, function* (next) {
    var show;
    var validator;

    if (authorization.apply(this, ['admin']) === true) {
      validator = Show.validate(this.locals.document, 'create');

      if (validator.valid === true) {
        show = yield db.collection('shows').insert(this.locals.document).then(Show);

        if (show instanceof Object) {
          this.locals.result = show;
          this.locals.status = 201;
        }
      } else {
        this.locals.error = validator;
        this.locals.status = 400;
      }
    }

    yield next;
  });

  routes.put('update show', '/:id', authentication, function* (next) {
    var updateFields = {};
    var show;
    var validator;

    if (this.query.replace === 'true') {
      updateFields = this.locals.document;
    } else {
      updateFields = {
        $set: this.locals.document
      };
    }

    if (authorization.apply(this, ['admin']) === true) {
      validator = Show.validate(this.locals.document, 'update');

      if (validator.valid === true) {
        show = yield db.collection('shows').update({
          _id: this.params.id
        }, updateFields).then(Show);

        if (show instanceof Object) {
          this.locals.result = show;
          this.locals.status = 200;
        }
      }
    }

    yield next;
  });

  routes.post('create show review', '/:id/reviews', function* (next) {
    var updateFields = {};
    var show;
    // var this.locals.queryOperators = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    // KJP: Add comment, don't update
    // if (this.query.replace === 'true') {
    //   fields = {
    //     reviews: this.locals.document
    //   };
    // } else {
    //   fields = {
    //     $push: {
    //       reviews: this.locals.document
    //     }
    //   };
    // }

    if (authorization.apply(this, ['admin']) === true) {
      show = yield db.collection('shows').update(this.locals.queryOperators, updateFields).then(Show);

      if (show instanceof Object) {
        this.locals.result = show;
        this.locals.status = 201;
      }
    }

    yield next;
  });

  routes.put('update show review', '/:id/reviews', function* (next) {
    var updateFields = {};
    var show;
    // var this.locals.queryOperators = {};

    this.locals.queryOperators._id = mongo.toObjectId(this.params.id);

    if (this.query.replace === 'true') {
      updateFields = {
        reviews: this.locals.document
      };
    } else {
      updateFields = {
        $set: {
          reviews: this.locals.document
        }
      };
    }

    if (authorization.apply(this, ['admin']) === true) {
      show = yield db.collection('shows').update(this.locals.queryOperators, updateFields);

      if (show instanceof Object) {
        this.locals.result = show;
        this.locals.status = 200;
      }
    }

    yield next;
  });

  routes.get('show not found', /^([^.]+)$/, function* (next) {
    this.locals.status = 404;

    yield next;
  }); //matches everything without an extension

  return routes;
};
