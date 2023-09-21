#!/bin/bash
export ENCRYPTEDCONF="payment-gateway.env.json.enc"
cd /usr/src/payment-gateway
node /usr/src/payment-gateway/payment-gateway.js

