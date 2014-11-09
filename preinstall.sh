#!/bin/sh

git config core.ignorecase false

gem update --system
gem install bundler
bundle install

exit
