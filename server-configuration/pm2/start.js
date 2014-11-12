pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--harmony" --watch --name api-1 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--harmony" --watch --name api-2 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--harmony" --watch --name api-3 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--harmony" --watch --name api-4 -- --application api

pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--application www" --watch --name www-1 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--application www" --watch --name www-2 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--application www" --watch --name www-3 -- --application api
pm2 start /usr/local/bin/node /var/www/ilovestage.co.uk/app.js --node-args="--application www" --watch --name www-4 -- --application api
