#!/bin/sh

DISTRIB_ID=`cat /etc/lsb-release | sed -n 's/^DISTRIB_ID=//p'`

#echo "DISTRIB_ID: $DISTRIB_ID"

git config core.ignorecase false

if [ $DISTRIB_ID = 'Ubuntu' ]; then
	sudo update_rubygems
	sudo gem install bundler
else
	gem update --system
	gem install bundler
fi

bundle install

exit
