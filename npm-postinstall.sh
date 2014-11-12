#!/bin/sh

npm run bower cache clean;
npm run bower update;
npm run bower install;

npm run gulp;

exit
