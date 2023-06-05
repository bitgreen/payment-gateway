# Payment Gateway
A payment gateway to buy assets on a Substrate blockchain paying by ERC20 tokens like USDT, and credit/debit cards. 
It's currently configured to accept payment by USDT on Polygon Network and Ethereum Network.
The solution can enable additional stable coins and different networks with a minor update of the server module adding new contract addresses and chain id.  
The payment by credit card use [https://www.stripe.com](https://www.stripe.com) as card gateway.
The user interface reflect the designs of Bitgreen, you can customised or use as example to integrate in your current UI.

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
You can get a free TLS certificate from [https://certbot.eff.org/](https://certbot.eff.org/)
You should configure an NGINX serve proxy to connect by https.

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

