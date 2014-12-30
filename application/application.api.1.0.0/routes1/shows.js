'use strict';

// var packageJson = require('package.json');
// var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var bodyParser = require('koa-bodyparser');
var koa = require('koa');
// var moment = require('moment');
var router = require('koa-router');

var setResponse = require('_middleware/setResponse');

var authentication = require('_utilities/authentication');
var authorization = require('_utilities/authorization');
// var cryptography = require('_utilities/cryptography');
// var date = require('_utilities/date');
// var email = require('_utilities/email');
var internationalization = require('_utilities/internationalization');
var mongo = require('_utilities/mongo');

var Show = require('_models/show');

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

var app = koa();

app.use(bodyParser());

app.use(router(app));

app.del('/:id', authentication, function* (next) {
  var searchFields = {};
  var show;

  searchFields._id = mongo.toObjectId(this.params.id);

  if (authorization.apply(this, ['admin']) === true) {
    show = yield Show.remove(searchFields);

    if (show instanceof Object) {
      this.locals.result = show;
      this.locals.status = 204;
    }
  }

  yield next;
});

app.get('/', function* (next) {
  var limit = 50;
  var returnFields = {};
  var searchFields = {};
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
    searchFields.translations[this.locals.lang].name = this.query.name;
  } else if (typeof this.query.theatre !== 'undefined') {
    searchFields.theatre = this.query.theatre;
  }

  if (this.query.limit && (typeof parseInt(this.query.limit) === 'number')) {
    limit = parseInt(this.query.limit);

    if (limit > 50) {
      limit = 50;
    }
  }

  shows = yield Show.find(searchFields, returnFields, {
    limit: limit
  });

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

app.get('/schema', authentication, function* (next) {
  if (authorization.apply(this, ['admin']) === true) {
    var schema = Show.schema;

    this.locals.result = schema;
    this.locals.status = 200;
  }

  yield next;
});

app.get('/:id', function* (next) {
  var returnFields = {};
  var searchFields = {};
  var show;

  var id = mongo.toObjectId(this.params.id);

  if (id) {
    searchFields._id = id;

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

    show = yield Show.findOne(searchFields, returnFields);

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

app.post('/', authentication, function* (next) {
  var show;
  var validator;

  if (authorization.apply(this, ['admin']) === true) {
    validator = Show.validate(this.locals.document, 'create');

    if (validator.valid === true) {
      show = yield Show.createOne(this.locals.document);

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

app.put('/:id', authentication, function* (next) {
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
      show = yield Show.update({
        _id: this.params.id
      }, updateFields);

      if (show instanceof Object) {
        this.locals.result = show;
        this.locals.status = 200;
      }
    }
  }

  yield next;
});

app.post('/:id/reviews', function* (next) {
  var updateFields = {};
  var show;
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

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
    show = yield Show.update(searchFields, updateFields);

    if (show instanceof Object) {
      this.locals.result = show;
      this.locals.status = 201;
    }
  }

  yield next;
});

app.put('/:id/reviews', function* (next) {
  var updateFields = {};
  var show;
  var searchFields = {};

  searchFields._id = mongo.toObjectId(this.params.id);

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
    show = yield Show.update(searchFields, updateFields);

    if (show instanceof Object) {
      this.locals.result = show;
      this.locals.status = 200;
    }
  }

  yield next;
});

app.get(/^([^.]+)$/, function* (next) {
  this.locals.status = 404;

  yield next;
}); //matches everything without an extension

app.use(setResponse());

module.exports = app;
