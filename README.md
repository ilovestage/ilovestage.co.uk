ilovestage.com
=============

ssh -i ~/.ssh/karl.pem ubuntu@54.72.195.84

Connect to database:
mongo ds063889.mongolab.com:63889/ilovestage -u ilovestage -p curtaincall1

Drop collections:
db.bookings.drop()
db.events.drop()
db.payments.drop()
db.shows.drop()
db.users.drop()

Dump database:
mongodump --host ds063889.mongolab.com:63889 --username ilovestage --password curtaincall1 --db ilovestage

Connect to database:
mongo ds063889.mongolab.com:63889/ilovestage -u ilovestage -p curtaincall1

Run via npm:
node --harmony --debug app.js --application api --version 1.0.0

Run via nodemon:
nodemon --harmony --debug app.js -- --application api --version 1.0.0

Debug Monk queries:
DEBUG="monk:*" nodemon --harmony app.js --application api --version 1.0.0 --debug

pm2 resurrect

pm2 graceful all

sudo reboot now

Run shows importer:
node --harmony app.js --application importer --job shows-all

Run finalise bookings cron job
node --harmony app.js --application cron --job bookings-finalise

Run events populate cron job
node --harmony app.js --application cron --job events-populate

Run mongodump cron job
/var/www/ilovestage.co.uk/server-configuration/cron/mongodump.sh

node --harmony app.js --application api --version 1.0.0
npm start app.js --application api

redis-cli -h localhost -p 6379

node-inspector --web-port 5140 --debug-port 5130
node-inspector --web-port 5540 --debug-port 5530

http://charliegleason.com/articles/harp-gulp-and-browsersync
http://harpjs.com/
