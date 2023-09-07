#!/bin/bash
export PGUSER='paymentgateway'
export PGPASSWORD='5b65ed8011fde297f00da4e3e42ef'
export PGHOST='127.0.0.1'
export PGDATABASE='paymentgateway'
export SUBSTRATE='wss://testnet.bitgreen.org'
export EVMPRIVATEKEY='set_a_private_key_for_testing'
export ETHNODE='set_your_node'
node test.js
