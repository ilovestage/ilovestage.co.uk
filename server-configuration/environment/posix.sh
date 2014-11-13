#!/bin/sh

npm cache clean -f

sudo npm update -g npm

sudo npm install -g bower
sudo npm install -g n
sudo npm install -g npm-update-all
sudo npm install -g gulp
sudo npm install -g imagemin

n latest

node -v

exit
