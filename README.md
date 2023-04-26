# Payment Gateway
This the payment gateway of Bitgreen.
Currently we accept payment by USDT on Polygon Network and Ethereum Network.  
The solution can enable additional stable coins and different networks with a minor update of the server module adding new contract addresses and chain id.  
The payment by credit card is currently under development.  
The user interface reflect the designs approved from the management.  

## Installation
You should install the the libraries with:  
```
npm install
```
## Running the Payment Gateway Server

The server module listen on port 3000 and can be executed settings certain environment variables as from the following example to configure the access to a postgresql server:  
```
#!/bin/bash  
export PGUSER='paymentgateway'  
export PGPASSWORD='xxxxxxxxxxxxx'  
export PGHOST='127.0.0.1'  
export PGDATABASE='paymentgateway'   
cd /usr/src/payment-gateway   
node /usr/src/payment-gateway/payment-gateway.js   
```

the database contains one single table:  
```
  Table "public.paymentrequests"
    Column     |            Type             | Collation | Nullable |        Default        
---------------+-----------------------------+-----------+----------+-----------------------
 referenceid   | character varying(32)       |           | not null | 
 sender        | character varying(50)       |           | not null | 
 recipient     | character varying(50)       |           | not null | 
 amount        | numeric(36,18)              |           | not null | 
 created_on    | timestamp without time zone |           | not null | 
 originaddress | character varying(64)       |           | not null | ''::character varying
 token         | character varying(10)       |           | not null | ''::character varying
 chainid       | integer                     |           | not null | 1
Indexes:
    "paymentrequests_pkey" PRIMARY KEY, btree (referenceid)
```
that can be created with the following SQL statement:  

```
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.paymentrequests (
    referenceid character varying(32) NOT NULL,
    sender character varying(50) NOT NULL,
    recipient character varying(50) NOT NULL,
    amount numeric(36,18) NOT NULL,
    created_on timestamp without time zone NOT NULL,
    originaddress character varying(64) DEFAULT ''::character varying NOT NULL,
    token character varying(10) DEFAULT ''::character varying NOT NULL,
    chainid integer DEFAULT 1 NOT NULL
);
ALTER TABLE public.paymentrequests OWNER TO postgres;
ALTER TABLE ONLY public.paymentrequests ADD CONSTRAINT paymentrequests_pkey PRIMARY KEY (referenceid);
GRANT ALL ON TABLE public.paymentrequests TO paymentgateway;
```

You should configure an NGINX serve proxy to connect by https.

## Running the Validator Server  

The validators server listen for payment on the blockchain and submit the approval to the Bitgreen Parachain.  
For security, we should have >1 validator running from differnet machine and looking to different nodes for each network.  
You can run the validator settings certain variables like in this example:  
```
#!/bin/bash
export BLOCKCHAIN="wss://smart-greatest-orb.ethereum-sepolia.discover.quiknode.pro/3ef1aecf950aa22a84b41f924493f721644ca05d/"
export BLOCKCHAINCODE=11155111
export BITGREENBLOCKCHAIN="wss://testnet.bitgreen.org"
export TOKENADDRESS="0xef632af93FF9cEDc7c40069861b67c13b31aeb8E"
export WALLETADDRESS="0x78A4C8624Ba26dD5fEC90a8Dc9B75B4E3D630035";
export MNEMONIC="whip leave often price skate embody unlock cave thumb ancient letter car"
export ABI="/usr/src/payment-gateway/ABI-USDT.json"
export PGUSER='paymentgateway'
export PGPASSWORD='xxxxxxxx'
export PGHOST='127.0.0.1'
export PGDATABASE='paymentgateway'
node /usr/src/payment-gateway/payment-validator.js
```
The validator requires access to the database to find the orderid for the confirmation. The connection to the database should be configured over VPN tunnel for security reasons.  

## Integration in the Market Place
The gateway can be called redirecting to the following url:
```
https://pay.bitgreen.org/?p=USDT&a=100&r=123456&d=test_payment&rp=paid.html&rnp=notpaid.html&o=5HTjwDQet7MagqP9F5ApmjBLUnRa96D91PBiAToj41xExXox
```
where the parameters are the following:  
- p = currency, actually supported USDT and USDC.  
- a = amount to pay in the selected currency.  
- r = reference id or better the order id from dex of.  
- d = description, is the description of what you are paying for.  
- rp = url to show once the payment is done.  (not yet active).  
- rnp = url to show in case of dropping the payment. (not yet active).  
- o = origin address that should match the order id (reference id), it's requested for security to avoid injection.
Optionally, the details of the products in purchase can be shown with the following parameter:
```
dp=[{"id":"001","desc":"product 001","qnt":1,"price":100.00,"currency":"USDT"},{"id":"002","desc":"product 002","qnt":2,"price":150.00,"currency":"USDT"}]
```

