// unit tests for 
const { Client } = require('pg');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const {Keyring} = require('@polkadot/keyring');
const {BN} =require ('bn.js');


mainloop();
// main body of the unit tests
async function mainloop(){
    console.log("Connecting to database 'test' with username 'test' and password 'testpwd'...");
    // create client
    const client = new Client({
       user: 'test',
       host: '127.0.0.1',
       database: 'test',
       password: 'testpwd',
     });
     //connect
    await client.connect();
    console.log("Connection to database completed...");
    // connect to testnet
    // connect to the substrate Node:
    console.log("Connecting to the testnet.bitgreen.org...");
    const wsProvider = new WsProvider("wss://testnet.bitgreen.org");
    const api = await ApiPromise.create({ provider: wsProvider });
    
    // create key ring from "pear art cup mirror skate state engine repair state crouch reopen main"
    // account: 5F6t8QtyXbrYf3kbeYE6TgjQSkjZ2CXK9MqEYmark8QL1jWW
    // for testing on testnet
    const MNEMONIC="pear art cup mirror skate state engine repair state crouch reopen main";
    const keyring = new Keyring();
    const keypair=keyring.createFromUri(MNEMONIC);
    console.log("Created testing account:",keypair.address);
    // check balance of testing account
    const account = await api.query.system.account(keypair.address);
    console.log("Balance of testing account "+keypair.address+" :",account.data.free.toHuman());
    // check for at the least 1 BBB available in the account
    const minDeposit = new BN('1000000000000000000');
    if (account.data.free.lt(minDeposit)) {
      console.log("Please top up some BBB on testnet for the account: ",keypair.address);
      await api.disconnect();
      await client.end();
      return;
    }
    console.log("Testing account has funds..(OK)");
    await api.disconnect();
    await client.end();
    return;   
       
    // book a carbon credit purchase on dex
    // call the api payment
    // make a payment
    
    
      
}