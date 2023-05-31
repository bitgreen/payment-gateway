// Validator program for the payment gateway
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
console.log("Payment Validator v.1.0 - Listening for new events on token ", TOKENADDRESS," for wallet: ",WALLETADDRESS);
// execute a main loop for async oeprations
mainloop();
async function mainloop(){
    //connect BITGREEN CHAIN
    const wsProvider = new WsProvider(SUBSTRATECHAIN);
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log("Validator Address: ",keys.address);
    // connect to database
     await client.connect();

    // read decimals
    //let ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}];
    let contract = new web3.eth.Contract(JSON.parse(ABIJSON), TOKENADDRESS);
    const [decimals, symbol] = await Promise.all([
        contract.methods.decimals().call(),
        contract.methods.symbol().call()
    ]);
    console.log("decimals: ",decimals);
    console.log("symbol: ",symbol);
    var subscription = web3.eth.subscribe('logs', {
        address: TOKENADDRESS,
        topics: [web3.utils.sha3('Transfer(address,address,uint256)')]}
        , function(error, result){
        if (error)
            console.log(error);
    }).on("data", async function(event){
    if (event.topics.length == 3) {
        const abi= [{
            type: 'address',
            name: 'from',
            indexed: true
        }, {
            type: 'address',
            name: 'to',
            indexed: true
        }, {
            type: 'uint256',
            name: 'value',
            indexed: false
        }];
        //console.log("tx hash: ",event['transactionHash']);
        let transaction = web3.eth.abi.decodeLog(abi,event.data,[event.topics[1], event.topics[2], event.topics[3]]);
        console.log("******************************************");
        //console.log(transaction);
        console.log("### from:",transaction['from']," to: ",transaction['to']," value: ",transaction['value']);
        let rs;
        if(transaction['to']==WALLETADDRESS) {
            console.log("#######################################");
            console.log("PAYMENT RECEIVED");
            console.log("#######################################");
            // get orderid
            let orderid=1;
            let amount=0;
            try {
                const queryText="SELECT * from paymentrequests where sender=$1 and recipient=$2 and amount=$3 and chainid=$4";
                console.log(queryText);
                amount=transaction['value']/1000000;
                console.log([transaction['from'],transaction['to'],amount,BLOCKCHAINCODE]);
                rs=await client.query(queryText, [transaction['from'],transaction['to'],amount,BLOCKCHAINCODE]);
                console.log(rs);
                if(rs['rowCount']==0){
                    console.log("ERROR - referenceid not found");
                    return;
                }
                //console.log(rs);
            } catch (e) {
                throw e;
            }
            console.log(rs.rows[0]['referenceid']);
            // check the amount for matching on chain 
            const totorders=await compute_total_order(rs.rows[0]['referenceid'],api);
            if(totorders!=(transaction['value']/1000000)){
                console.log("ERROR: the payment amount does not matcht the orders on chain: ",(transaction['value']/1000000),totorders);
                return;
             }
            /* 
            // store payment data in the local database
            let fees=0.0;
            let selleraddress='';
            let token='USDT';
            //console.log(rs.rows[0]);        
            const bo = await api.query.dex.buyOrders(rs.rows[0]['referenceid']);
            const bov=bo.toHuman();
            //console.log(bov);
            fees=bov.totalFee;
            const assetid=bov.orderId;
            const ai= await api.query.assets.asset(bov.assetId);
            const aiv=ai.toHuman();
            // get last block hash
            const { hash, parentHash } = await api.rpc.chain.getHeader();
            selleraddress=aiv.owner;
            // store the payment data
            try {
              const queryText = 'INSERT INTO paymentsreceived(referenceid,sender,recipient,amount,fees,created_on,selleraddress,token,chainid,paymentid,blockhash) values($1,$2,$3,$4,$5,current_timestamp,$6,$7,$8,$9,$10)';
              await client.query(queryText, [rs.rows[0]['referenceid'],rs.rows[0]['sender'],rs.rows[0]['recipient'],amount,fees,selleraddress,token,BLOCKCHAINCODE,event['transactionHash'],hash.toHex()]);
            } catch (e) {
                throw e;
            } 
            */
            //validate orders on Substrate
            validate_payment(rs['rows'][0]['referenceid'],BLOCKCHAINCODE,event['transactionHash'],keys,api);
            
        }
    }

    });
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
        if(BLOCKSCONFIRMATION>1){
            //store in the queue
            try {
              const queryText = 'INSERT INTO validationsqueue(validatoraddress,buyorderid,txhash,chainid) values($1,$2,$3,$4)';
              await client.query(queryText, [keys.address,orderid,tx,blockchainid]);
            } catch (e) {
                throw e;
            } 
        }else{
        	const validate = api.tx.dex.validateBuyOrder(ao[x],blockchainid,tx);
        	// Sign and send the transaction using our account with nonce to consider the queue
        	const hash = await validate.signAndSend(keys,{ nonce: -1 });
        	console.log("Validation submitted tx: ",hash.toHex());
        }
    }
}
// function to compute the total amount to pay
async function compute_total_order(orderid,api){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    //console.log(ao);
    let tot=0.0;
    for(x in ao){
        if(ao[x].length==0)
            continue;
        const d = await api.query.dex.buyOrders(ao[x]);
        const v=d.toHuman();
        console.log(v);
        let amount=0.00;
        try {
            const amounts=v.totalAmount.replace(/,/g,"");
            amount=parseFloat(amounts.substring(0,amounts.length-16));
        }catch(e){
            console.log(e);
            continue;
        }
       // console.log(amount);
        tot=tot+amount/100;        
    }
    return(tot);
}
