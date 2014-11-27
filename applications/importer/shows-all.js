'use strict';

var packageJson = require(__dirname + '/../../package.json');
var environment = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

var mongo = require(__dirname + '/../_utilities/mongo');
var connectionString = mongo.connectionString(packageJson.config.environment[environment].server.database);

var db = require('monk')(connectionString);
var deleteKey = require('key-del');
var csv = require('csv');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var Shows = db.get('shows');

var dataFilesPath;
var showsFilePath;
var showsFileString;

var showsParseOptions = {
  columns: true
};

dataFilesPath = path.normalize(__dirname + '/../../data/import/shows');

showsFilePath = path.normalize(dataFilesPath + '/Shows - Shows.csv');
showsFileString = fs.readFileSync(showsFilePath);

Shows.remove({});

csv.parse(showsFileString, showsParseOptions, function(error, showRows) {
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
    var languageCode = languageFilePath.match(/[^[\]]+(?=])/g)[0];
    // console.log('languageCode', languageCode);

    var languageFileString = fs.readFileSync(languageFilePath);

    var languageParseOptions = {
      columns: true
    };

    csv.parse(languageFileString, languageParseOptions, function(error, languageRows) {
      // console.log('languageRows[languageIterator]', languageRows);

      var languageRowsIterator;

      for (languageRowsIterator = 0; languageRowsIterator < languageRows.length; languageRowsIterator++) {
        // console.log('languageRows[languageRowsIterator]', languageRows[languageRowsIterator]);
        // console.log('languageCode', languageCode);

        languageRows[languageRowsIterator].reviews = [];

        var reviewers = languageRows[languageRowsIterator].reviewer.split('\n').filter(Boolean);
        var reviews = languageRows[languageRowsIterator].review.split('\n').filter(Boolean);

        // console.log('reviewers', reviewers);
        // console.log('reviews', reviews);

        var reviewRowsIterator;

        for (reviewRowsIterator = 0; reviewRowsIterator < reviews.length; reviewRowsIterator++) {
          languageRows[languageRowsIterator].reviews.push({
            reviewer: reviewers[reviewRowsIterator],
            review: reviews[reviewRowsIterator]
          });
        }

        var translation = languageRows[languageRowsIterator];
        translation.lang = languageCode;
        translation = deleteKey(translation, ['id', 'reviewer', 'review']);

        var show = Shows.findAndModify({
          query: {
            importid: languageRows[languageRowsIterator].id
          },
          update: {
            $push: {
              translations: translation
            }
          }
        });

        // console.log('show', show);
      }

    });
  }

  var showRowIterator;

  for (showRowIterator = 0; showRowIterator < showRows.length; showRowIterator++) {

    var performances = showRows[showRowIterator].performances.split('\n').filter(Boolean);
    // console.log('performances', performances);

    showRows[showRowIterator].translations = [];
    // console.log('showRows[showRowIterator].performances', showRows[showRowIterator].performances);
    showRows[showRowIterator].performances = []; //reset to array

    var performanceRowsIterator;

    for (performanceRowsIterator = 0; performanceRowsIterator < performances.length; performanceRowsIterator++) {
      var input = performances[performanceRowsIterator].split(' ');
      var day = {
        day: input[0]
      };

      if(typeof input[1] !== 'undefined') {
        day.times = input[1].split('/');
      } else {
        day.times = null;
      }

      showRows[showRowIterator].performances.push(day);
    }

    showRows[showRowIterator].importid = showRows[showRowIterator].id;
    showRows[showRowIterator] = deleteKey(showRows[showRowIterator], ['id']);

    console.log(showRows[showRowIterator]);

    var show = Shows.insert(showRows[showRowIterator]);

    // console.log('show', show);
    //
    // show.error(function(err) {
    //   console.log('show.error', err);
    // });
    //
    // show.on('error', function(err) {
    //   console.log('show.error', err);
    // });
    //
    // show.on('success', function(doc) {
    //   console.log('show.success', doc);
    // });
    //
    // show.on('complete', function(err, doc) {
    //   console.log('complete', err, doc);
    // });
    //
    // show.success(function(doc) {
    //   console.log('success', doc);
    // });

    // console.log('showRowIterator', showRowIterator, 'showRows.length', (showRows.length - 1));

    if(showRowIterator === (showRows.length - 1)) {
      addTranslations();
      console.log('Updated shows data successfully imported.');
      setTimeout(function() {
        process.exit();
      }, 2000);
    }

  }

  // process.exit();

});
