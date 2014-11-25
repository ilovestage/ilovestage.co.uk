#!/bin/sh

cd "$(dirname "$0")"

echo "Syncing assets to Amazon S3 bucket:"
aws s3 sync ./build/www s3://cdn.ilovestage.co.uk --delete --exclude "*.DS_Store"

echo "Running 'git pull' from /var/www/ilovestage.co.uk directory on Amazon EC2 instance:"
ssh -i ~/.ssh/karl.pem ubuntu@ilovestage.co.uk "(cd /var/www/ilovestage.co.uk && git pull)"

echo "Running 'git pull' from /var/www/ilovestage.co.uk directory on Amazon EC2 instance:"
ssh -i ~/.ssh/karl.pem ubuntu@ilovestage.co.uk "(cd /var/www/ilovestage.co.uk && npm install && npm update)"

echo "Restart application on Amazon EC2 instance via PM2 graceful reload:"
ssh -i ~/.ssh/karl.pem ubuntu@ilovestage.co.uk "pm2 gracefulReload all"

exit
