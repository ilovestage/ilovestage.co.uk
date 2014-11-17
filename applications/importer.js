'use strict';

var packageJson = require(__dirname + '/../package.json');
var config = packageJson.config.environment[process.env.NODE_ENV || 'development'];

var _ = require('lodash');
var argv = require('yargs').argv;
var co = require('co');
var csv = require('csv');
var fs = require('fs');
var Glob = require("glob").Glob;
var koa = require('koa');
// var moment = require('moment');
var path = require('path');
// var should = require('should');
// var stripe = require('stripe')(config.api.stripe.key);
// var thunkify = require('thunkify');
var ua = require('universal-analytics');

var database = require(__dirname + '/_utilities/database');
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

var parser = csv.parse(
  {
    delimiter: '\n'
  },
  function(err, data) {
    console.log('data', data);
  }
);

var inputFile = path.normalize(__dirname + '/../data/import/shows/shows.xls - Theatres.csv');
console.log(require(inputFile));

switch(argv.job) {
  case 'shows-all':
    // var pattern = path.resolve(__dirname, '../data/import/shows/*.csv');
    // console.log('pattern', pattern);
    //
    // var files = new Glob(
    //   pattern,
    //   {
    //     sync: true
    //   }
    // );
    //
    // console.log('files', files);

    // _(files).forEach(function(doc) {
    //   console.log('doc', doc);
    // });

    db.collectionSync('shows').remove({});

    var transformer = csv.transform(function(data) {
      data.push(data.shift());
      return data;
    });

    transformer.on('readable', function() {
      var row;
      while(row = transformer.read()) {
        console.log('row', row);
        // row = {"heeey": "you"};

        var shows = db.collectionSync('shows').insert(row);
        // console.log('shows', shows);
      }
    });

    transformer.on('error', function(err) {
      console.log('error');
      console.log(err.message);
    });

    transformer.on('finish', function(){
      // output.should.eql([ [ '2', '3', '4', '1' ], [ 'b', 'c', 'd', 'a' ] ]);
      console.log('Importer application finished.');
    });

    // transformer.write(['1','2','3','4']);
    // transformer.write(['a','b','c','d']);

    // iterate over CSV rows, send each to the transformer, convert the structure in the readable transformer state and then save in the  readable transformer state.
    console.log('inputFile', inputFile);
    fs.createReadStream(inputFile).pipe(parser);

    transformer.end();

  break;
}
