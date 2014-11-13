pm2 start -f --node-args="--harmony --debug" app.js --name www -i max -- --application www
pm2 start -f --node-args="--harmony --debug" app.js --name api -i max -- --application api

pm2 start -f /var/www/ilovestage.co.uk/server-configuration/pm2/processes.json
