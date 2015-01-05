#!/bin/sh

npm cache clean -f

sudo npm update -g npm

npm install -g gulp
npm install -g imagemin
npm install -g istanbul
npm install -g jscs
npm install -g jshint
npm install -g jsonlint
npm install -g mocha
npm install -g n
npm install -g node-inspector
npm install -g npm
npm install -g npm-update-all
npm install -g npmedge
npm install -g pm2
npm install -g strongloop

n latest

node -v

exit
