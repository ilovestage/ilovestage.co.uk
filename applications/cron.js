'use strict';

var packageJson = require('package.json');

var argv = require('yargs').argv;
var koa = require('koa');
var ua = require('universal-analytics');

var visitor = ua(packageJson.config.applications.cron.googleanalytics.key);

var app = koa();

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function (err) {
    console.log('err', err);
  });
  yield next;
});

require(__dirname + '/cron/' + argv.job);
