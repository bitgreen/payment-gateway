#!/bin/bash
# the user enabled to read/write te database paymentgateway
export PGUSER='_place_here_your_username'
# the user password
export PGPASSWORD='_place_here_the_user_password'
# the hostname or ip address where the postgres database is reachable, 127.0.0.1 works for postgres in the same machine
export PGHOST='127.0.0.1'
# the database name, you can keep the same or change it
export PGDATABASE='paymentgateway'
# the RPC end point for the Ethereum network
export ETHEREUMNODE="wss://smart-greatest-orb.ethereum-sepolia.discover.quiknode.pro/place_your_key_here/"
# the RPC end point for Polygon Network
export POLYGONNODE="wss://smart-greatest-orb.ethereum-sepolia.discover.quiknode.pro/place_your_key_here/"
#the RPC end point for your Substrate chain
export SUBSTRATECHAIN="wss://testnet.bitgreen.org"
# the mnemonic see of the account enable to confirm the settlements, for example:
export MNEMONIC="car acoustic blame student motion slam smile huge cost mammal brown flame"
# wallet address where you have received the payments
export WALLETADDRESS="0x3E102dF3eD871628d60D80d97FCBDcBa087f2a02";
# the private key of the wallet above, for eample, repkace with yours
export WALLETPRIVATEKEY="f781842123d522009b8c592682560502f9f03d44c953089138d22f0aba999999"
# the TOKEN address on etheurem network
export ETHUSDTADDRESS="0xef632af93ff9cedc7c40069861b67c13b31aeb8e"
# the TOKEN address on polygon network
export POLYUSDTADDRESS="0xef632af93ff9cedc7c40069861b67c13b31aeb8e"
# set to YES for testnet, or no for mainnet
export TESTNETENABLED="yes"
# the minum amount to trigger a payment
export MINIMUMAMOUNT="100"
# bank fees to charge to the recipent when paid by bank
export BANKTRANSFERFEES="5"
# the ABI of the ERC20 token used for the payment
export ABI="/usr/src/payment-gateway/ABI-USDT.json"
# change the path if you are not using the same
cd /usr/src/payment-gateway
node /usr/src/payment-gateway/payment-gateway-settlement.js

