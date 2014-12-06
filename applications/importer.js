'use strict';

var packageJson = require('package.json');

var argv = require('yargs').argv;
var koa = require('koa');
var ua = require('universal-analytics');

var app = koa();

var visitor = ua(packageJson.config.applications.importer.googleanalytics.key);

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function(err) {
    console.log('err', err);
  });
  yield next;
});

require(__dirname + '/importer/' + argv.job);
