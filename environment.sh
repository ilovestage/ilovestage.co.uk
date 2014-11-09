#!/bin/sh

ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew update && brew cleanup

brew install caskroom/cask/brew-cask

brew upgrade brew-cask && brew cask cleanup

brew install rbenv ruby-build

# Add rbenv to bash so that it loads every time you open a terminal
echo 'if which rbenv > /dev/null; then eval "$(rbenv init -)"; fi' >> ~/.bash_profile
source ~/.bash_profile

# Install Ruby 2.1.3 and set it as the default version
rbenv install 2.1.3
rbenv global 2.1.3

ruby -v

brew install imagemagick
brew install graphicsmagick
brew install mongodb
brew install node

npm install -g n
n latest
node -v

brew cask install atom
brew cask install cakebrew
brew cask install deltawalker
brew cask install firefox
brew cask install github
brew cask install google-chrome
brew cask install tower
brew cask install transmit
brew cask install skype
