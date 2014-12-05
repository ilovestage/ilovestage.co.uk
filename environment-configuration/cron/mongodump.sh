#!/bin/bash

MONGO_DATABASE="ilovestage"
APP_NAME="ilovestage"

MONGO_USER="ilovestage"
MONGO_PASSWORD="curtaincall1"

MONGO_HOST="ds063889.mongolab.com"
MONGO_PORT="63889"
TIMESTAMP=`date +%F-%H%M`
# MONGODUMP_PATH="/usr/bin/mongodump"
# MONGODUMP_PATH="/usr/local/bin/mongodump"
MONGODUMP_PATH="$(which mongodump)"
BACKUPS_DIR="$HOME/backups/$APP_NAME"
BACKUP_NAME="$APP_NAME-$TIMESTAMP"

# mongo admin --eval "printjson(db.fsyncLock())"
$MONGODUMP_PATH -h $MONGO_HOST:$MONGO_PORT -d $MONGO_DATABASE -u $MONGO_USER -p $MONGO_PASSWORD
# $MONGODUMP_PATH -h $MONGO_HOST:$MONGO_PORT -d $MONGO_DATABASE
# $MONGODUMP_PATH -d $MONGO_DATABASE
# mongo admin --eval "printjson(db.fsyncUnlock())"

mkdir -p $BACKUPS_DIR
mv dump $BACKUP_NAME
tar -zcvf $BACKUPS_DIR/$BACKUP_NAME.tgz $BACKUP_NAME
rm -rf $BACKUP_NAME
