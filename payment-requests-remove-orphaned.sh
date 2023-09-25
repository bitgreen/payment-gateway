#!/bin/bash
export PGUSER='paymentgateway'
export PGPASSWORD='place_your_passqword'
export PGHOST='127.0.0.1'
export PGDATABASE='paymentgateway'
cd /usr/src/payment-gateway
node /usr/src/payment-gateway/payment-requests-remove-orphaned.js
