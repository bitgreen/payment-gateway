#!/bin/bash
# the user enabled to read/write te database paymentgateway
export PGUSER='_place_here_your_username'
# the user password
export PGPASSWORD='_place_here_the_user_password'
# the hostname or ip address where the postgres database is reachable, 127.0.0.1 works for postgres in the same machine
export PGHOST='127.0.0.1'
# the database name, you can keep the same or change it
export PGDATABASE='paymentgateway'
# the RPC endpoint for the substrate chain.
export SUBSTRATE='wss://testnet.bitgreen.org'
# the API key from www.stripe.com
export STRIPEAPIKEY="_place_here_your_stripe_key"
# the monitoring server
export MONITORSERVER="https://monitor.bitgreen.org"
# the ip address of the payment gateway
export PAYMENTGATEWAYIP="167.235.78.132"
# the ip addresses of the validators"
export PAYMENTVALIDATORS="167.235.78.132,167.235.78.132,167.235.78.132"
# the apii key of the monitoring system
export MONITORAPIKEY=""
#Change to your folder eventually
cd /usr/src/payment-gateway
# change the path if you are not using the same
node /usr/src/payment-gateway/payment-gateway.js

