#!/bin/bash
export SUBSTRATECHAIN="wss://testnet.bitgreen.org"
#the mnemonic seed of the validator, for example, replace with yours and remember that the validators must have funds to make their own work
export MNEMONIC="mango brass good turtle jar lava ski type unable license multiply wrap"
export MNEMONIC2="wrap doll kit cage van keen deny give ramp tiny mango zero"
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
# this is a key used to sign the confirmation, we are checking that the signature is valid, you can get it from the stripe's dashboard.
export STRIPESIGKEY="_place_here_the signature_key_from_stripe"
# change the path eventually
node /usr/src/payment-gateway/payment-gateway-webhook-stripe.js