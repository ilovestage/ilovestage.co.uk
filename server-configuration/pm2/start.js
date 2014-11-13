pm2 start -f /var/www/ilovestage.co.uk/server-configuration/pm2/processes.json
pm2 start -f server-configuration/pm2/processes.json

pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www

pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application www -i max
pm2 start --node-args="--harmony --debug" /var/www/ilovestage.co.uk/app.js -- --application api -i max

pm2 start -f --node-args="--harmony --debug" app.js --name www -- --application www -i max
pm2 start -f --node-args="--harmony --debug" app.js --name api -- --application api -i max
