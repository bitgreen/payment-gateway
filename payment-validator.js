// Validator program for the payment gateway
const Web3 = require('web3');
const fs = require('fs');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { Client } = require('pg');
const BigNumber = require("bignumber.js");


// GLOBAL VARIABLES
let BLOCKCHAIN;
let BLOCKCHAINCODE;
let SUBSTRATECHAIN;
let MNEMONIC;
let BLOCKSCONFIRMATION;
let MINVALIDATIONS;
let TOKENADDRESS;
let ABI;
let ABIJSON;
let WALLETADDRESS;
let PGUSER;
let PGPASSWORD;
let PGHOST;
let PGDATABASE;
let api;
// execute a main loop for async oeprations
mainloop();
async function mainloop(){
    const ENCRYPTEDCONF = process.env.ENCRYPTEDCONF;
    if (typeof ENCRYPTEDCONF!=='undefined'){
        let fc;
        // read file
        try {
             fc=readFileSync(ENCRYPTEDCONF);
        }catch(e){
            console.log("ERROR reading file",ENCRYPTEDCONF,e);
            return;
        }
        let pwd=prompt("Password to decrypt the configuration:",{echo: ''});
        //decrypt
        let cleartextuint8= await decrypt_symmetric(fc,pwd);
        if(cleartextuint8==false){
            console.log("ERROR: decryption failed, password may be wrong");
            return;
        }
        let cleartext = Buffer.from(cleartextuint8).toString();
        const conf=JSON.parse(cleartext);
        //load the variables from the decrypted json
        TOKENADDRESS = conf.TOKENADDRESS;
        if (typeof TOKENADDRESS==='undefined'){
            console.log("TOKENADDRESS variable is not set, please set it for launching the validator. It's the address of the the token to validate");
            process.exit();
        }
        ABI = conf.ABI;
        if (typeof ABI==='undefined'){
            console.log("ABI variable is not set, please set it for launching the validator. It's the file where to read the ABI of the contract");
            process.exit();
        }
        ABIJSON=fs.readFileSync(ABI,"ascii");
        WALLETADDRESS = conf.WALLETADDRESS;
        if (typeof WALLETADDRESS==='undefined'){
            console.log("WALLETADDRESS variable is not set, please set it for launching the validator. It's the address of the the recipient wallet");
            process.exit();
        }
        BLOCKCHAIN = conf.BLOCKCHAIN;
        if (typeof BLOCKCHAIN==='undefined'){
            console.log("BLOCKCHAIN variable is not set, please set it for launching the validator");
            process.exit();
        }
        BLOCKCHAINCODE = conf.BLOCKCHAINCODE;
        if (typeof BLOCKCHAINCODE==='undefined'){
            console.log("BLOCKCHAINCODE variable is not set, please set it for launching the validator");
            process.exit();
        }
        MNEMONIC = conf.MNEMONIC;
        if (typeof MNEMONIC==='undefined'){
            console.log("MNEMONIC variable is not set, please set it for launching the validator");
            process.exit();
        }
        SUBSTRATECHAIN = conf.SUBSTRATECHAIN;
        if (typeof SUBSTRATECHAIN=='=undefined'){
            console.log("SUBSTRATECHAIN variable is not set, please set it for launching the validator");
            process.exit();
        }
        BLOCKSCONFIRMATION = conf.BLOCKSCONFIRMATION;
        if (typeof BLOCKSCONFIRMATION=='=undefined'){
            console.log("BLOCKSCONFIRMATION variable is not set, please set it for launching the validator");
            process.exit();
        }
        MINVALIDATIONS = conf.MINVALIDATIONS;
        if (typeof MINVALIDATIONS=='=undefined'){
            console.log("MINVALIDATIONS variable is not set, please set it for launching the validator");
            process.exit();
        }
        //database vars
        PGUSER = conf.PGUSER;
        if (typeof PGUSER==='undefined'){
            console.log("PGUSER variable is not set, please set it");
            process.exit();
        }
        PGPASSWORD = conf.PGPASSWORD;
        if (typeof PGPASSWORD==='undefined'){
            console.log("PGPASSWORD variable is not set, please set it");
            process.exit();
        }
        PGHOST = conf.PGHOST;
        if (typeof PGHOST==='undefined'){
            console.log("PGHOST variable is not set, please set it");
            process.exit();
        }
        PGDATABASE = conf.PGDATABASE;
        if (typeof PGDATABASE==='undefined'){
            console.log("PGDATABASE variable is not set, please set it");
            process.exit();
        }
        
    } else {
        //if the encryption configuration is not available, try to load the configuration from from env variables
        TOKENADDRESS = process.env.TOKENADDRESS;
        if (typeof TOKENADDRESS==='undefined'){
            console.log("TOKENADDRESS variable is not set, please set it for launching the validator. It's the address of the the token to validate");
            process.exit();
        }
        ABI = process.env.ABI;
        if (typeof ABI==='undefined'){
            console.log("ABI variable is not set, please set it for launching the validator. It's the file where to read the ABI of the contract");
            process.exit();
        }
        ABIJSON=fs.readFileSync(ABI,"ascii");
        WALLETADDRESS = process.env.WALLETADDRESS;
        if (typeof WALLETADDRESS==='undefined'){
            console.log("WALLETADDRESS variable is not set, please set it for launching the validator. It's the address of the the recipient wallet");
            process.exit();
        }
        BLOCKCHAIN = process.env.BLOCKCHAIN;
        if (typeof BLOCKCHAIN==='undefined'){
            console.log("BLOCKCHAIN variable is not set, please set it for launching the validator");
            process.exit();
        }
        BLOCKCHAINCODE = process.env.BLOCKCHAINCODE;
        if (typeof BLOCKCHAINCODE==='undefined'){
            console.log("BLOCKCHAINCODE variable is not set, please set it for launching the validator");
            process.exit();
        }
        MNEMONIC = process.env.MNEMONIC;
        if (typeof MNEMONIC==='undefined'){
            console.log("MNEMONIC variable is not set, please set it for launching the validator");
            process.exit();
        }
        SUBSTRATECHAIN = process.env.SUBSTRATECHAIN;
        if (typeof SUBSTRATECHAIN=='=undefined'){
            console.log("SUBSTRATECHAIN variable is not set, please set it for launching the validator");
            process.exit();
        }
        BLOCKSCONFIRMATION = process.env.BLOCKSCONFIRMATION;
        if (typeof BLOCKSCONFIRMATION=='=undefined'){
            console.log("BLOCKSCONFIRMATION variable is not set, please set it for launching the validator");
            process.exit();
        }
        MINVALIDATIONS = process.env.MINVALIDATIONS;
        if (typeof MINVALIDATIONS=='=undefined'){
            console.log("MINVALIDATIONS variable is not set, please set it for launching the validator");
            process.exit();
        }
        //database vars
        PGUSER = process.env.PGUSER;
        if (typeof PGUSER==='undefined'){
            console.log("PGUSER variable is not set, please set it");
            process.exit();
        }
        PGPASSWORD = process.env.PGPASSWORD;
        if (typeof PGPASSWORD==='undefined'){
            console.log("PGPASSWORD variable is not set, please set it");
            process.exit();
        }
        PGHOST = process.env.PGHOST;
        if (typeof PGHOST==='undefined'){
            console.log("PGHOST variable is not set, please set it");
            process.exit();
        }
        PGDATABASE = process.env.PGDATABASE;
        if (typeof PGDATABASE==='undefined'){
            console.log("PGDATABASE variable is not set, please set it");
            process.exit();
        }

    }
    // connect EVM blockchain
    const web3 = new Web3(BLOCKCHAIN || "ws://localhost:8545");
    console.log("Payment Validator v.1.01 - Listening for new events on token ", TOKENADDRESS," for wallet: ",WALLETADDRESS);
    //connect BITGREEN CHAIN
    const wsProvider = new WsProvider(SUBSTRATECHAIN);
    api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log("Validator Address: ",keys.address);
    // read decimals
    //let ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}];
    let contract = new web3.eth.Contract(JSON.parse(ABIJSON), TOKENADDRESS);
    const [decimals, symbol] = await Promise.all([
        contract.methods.decimals().call(),
        contract.methods.symbol().call()
    ]);
    console.log("decimals: ",decimals);
    console.log("symbol: ",symbol);
    //subscribe to events to token address
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
        console.log("tx hash: ",event['transactionHash']);
        let transaction = web3.eth.abi.decodeLog(abi,event.data,[event.topics[1], event.topics[2], event.topics[3]]);
        console.log("******************************************");
        //console.log("transaction:",transaction);
        console.log("### from:",transaction['from']," to: ",transaction['to']," value: ",transaction['value']);
        let rs;
        if(transaction['to']==WALLETADDRESS) {
            console.log("#######################################");
            console.log("PAYMENT RECEIVED");
            console.log("#######################################");
            // get orderid
            let orderid=1;
            let amount=0;
            let client;
            //connect to the db
            try {
                client=await opendb();
            }catch(e){	
             console.log("100 - ERROR",e);
             return;
            }
            try {
                const queryText="SELECT * from paymentrequests where sender=$1 and recipient=$2 and amount=$3 and chainid=$4";
                amount=new BigNumber(transaction['value']).dividedBy(1000000).toFixed();
                rs=await client.query(queryText, [transaction['from'],transaction['to'],amount,BLOCKCHAINCODE]);
                if(rs['rowCount']==0){
                    console.log("101 - ERROR referenceid not found");
                    await client.end();
                    return;
                }
            } catch (e) {
                console.log("102 - ERROR",e);
                await client.end();
                return;
            }
            // check the amount for matching on chain 
            const totorders=await compute_total_order(rs.rows[0]['referenceid'],api);
            if(totorders > new BigNumber(transaction['value']).dividedBy(1000000).toNumber()){
                console.log("103 - ERROR the payment amount does not matcht the orders on chain: ",(new BigNumber(transaction['value']).dividedBy(1000000).toFixed()),totorders);
                await client.end();
                return;
             }
             //manafe multiple orders paid in one shot
             let orderidv=rs.rows[0]['referenceid'];
             let ao=[];
             if(orderidv.search(",")==-1)
                ao.push(orderidv);
            else
                ao=orderidv.split(",");
            for(orderid of ao){
                // store payment data in the local database
                let fees=0.0;
                let selleraddress='';
                let token='USDT';
                let bov;
                try {
                    console.log("Check Buy Orders",orderid);
                    const bo = await api.query.dex.buyOrders(orderid);
                    bov=bo.toHuman();
                    console.log("bov:",bov);
                }catch(e){
                    console.log("103 - ERROR",e);
                    await client.end();
                    return;
                }
                fees=Number(new BigNumber(bov.totalFee.replace(",","").dividedBy(1000)));
                const assetid=bov.orderId;
                console.log("Check assetid:",assetid);
                const ai= await api.query.assets.asset(bov.assetId);
                const aiv=ai.toHuman();
                console.log("ai:",ai);
                let header;
                try{
                    // get last block hash
                    header = await api.rpc.chain.getHeader();
                }catch(e){
                    console.log("104 - ERROR",e);
                    await client.end();
                    return;
                }
                let sellerorderv;
                try{
                    //selleraddress=aiv.owner;
                    console.log("check sellerord");
                    const sellerorder=await api.query.dex.orders(bov.orderId);
                    sellerorderv=sellerorder.toHuman();
                    console.log("sellerorderv",sellerorderv);
                }catch(e){
                    console.log("105 - ERROR",e);
                    await client.end();
                    return;
                }
            
                selleraddress=sellerorderv.owner;
                console.log("***************************************");
                console.log("Seller address:",selleraddress);
                console.log("***************************************");
                try{
                    await client.query('BEGIN WORK');
                    await client.query('LOCK TABLE paymentsreceived');
                    // check for existing records
                    let upd=false;
                    const queryText="SELECT * from paymentsreceived where referenceid=$1";
                    let rp=await client.query(queryText, [orderid]);
                    if(rp['rowCount']!=0)
                        upd=true;
                    if(upd==false){
                        // store the payment data
                        const queryText = 'INSERT INTO paymentsreceived(referenceid,sender,recipient,amount,fees,created_on,selleraddress,token,chainid,paymentid,blockhash,nrvalidation,minvalidation) values($1,$2,$3,$4,$5,current_timestamp,$6,$7,$8,$9,$10,1,$11)';
                        let av=[orderid,rs.rows[0]['sender'],rs.rows[0]['recipient'],amount,fees,selleraddress,token,BLOCKCHAINCODE,event['transactionHash'],header.hash.toHex(),MINVALIDATIONS];
                        await client.query(queryText,av );
                    }else{
                       //update the validation counter
                       const queryText = 'update paymentsreceived set nrvalidation=nrvalidation+1 where referenceid=$1';
                       await client.query(queryText, [orderid]);
                    }
                    // delete payment requests matching the payment
                    await client.query("delete from paymentrequests where referenceid=$1",[orderid]);
                    await client.query('COMMIT WORK');            
                }catch(e){
                    console.log("106 - ERROR",e);
                    await client.end();
                    return;
                }
            }
            //validate orders on Substrate
            validate_payment(rs['rows'][0]['referenceid'],BLOCKCHAINCODE,event['transactionHash'],keys,client);
            await client.end();
            return;
            
        }
    }

    });
}
// function to submit the transaction to the blockchain
async function validate_payment(orderid,blockchainid,tx,keys,client){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    for(x of ao){
        if(x.length==0)
            continue;
        if(BLOCKSCONFIRMATION>1){
            //store in the queue
            try {
              const queryText = 'INSERT INTO validationsqueue(validatoraddress,buyorderid,txhash,chainid) values($1,$2,$3,$4)';
              await client.query(queryText, [keys.address,x,tx,blockchainid]);
            } catch (e) {
                console.log("107 - ERROR",e);
                await client.end();
                return;
            } 
        }else{
                try{
                    console.log("Validating order");
                    const validate = api.tx.dex.validateBuyOrder(x,blockchainid,tx);
                    // Sign and send the transaction using our account with nonce to consider the queue
                    const hash = await validate.signAndSend(keys,{ nonce: -1 });
                    console.log("Validation submitted tx: ",hash.toHex());
                }catch(e){
                    console.log("108 - ERROR",e);
                    await client.end();
                    return;
                }
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
    console.log("orders to check:",ao);
    let tot= new BigNumber(0);
    for(x of ao){
        if(x.length==0)
            continue;
        let v;
        try{
            const d = await api.query.dex.buyOrders(x);
            v=d.toHuman();
        }catch(e){
            console.log("109 - ERROR",e);
            continue;
        }
        let amount= new BigNumber(0);
        try {
            const amounts=v.totalAmount.replace(/,/g,"");
            if(amounts.length>16)
                amount=new BigNumber(amounts.substring(0,amounts.length-16));
            else {
                amount=new BigNumber(amounts).dividedBy(10);
            }
        }catch(e){
            console.log(e);
            continue;
        }
        console.log("total order from chain: ",amount);
        tot=tot.plus(amount.dividedBy(100));
    }
    return(Number(tot.toFixed(2)));
}
// function to open db and return client
async function opendb(){
        let client = new Client({
            host: PGHOST,
            database: PGDATABASE,
            user: PGUSER,
            password: PGPASSWORD,
        });
        await client.connect();
        return(client);
}
