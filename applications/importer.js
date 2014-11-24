'use strict';

var packageJson = require(__dirname + '/../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = require(__dirname + '/_utilities/mongo');
var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var _ = require('lodash');
var argv = require('yargs').argv;
var db = require('monk')(connectionString);
var deleteKey = require('key-del');
var csv = require('csv');
var fs = require('fs');
var glob = require('glob');
var koa = require('koa');
var path = require('path');
var ua = require('universal-analytics');

var shows = db.get('shows');

var app = koa();

var visitor = ua(packageJson.config.applications.importer.googleanalytics.key);

var dataFilesPath;

var parseOptions = {
  columns: true
};

app.use(function* (next) {
  var job = argv.job.split('-');

  visitor.event(job[0], job[1], function (err) {
    console.log('err', err);
  });
  yield next;
});

switch(argv.job) {
  case 'shows-all':
    var showsFilePath;
    var showsFileString;

    dataFilesPath = path.normalize(__dirname + '/../data/import/shows');

    showsFilePath = path.normalize(dataFilesPath + '/Shows - Shows.csv');
    showsFileString = fs.readFileSync(showsFilePath);

    shows.remove({});

    csv.parse(showsFileString, parseOptions, function(error, showRows) {
      // console.log('showRows', showRows);

      function addTranslations() {
        var pattern = 'Shows - lang?*?.csv';

        var languageFiles = glob.sync(pattern, {
          cwd: dataFilesPath,
          nodir: true
        });

        // console.log('languageFiles', languageFiles);

        var languageFilesIterator;

        for (languageFilesIterator = 0; languageFilesIterator < languageFiles.length; languageFilesIterator++) {
          var languageFilePath = dataFilesPath + '/' + languageFiles[languageFilesIterator];
          console.log('Processing', languageFilePath);

          translateShow(languageFilePath);
        }

      }

      function translateShow(languageFilePath) {
        var languageCode = languageFilePath.match(/[^[\]]+(?=])/g);
        // console.log('languageCode', languageCode);

        var languageFileString = fs.readFileSync(languageFilePath);

        csv.parse(languageFileString, parseOptions, function(error, languageRows) {
          // console.log('languageRows[languageIterator]', languageRows);

          var languageRowsIterator;

          for (languageRowsIterator = 0; languageRowsIterator < languageRows.length; languageRowsIterator++) {
            // console.log('languageRows[languageRowsIterator]', languageRows[languageRowsIterator]);
            // console.log('languageCode', languageCode);

            var translation = {};

            translation[languageCode] = languageRows[languageRowsIterator];
            console.log('translation', translation);

            var updateFields = deleteKey(translation, ['id']);
            console.log('updateFields', updateFields);

            shows.findAndModify({
              query: {
                id: languageRows[languageRowsIterator].id
              },
              update: {
                $set: updateFields
              }
            });

            // var show = shows.find({
            //   query: {
            //     id: languageRows[languageRowsIterator].id
            //   }
            // });

            // console.log('show1', show);

            // if(languageRows[languageRowsIterator].id === showRows[showIterator].id) {
            //   console.log('match');
            // }
          }

        });
      }

      var showIterator;

      for (showIterator = 0; showIterator < showRows.length; showIterator++) {
        // console.log('showRows[showIterator]', showRows[showIterator].id);

        var promise = shows.insert(showRows[showIterator]);

        // console.log('promise.type', promise.type);
        //
        // promise.error(function(err) {
        //   console.log('promise.error', err);
        // });
        //
        // promise.on('error', function(err) {
        //   console.log('promise.error', err);
        // });
        //
        // promise.on('success', function(doc) {
        //   console.log('promise.success', doc);
        // });
        //
        // promise.on('complete', function(err, doc) {
        //   console.log('complete', err, doc);
        // });
        //
        // promise.success(function(doc) {
        //   console.log('success', doc);
        // });

        // console.log('showIterator', showIterator, 'showRows.length', (showRows.length - 1));

        if(showIterator === (showRows.length - 1)) {
          addTranslations();
        }

      }

    });

  break;
}
