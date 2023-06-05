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
node /usr/src/payment-gateway/payment-validator.js