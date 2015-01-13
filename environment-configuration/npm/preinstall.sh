#!/bin/sh

LSB_RELEASE=/etc/lsb-release

if [ -f LSB_RELEASE ]; then
	DISTRIB_ID=`cat LSB_RELEASE | sed -n 's/^DISTRIB_ID=//p'`
fi

#echo "DISTRIB_ID: $DISTRIB_ID"

git config core.ignorecase false

if [[ $DISTRIB_ID = 'Ubuntu' ]]; then
	sudo update_rubygems
	sudo gem install bundler
else
	gem update --system
	gem install bundler
fi

bundle install

exit
