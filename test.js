// unit tests for 
const { Client } = require('pg');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const {Keyring} = require('@polkadot/keyring');
const {BN} =require ('bn.js');
const Web3 = require('web3');
const { ETH_DATA_FORMAT, DEFAULT_RETURN_FORMAT } = require("web3");
const fetch = require('node-fetch');
const fs = require('fs');
const SUBSTRATE = process.env.SUBSTRATE;
if (typeof SUBSTRATE=='=undefined'){
    console.log("ERROR: SUBSTRATE variable is not set");
    process.exit();
}
const EVMPRIVATEKEY = process.env.EVMPRIVATEKEY;
if (typeof EVMPRIVATEKEY=='=undefined'){
    console.log("ERROR: EVMPRIVATEKEY variable is not set");
    process.exit();
}
const ETHNODE = process.env.ETHNODE;
if (typeof ETHNODE=='=undefined'){
    console.log("ERROR: ETHNODE variable is not set");
    process.exit();
}
const web3 = new Web3(ETHNODE);
const network='sepolia';
const jsonFile = "test.abi.json";
const parsed=JSON.parse(fs.readFileSync(jsonFile));
const abi = parsed;
//console.log(abi);
//return;
const tokenAddress = "0xef632af93FF9cEDc7c40069861b67c13b31aeb8E";
let nonces=1;

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
    // update nonces
    nonces=await web3.eth.getTransactionCount('0xa188842de5c573aa3ddd924676c2d079c5a75B9c');
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
//    cart=[
//    {projectId : 35,assetId : 38,sellOrderId: 54,qnt: 2}
//    ]; 
    //submit the purchase order on dex
    const nonce = await api.rpc.system.accountNextIndex(keypair.address);
    //let hash=await api.tx.dex.createBuyOrder(54,38,1,10).signAndSend(keypair,{ nonce });
    //console.log("hashtx",hash.toHuman());
    
    const txs = [];
    for (let i=0;i<cart.length;i++){
      txs.push(api.tx.dex.createBuyOrder(cart[i].sellOrderId,cart[i].assetId,cart[i].qnt,100000000000000));
    }
    console.log("Submitting Tx...");
    // construct the batch and send the transactions
    const r = await api.tx.utility.batch(txs)
    .signAndSend(keypair, { nonce }, ({ status, events = [], dispatchError,txHash }) =>  {
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
        console.log("In block:",answer);
        return(answer);
      }
      // get events
      if (status.isFinalized) {
        console.log(`Transaction included at blockHash ${status.asFinalized}`);
        console.log(`Transaction hash ${txHash.toHex()}`);
        // Loop through Vec<EventRecord> to display all events
        events.forEach(({ phase, event: { data, method, section } }) => {
            console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
            //make payment for each order created
            if(section=='dex' && method=='BuyOrderCreated')
              make_payment(`${data}`);                        
        });
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
       
}

// function to setup the  payment request 
async function make_payment(data){
  let d=JSON.parse(data);
  /* data received:
  BuyOrderCreated {
    order_id: OrderId,
    project_id: ProjectIdOf<T>,
    units: AssetBalanceOf<T>,
    assetid: Assetid
    group_id: GroupIdOf<T>,
    price_per_unit: CurrencyBalanceOf<T>,
    fees_paid: CurrencyBalanceOf<T>,
    total_amount: CurrencyBalanceOf<T>,
    seller: T::AccountId,
    buyer: T::AccountId,
  },
  */
  console.log("make_payment - data",d);
  // call api for payment request
  let url='http://localhost:3000/paymentrequest?';
  url=url+'token=USDT';
  url=url+'&referenceid='+d[0];
  url=url+'&sender=0xa188842de5c573aa3ddd924676c2d079c5a75B9c';
  url=url+'&recipient=0x78A4C8624Ba26dD5fEC90a8Dc9B75B4E3D630035';
  url=url+'&originaddress='+d[9];
  url=url+'&chainid=11155111';
  url=url+'&amount='+Number(d[7])/1000;
  console.log("url:",url);
  const response = await fetch(url);
  const answer = await response.text();
  console.log("answer from payment request:",answer);
  const anj=JSON.parse(answer);
  if(anj.answer=='KO'){
    return;
  }
    
  const toAddress='0x78A4C8624Ba26dD5fEC90a8Dc9B75B4E3D630035';
  // create signer from private key
  let signer=web3.eth.accounts.privateKeyToAccount(EVMPRIVATEKEY);
  web3.eth.accounts.wallet.add(signer);
  /*
  // create contracrt object
  const contract = new web3.eth.Contract(abi, tokenAddress, { from: signer.address } )
  // compute amount
  */  
  let a=Number(d[7])*1000;
  console.log("a",a);
  let amount = web3.utils.toHex(a.toString());
  console.log("amount",amount);

 /* 
  // Creating the transaction object
  const tx = {
         from: signer.address,
         to: toAddress,
         value: "0x0",
         data: contract.methods.transfer(toAddress, amount).encodeABI(),
         gas: web3.utils.toHex(5000000),
         nonce: nonces,
         maxPriorityFeePerGas: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
         chainId: 11155111,
         type: 0x2
  };
  nonces=nonces+1;
  signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey)
  console.log("Raw transaction data: " + signedTx.rawTransaction)
 
  // Sending the transaction to the network
  const receipt = await web3.eth
    .sendSignedTransaction(signedTx.rawTransaction)
    .once("transactionHash", (txhash) => {
        console.log(`Mining transaction ...`);
        console.log(`https://${network}.etherscan.io/tx/${txhash}`);
     });
  // The transaction is now on chain!
  console.log(`Mined in block ${receipt.blockNumber}`);
  */  
  
  const contract = new web3.eth.Contract(abi, tokenAddress, { from: signer.address } );
  console.log("Nonce: ",nonces);
  contract.methods.transfer(toAddress, amount).send({
        from: signer.address,
        gas: 5000000,
        nonce:nonces
    }).then( function(tx)
    { 
      console.log(tx);
    }).catch(console.error);
  nonces=nonces+1;
  return;
}

