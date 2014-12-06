'use strict';

var argv = require('yargs').argv;

var directory = require(__dirname + '/directory');

var application = argv.application;

module.exports = {
  application: {
    src: [
      directory.root + '/*.js',
      directory.root + '/applications/' + application + '.js',
      directory.application + '/**/*.js',
    ]
  },
  browserSync: {
    // server: {
    //   // We're serving the src folder as well for sass sourcemap linking
    //   baseDir: [
    //     directory.destination,
    //     directory.source
    //   ]
    // },
    files: [
      directory.destination + '/**',
      'app.js',
      'applications/_utilities/**/*.js',
      // 'source/_utilities/views/**/*.html',
      // Exclude Map files
      '!' + directory.destination + '/**.map'
    ],
    // tunnel: true,
    // proxy: 'localhost:9000',
    // browser: ['google chrome'],
    open: false
  },
  sass: {
    src: directory.source + '/styles/*.scss',
    dest: directory.destination + '/styles'
  },
  images: {
    src: directory.source + '/images/**',
    dest: directory.destination + '/images'
  },
  js: {
    src: directory.source + '/scripts/**/*.js',
    dest: directory.destination + '/scripts'
  },
  markup: {
    src: directory.source + '/views/**',
    dest: directory.destination
  },
  browserify: {
    // Enable source maps
    debug: true,
    // Additional file extentions to make optional
    extensions: ['.coffee', '.hbs'],
    // A separate bundle will be generated for each bundle config in the list below
    bundleConfigs: [
      {
        entries: directory.source + '/scripts/script.js',
        dest: directory.destination + '/scripts',
        outputName: 'script.js'
      }
      // {
      //   entries: directory.source + '/scripts/head.coffee',
      //   dest: directory.destination,
      //   outputName: 'head.js'
      // }
    ]
  }
};
