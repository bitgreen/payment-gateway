// unit tests for 
const { Client } = require('pg');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const {Keyring} = require('@polkadot/keyring');
const {BN} =require ('bn.js');


const SUBSTRATE = process.env.SUBSTRATE;
if (typeof SUBSTRATE=='=undefined'){
    console.log("SUBSTRATE variable is not set, please set it for launching the validator");
    process.exit();
}

mainloop();
// main body of the unit tests
async function mainloop(){
    console.log("Connecting to database 'test' with username 'test' and password 'testpwd'...");
    // create client getting connection data from env variables
    const client = new Client();
     //connect
    //await client.connect();
    console.log("Connection to database completed...");
    // connect to testnet
    // connect to the substrate Node:
    console.log("Connecting to the "+SUBSTRATE+"...");
    const wsProvider = new WsProvider(SUBSTRATE);
    const api = await ApiPromise.create({ provider: wsProvider });
    
    // create key ring from "pear art cup mirror skate state engine repair state crouch reopen main"
    // account: 5F6t8QtyXbrYf3kbeYE6TgjQSkjZ2CXK9MqEYmark8QL1jWW
    // for testing on testnet
    const MNEMONIC="pear art cup mirror skate state engine repair state crouch reopen main";
    const keyring = new Keyring();
    const keypair=keyring.createFromUri(MNEMONIC,{ type: 'sr25519'});
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
    /*
      we have a set of projects on testnet to be used for the unit tests:
      projectId : 35
      assetId : 38
      sellOrderId : 54
      Name : unitTest1
      Credits : 1m
      Originator : 5H3R2XduBHH5uXHaJhYQeFqfFzMJct67xTZq9G7QWP5tNxX4

      projectId : 36
      assetId : 37
      sellOrderId : 53
      Name : unitTest2
      Credits : 1m
      Originator : 5H3R2XduBHH5uXHaJhYQeFqfFzMJct67xTZq9G7QWP5tNxX4

      projectId : 37
      assetId : 36
      sellOrderId : 55
      Name : unitTest3
      Credits : 1m
      Originator : 5H3R2XduBHH5uXHaJhYQeFqfFzMJct67xTZq9G7QWP5tNxX4


      projectId : 38
      assetId : 35
      sellOrderId : 56
      Name : unitTest4
      Credits : 1m
      Originator : 5Eex6tNv5eme8GSXK9FcPdgk2e88KS3YqVTXYPdm8LAmX23H

      projectId : 39
      assetId : 34
      sellOrderId : 57
      Name : unitTest5
      Credits : 1m
      Originator : 5Eex6tNv5eme8GSXK9FcPdgk2e88KS3YqVTXYPdm8LAmX23H
    */
    // create a cart of orders in an object
    let cart=[
      {projectId : 35,assetId : 38,sellOrderId: 54,qnt: 2},
      {projectId : 36,assetId : 37,sellOrderId: 53,qnt: 1},
      {projectId : 37,assetId : 36,sellOrderId: 55,qnt: 3},
      {projectId : 38,assetId : 35,sellOrderId: 56,qnt: 5},
      {projectId : 39,assetId : 34,sellOrderId: 57,qnt: 4}
    ];
    //submit the purchase order on dex
    const nonce = await api.rpc.system.accountNextIndex(keypair.address);
    //let hash=await api.tx.dex.createBuyOrder(54,38,1,10).signAndSend(keypair,{ nonce });
    //console.log("hashtx",hash.toHuman());
    
    const txs = [];
    for (let i=0;i<cart.length;i++){
      txs.push(api.tx.dex.createBuyOrder(cart[i].sellOrderId,cart[i].assetId,cart[i].qnt,10));
    }
    console.log(txs);
    // construct the batch and send the transactions
    const r = await api.tx.utility.batch(txs)
    .signAndSend(keypair, { nonce }, ({ status, events = [], dispatchError }) =>  {
      if(dispatchError) {
          // for module errors, we have the section indexed, lookup
          const decoded = api.registry.findMetaError(dispatchError.asModule)
          const { docs, method, section } = decoded

          if(dispatchError.isModule) {
              response = {
                  success: false,
                  status: 'failed',
                  error: section + '.' + method + ' ' + docs.join(' '),
                  data: {
                      section,
                      method
                  }
              }
          } else {
              // Other, CannotLookup, BadOrigin, no extra info
              response = {
                  success: false,
                  status: 'failed',
                  error: dispatchError.toString()
              }
          }
          // returns answer with error
          console.log(response);
          return(repsponse);
      }
      if(status.isInBlock) {
        // returns success
        const answer={
            success: true,
            data: {
                block_hash: status.asInBlock.toHex()
            }
        };
        console.log(answer);
        return(answer);
      }
    }).catch(err => {
        // returns errors in other case
        const answer={
            success: false,
            status: 'failed',
            error: err.message
        };
        console.log(answer);
        return(answer);
    });
    
    //await api.disconnect();
    //await client.end();
    return;   
       
    // book a carbon credit purchase on dex
    // call the api payment
    // make a payment
}

// function to setup the  payment request 
async function setup_payments(){


}

