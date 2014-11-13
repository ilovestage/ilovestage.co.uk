pm2 start /var/www/ilovestage.co.uk/server-configuration/pm2/processes.json

pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api

pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www
