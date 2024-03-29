# Payment Gateway
A payment gateway to buy assets on a Substrate blockchain paying by ERC20 tokens like USDT, and credit/debit cards. 
It's currently configured to accept payment by USDT on Polygon Ethereum Network.
The solution can enable additional stable coins and different networks with a minor update of the server module adding new contract addresses and chain id.  
The payment by credit card use [https://www.stripe.com](https://www.stripe.com) as card gateway.  
The user interface reflect the designs of Bitgreen, you can customised or use as example to integrate in your current UI.  

Here how it works:  
  
## Payment Setup Workflow   
<p align="center">
  <img src="./img/R_Payment_Setup.png" width="800">
</p>  
  
## Card Payment Workflow  
<p align="center">
  <img src="./img/R_Card_Payment.png" width="800">
</p>  
  
## Crypto Payment Workflow  
<p align="center">
  <img src="./img/R_Crypto_Payment.png" width="800">
</p>


Requirements:  
  
Hardware:  
- 1 server or virtual machine with 16 GB of ram and 10 GB disk for the operating system and the application.
- 1 virtual machine for each validator (for security reasons), for testing you can use the same server.  

Operating Sytem:  
- Linux Debian or Ubuntu with shell/bash access.  
- Other Linux distribution will work with minimum changes to the installation steps.  
  
Software Packages:   
- Postgresql Server.  
- Nodejs > 20.x.  
- git.    

## Installation. 
The following instructions have been tested for Linux Debian 11.  
1) Install the Git and Postgres:  
```bash
apt-get -y install git postgresql-all
```
2) Install nodejs version > 20.x following the instruction at the official web site [https://nodejs.org](https://nodejs.org).  

3) clone this project with:  
```bash
cd /usr/src/
git client https://github.com/bitgreen/payment-gateway.git
```
4) You should install the the dependencies with:  
```bash
cd /usr/src/payment-gateway
npm install
```
5) Create a database named paymentgateway and the user with the same name:  
```bash
su postgres
psql
create database paymentgateway;
CREATE ROLE paymentgateway
SUPERUSER 
LOGIN 
PASSWORD '_set_your_password_here';
\q
```
8) create the database schema
```bash
psql paymentgateway -f schema.sql
exit
```
9) Customise *.sh  
- use you preferred text editor to edit the files with suffix .sh. Follows the in-line instruction to set all the required parameters.

10) Configure an NGINX reverse proxy for https connection pointing to http://localhost:3000


## Running the Payment Gateway:
To run the main server
```bash
/usr/src/payment-gateway/payment-gateway.sh
```
in a different shell:  
```bash
/usr/src/payment-gateway/payment-validator-xxxxxxxx.sh
```
repeat the process for each validator.

in a new shell:  
```bash
/usr/src/payment-gateway/payment-gateway-webhook-stripe.sh
```
add to the crontab the following command to be executed every 2 minutes:
```bash
crontab -e
# add the followin line:
*/2 * * * * /usr/src/payment-gateway/payment-validator-delayed.js
# and save
```
add to the crontab the following command to be executed every day or often as you wish):
```bash
crontab -e
# add the followin line:
15 0 * * * /usr/src/payment-gateway/payment-gateway-settlement.js
# and save
```

You should configure a domain name or a sub-domain to point to your server, for example: pay.yourdomain.com
You can get a free TLS certificate from [https://certbot.eff.org/](https://certbot.eff.org/). 
  
You should configure an NGINX reverse proxy to connect by https, in the file: reverse-proxy-example.nginx.   
You have a good example that could be copied to /etc/nginx/sites-enabled/default and changed for your cerficates:  
```
limit_conn_zone $binary_remote_addr zone=limitconnbyaddr:20m;
limit_conn_status 429;
server {
        server_name pay.bitgreen.org;
	limit_conn   limitconnbyaddr  512;
        location / {
          proxy_pass http://localhost:3000;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header Host $host;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
        }
        location /webhook {
          proxy_pass http://localhost:4242;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header Host $host;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
        }
        listen [::]:443 ssl ipv6only=on;
        listen 443 ssl;
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # managed by Certbot
        
        ssl_session_cache shared:cache_nginx_SSL:1m;
        ssl_session_timeout 1440m;

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers on;

	ssl_ciphers "ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS";

        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

## Running the Validator Server  

The validators server listen for payment on the blockchain and submit the approval to the Bitgreen Parachain.  
For security, we should have >1 validator running from differnet machine and looking to different nodes for each network.  
You can run the validator settings certain variables like in the example payment-validator-quicknode.sh:

```
#!/bin/bash
# the endpoint supporting web socket protocol wss://, we use to listen to the blockhain events, replace with the correct
# endpoint for the the blockchain involved
export BLOCKCHAIN="wss://smart-greatest-orb.ethereum-sepolia.discover.quiknode.pro/_place_your_key_here/"
# blockchain id, for etheruem is 1 for example, 11155111 is for Sepolia Testnet Ethereum
export BLOCKCHAINCODE=11155111
# the RPC endpoint of your substrate chain
export SUBSTRATECHAIN="wss://testnet.bitgreen.org"
# the address of the ERC20 token to validate
export TOKENADDRESS="0xef632af93FF9cEDc7c40069861b67c13b31aeb8E"
# the wallet that should received the payment of the the token above
export WALLETADDRESS="0x78A4C8624Ba26dD5fEC90a8Dc9B75B4E3D630035";
# the mnemonic seed of the validator, for example
export MNEMONIC="house leave often price skate embody unlock cave thumb ancient letter amount"
# number of confirmation blocks before to consider valid the payment
export BLOCKSCONFIRMATION=1
# the minimum number of validations required to confirm the payment, it should be as configured in the substrate chain
export MINVALIDATIONS=2
# the ABI for the ERC20, you can change the path eventually
export ABI="/usr/src/payment-gateway/ABI-USDT.json"
# the user enabled to read/write te database paymentgateway
export PGUSER='_place_here_your_username'
# the user password
export PGPASSWORD='_place_here_the_user_password'
# the hostname or ip address where the postgres database is reachable, 127.0.0.1 works for postgres in the same machine
export PGHOST='127.0.0.1'
# the database name, you can keep the same or change it
export PGDATABASE='paymentgateway'
```
The validator requires access to the database to find the orderid for the confirmation. The connection to the database should be configured over VPN tunnel for security reasons.  

## Payment Gateway Use
The gateway can be called redirecting to the following url:
```
https://yourdomain.com/?p=USDT&a=100&r=123456&d=test_payment&rp=paid.html&rnp=notpaid.html&o=5HTjwDQet7MagqP9F5ApmjBLUnRa96D91PBiAToj41xExXox
```
where the parameters are the following:  
- p = currency, actually supported USDT and USDC. Payment by card are done in USD. 
- a = amount to pay in the selected currency.  
- r = reference id or better the order id from dex of. You can pass multiple orderid separatig them by comma, for example r=12,13,14,15 (max 256 bytes)
- d = description, is the description of what you are paying for.  
- rp = url to show once the payment is done. Mandatory field required for card payments.  
- rnp = url to show in case of dropping the payment. Mandatory field required for card payments. 
- o = origin address that should match the order id (reference id), it's requested for security to avoid injection.
- v = "modal" for modal view, defaul is full view.  
Optionally, the details of the products in purchase can be shown with the following parameter:
```
dp=[{"id":"001","desc":"product 001","qnt":1,"price":100.00,"currency":"USDT"},{"id":"002","desc":"product 002","qnt":2,"price":150.00,"currency":"USDT"}]
```
## Payment Status
You can get the payment status calling the endpoint:  
```
https://yourdomain.com/paymentstatus?referenceid=xxx
```
where referenceid is the reference id passed in the payment request.  
You will get an answer in json like the following one:  
```
{"answer":"OK","status":"completed"}
```
The status can have the following values:  
- pending
- validating
- failed
- completed

Where "pending" means that we are waiting for the payment, "validating" is that the payment has been received but not yet fully validated, "failed" means that a payment attempt has failed and "completed" means that the payment has been done and accepted.  

## Gateway Status  
You can check the payment gateway status by calling the following endpoint:  
```
https://yourdomain.com/paymentgatewaystatus
```
You will get an answer as follows:  
```
{"status":"OK"}
```
or in case of something not working:  
```
{"status":"KO"}
```

## Encrypted Configuration
For enhanced security, you can  the configuration completely encrypted on disk.
To configuration ahs to be prepare in json files:  
- payment-gateway.env.json
- payment-validator.env.json
- payment-gateway-webhook.env.json
See the examples in this repo for the format.
Encrypt the configuration using the following commands:  
```bash
node encrypte-file.js filename
```
for example:
```bash
node encrypte-file.js payment-gateway.env.json
```
Please insert a strong password and at the confirmation, a new encrypted file ".enc. will be created.  
The file shall be "exported" as ENCRYPTEDCONF, for example:  
```bash
export ENCRYPTEDCONF="payment-gateway.env.json.enc"
node /usr/src/payment-gateway/payment-gateway.js
```
the same procedure is applicable to the following services:  
- payment-gateway.js
- payment-gateway-webhook-server.js
- payment-validator.js
