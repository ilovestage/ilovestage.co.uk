'use strict';

var directory = require(__dirname + '/_utilities/directory');

module.exports = {
  browserSync: {
    server: {
      // We're serving the src folder as well for sass sourcemap linking
      baseDir: [
        directory.destination,
        directory.source
      ]
    },
    files: [
      directory.destination + '/**',
      // Exclude Map files
      '!' + directory.destination + '/**.map'
    ],
    tunnel: true
  },
  sass: {
    src: directory.source + '/styles/*.{sass, scss}',
    dest: directory.destination
  },
  images: {
    src: directory.source + '/images/**',
    dest: directory.destination + '/images'
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
