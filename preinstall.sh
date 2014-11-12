#!/bin/sh

DISTRIB_ID=`cat /etc/lsb-release | sed -n 's/^DISTRIB_ID=//p'`

#echo "DISTRIB_ID: $DISTRIB_ID"

git config core.ignorecase false

if [ $DISTRIB_ID = 'Ubuntu' ]; then
	sudo update_rubygems
else
	gem update --system
fi

gem install bundler
bundle install

exit
