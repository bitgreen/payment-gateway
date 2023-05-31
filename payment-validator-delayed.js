// Validator program ffor the confirmation in the queue
const Web3 = require('web3');
const fs = require('fs');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { Client } = require('pg');
// read environment variables
const TOKENADDRESS = process.env.TOKENADDRESS;
if (typeof TOKENADDRESS==='undefined'){
    console.log("TOKENADDRESS variable is not set, please set it for launching the validator. It's the address of the the token to validate");
    process.exit();
}
const ABI = process.env.ABI;
if (typeof ABI==='undefined'){
    console.log("ABI variable is not set, please set it for launching the validator. It's the file where to read the ABI of the contract");
    process.exit();
}
const ABIJSON=fs.readFileSync(ABI,"ascii");
//console.log("ABIJSON: ",ABIJSON);
const WALLETADDRESS = process.env.WALLETADDRESS;
if (typeof WALLETADDRESS==='undefined'){
    console.log("WALLETADDRESS variable is not set, please set it for launching the validator. It's the address of the the recipient wallet");
    process.exit();
}
const BLOCKCHAIN = process.env.BLOCKCHAIN;
if (typeof BLOCKCHAIN==='undefined'){
    console.log("BLOCKCHAIN variable is not set, please set it for launching the validator");
    process.exit();
}
const BLOCKCHAINCODE = process.env.BLOCKCHAINCODE;
if (typeof BLOCKCHAINCODE==='undefined'){
    console.log("BLOCKCHAINCODE variable is not set, please set it for launching the validator");
    process.exit();
}
const MNEMONIC = process.env.MNEMONIC;
if (typeof MNEMONIC==='undefined'){
    console.log("MNEMONIC variable is not set, please set it for launching the validator");
    process.exit();
}
const SUBSTRATECHAIN = process.env.SUBSTRATECHAIN;
if (typeof SUBSTRATECHAIN=='=undefined'){
    console.log("SUBSTRATECHAIN variable is not set, please set it for launching the validator");
    process.exit();
}
const BLOCKSCONFIRMATION = process.env.BLOCKSCONFIRMATION;
if (typeof BLOCKSCONFIRMATION=='=undefined'){
    console.log("BLOCKSCONFIRMATION variable is not set, please set it for launching the validator");
    process.exit();
}
//console.log(BLOCKCHAIN);
const client = new Client();
// connect EVM blockchain
const web3 = new Web3(BLOCKCHAIN || "ws://localhost:8545");
console.log("Payment Validator Queue Processor v.1.0 - token:", TOKENADDRESS," for wallet: ",WALLETADDRESS);
// execute a main loop for async oeprations
mainloop();
async function mainloop(){
    //connect SUBSTRATE CHAIN
    const wsProvider = new WsProvider(SUBSTRATECHAIN);
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log("Validator Address: ",keys.address);
    // connect to database
     await client.connect();

    // read decimals and symbol
    let contract = new web3.eth.Contract(JSON.parse(ABIJSON), TOKENADDRESS);
    const [decimals, symbol] = await Promise.all([
        contract.methods.decimals().call(),
        contract.methods.symbol().call()
    ]);
    console.log("decimals: ",decimals);
    console.log("symbol: ",symbol);
    // select the records in the queue belonging to the current validator
    let rs;
    try{
        const queryText="SELECT * from validationsqueue where validatoraddress=$1";
        rs=await client.query(queryText, [keys.address]);
    } catch (e) {
        throw e;
    }
    for(i in rs.rows){
        const txhash=rs.rows[i].txhash;
        // check for blocks confirmed on EVM chain
        // fetch current block number
        const lastbn=await web3.eth.getBlockNumber();
        // fetch the blocknumber of the txash
        const tx=await web3.eth.getTransaction(txhash);
        if(tx.blockNumber == null)
            continue;
        // checl for enough confirmations
        if(lastbn-tx.blockNumber>=BLOCKSCONFIRMATION){
            // validate on chain
            validate_payment(rs.rows[i].buyorderid,BLOCKCHAINCODE,txhash,keys,api);
            // remove record from the queue
            try{
                const queryText="delete from validationsqueue where validatoraddress=$1 and txhash=$2";
                rs=await client.query(queryText, [keys.address],txhash);
            } catch (e) {
                throw e;
            }
        }
    }
    //end of program
    process.exit();
            
    
}
// function to submit the transaction to the blockchain
async function validate_payment(orderid,blockchainid,tx,keys,api){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    for(x in ao){
        if(ao[x].length==0)
            continue;
        const validate = api.tx.dex.validateBuyOrder(ao[x],blockchainid,tx);
        // Sign and send the transaction using our account with nonce to consider the queue
        const hash = await validate.signAndSend(keys,{ nonce: -1 });
        console.log("Validation submitted tx: ",hash.toHex());
    }
}
