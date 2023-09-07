#!/bin/bash
export PGUSER='paymentgateway'
export PGPASSWORD='your_password'
export PGHOST='127.0.0.1'
export PGDATABASE='paymentgateway'
export SUBSTRATE='wss://testnet.bitgreen.org'
export EVMPRIVATEKEY='set_a_private_key_for_testing'
export ETHNODE='set_your_node'
node test.js
