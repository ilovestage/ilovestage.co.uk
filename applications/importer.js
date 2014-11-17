'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var argv = require('yargs').argv;
var co = require('co');
var koa = require('koa');
var moment = require('moment');
var stripe = require('stripe')(config.api.stripe.key);
var thunkify = require('thunkify');
var ua = require('universal-analytics');

var database = require(__dirname + '/database');
var utilities = require(__dirname + '/_utilities/utilities');

var db = new database(config.server.database);

var app = koa();

var visitor = ua(packageJson.config.applications.importer.googleanalytics.key);

var currentDate = new Date();

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function (err) {
    console.log('err', err);
  });
  yield next;
});

switch(argv.job) {
  case 'shows-all':

  break;
}
