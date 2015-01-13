'use strict';

var moment = require('moment');

var authentication = require('application/generators/authentication');

var authorization = require('application/functions/authorization');

var mongo = require('application/utilities/mongo');
var internationalization = require('application/utilities/internationalization');
// var operators = require('application/utilities/operators');

module.exports = function ShowsRoutes(configuration, router, db, models, render) {
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

  routes.get('/', function* (next) {
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

    if (typeof this.query.name !== 'undefined') {
      this.locals.queryOperators.translations[this.locals.lang].name = this.query.name;
    } else if (typeof this.query.theatre !== 'undefined') {
      this.locals.queryOperators.theatre = this.query.theatre;
    }

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

    var settings = {};

    var locals = {
      bodyClass: 'privacy password-reset',
      title: 'Reset Password'
    };

    _.merge(settings, this.locals.defaults, locals);

    var body = yield render('shows-index', settings);

    settings.body = body;

    var html = yield render('layouts/default', settings);

    this.body = html;

    yield next;
  });

  routes.get('/:id', function* (next) {
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

  return routes;
};
