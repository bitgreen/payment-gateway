#!/bin/bash
export PGUSER='paymentgateway'
export PGPASSWORD='place_your_password_here'
export PGHOST='127.0.0.1'
export PGDATABASE='paymentgateway'
export SUBSTRATE='wss://testnet.bitgreen.org'
node test.js
