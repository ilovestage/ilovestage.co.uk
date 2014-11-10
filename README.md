ilovestage.com
=============

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

Run via npm:
nodemon --harmony app.js --application api --debug

Run via nodemon:
nodemon --harmony app.js --application api --debug

Debug Monk queries:
DEBUG="monk:*" nodemon --harmony app.js --application api --debug

pm2 resurrect

pm2 graceful all

sudo reboot now

Run shows importer:
node --harmony app.js --application importer

http://charliegleason.com/articles/harp-gulp-and-browsersync
http://harpjs.com/
