// program to pay the sellers for the orders that have been paid
const { Client } = require('pg');
const Web3 = require('web3');
const fs = require('fs');
const stripe = require('stripe')('sk_test_51MDq0VKluWo1Xbjw9dB5xdWgGUulDA6ckewLKyz4wdQee6yrxX5QhhJ5oblHgWhVApt2VDOlHH0JxARlaimxnC5s00Laa66Evw');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');

console.log("Payment Gateway Settlement 1.0 - Starting");
// get environment variables
const ETHEREUMNODE = process.env.ETHEREUMNODE;
if (typeof ETHEREUMNODE==='undefined'){
    console.log("ETHEREUMNODE variable is not set, please set it ");
    process.exit();
}
const POLYGONNODE = process.env.POLYGONNODE;
if (typeof POLYGONNODE==='undefined'){
    console.log("POLYGONNODE variable is not set, please set it ");
    process.exit();
}
const ETHEREUMTESTNODE = process.env.ETHEREUMTESTNODE;
if (typeof ETHEREUMTESTNODE==='undefined'){
    console.log("ETHEREUMTESNODE variable is not set, please set it ");
    process.exit();
}
const ETHUSDTADDRESS = process.env.ETHUSDTADDRESS;
if (typeof ETHUSDTADDRESS==='undefined'){
    console.log("ETHUSDTADDRESS variable is not set, please set it ");
    process.exit();
}
const ETHTESTUSDTADDRESS = process.env.ETHTESTUSDTADDRESS;
if (typeof ETHTESTUSDTADDRESS==='undefined'){
    console.log("ETHTESTUSDTADDRESS variable is not set, please set it ");
    process.exit();
}
const POLYUSDTADDRESS = process.env.POLYUSDTADDRESS;
if (typeof POLYUSDTADDRESS==='undefined'){
    console.log("POLYUSDTADDRESS variable is not set, please set it ");
    process.exit();
}
const WALLETADDRESS = process.env.WALLETADDRESS;
if (typeof WALLETADDRESS==='undefined'){
    console.log("WALLETADDRESS variable is not set, please set it ");
    process.exit();
}
const WALLETPRIVATEKEY = process.env.WALLETPRIVATEKEY;
if (typeof WALLETPRIVATEKEY==='undefined'){
    console.log("WALLETPRIVATEKEY variable is not set, please set it ");
    process.exit();
}
const ABI = process.env.ABI;
if (typeof ABI==='undefined'){
    console.log("ABI variable is not set, please set it . It's the file where to read the ABI of the contract");
    process.exit();
}
const ABIJSON=fs.readFileSync(ABI,"ascii");

const TESTNETENABLED = process.env.TESTNETENABLED;
if (typeof TESTNETENABLED==='undefined'){
    console.log("TESTNETENABLED variable is not set, please set it ");
    process.exit();
}
const MINIMUMAMOUNT = process.env.MINIMUMAMOUNT;
if (typeof MINIMUMAMOUNT==='undefined'){
    console.log("MINIMUMAMOUNT variable is not set, please set it ");
    process.exit();
}
const BANKTRANSFERFEES = process.env.BANKTRANSFERFEES;
if (typeof BANKTRANSFERFEES==='undefined'){
    console.log("BANKTRANSFERFEES variable is not set, please set it ");
    process.exit();
}
const SUBSTRATECHAIN = process.env.SUBSTRATECHAIN;
if (typeof SUBSTRATECHAIN=='=undefined'){
    console.log("SUBSTRATECHAIN variable is not set, please set it ");
    process.exit();
}
const MNEMONIC = process.env.MNEMONIC;
if (typeof MNEMONIC==='undefined'){
    console.log("MNEMONIC variable is not set, please set it ");
    process.exit();
}
const DRYRUN = process.env.DRYRUN;
if (typeof DRYRUN=='undefined'){
    console.log("DRYRUN variable is not set, please set it ");
    process.exit();
}

// connect Ethereum/Polygon node
console.log("Connecting Ethereum Node");
const web3 = new Web3(ETHEREUMNODE);
console.log("Connecting Ethereum TESTNode");
const web3t = new Web3(ETHEREUMTESTNODE);
console.log("Connecting Polygon Node");
const web3p= new Web3(POLYGONNODE);
console.log("Processing Settlements");
const client = new Client();
// global prices vars
let ETHPRICE=0.0;
let MATICPRICE=0.0;

mainloop();
async function mainloop(){
     //connect BITGREEN CHAIN
    const wsProvider = new WsProvider(SUBSTRATECHAIN);
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log("Payment Executor Address: ",keys.address);
    // get current values of Etherum and Matic
    let response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    let responsej = await response.json();
    console.log("eth price: ",responsej['ethereum']['usd']);
    ETHPRICE=responsej['ethereum']['usd'];
    
    response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
    responsej = await response.json();
    console.log("matic price: ",responsej['matic-network']['usd']);
    MATICPRICE=responsej['matic-network']['usd'];
    if(ETHPRICE<=0){
        throw("Eth price is not available");
    }
    if(MATICPRICE<=0){
        throw("Matic price is not available");
    }

    // connect to the database postgres
    await client.connect();
    let rs;
    try {
        let queryText='';
        // process the records based on the chinid
        if(TESTNETENABLED=="yes"){
          queryText="SELECT * from paymentsreceived where settled_on is null and chainid=11155111 and nrvalidation>=minvalidation  order by selleraddress  desc";
        }
        else{
          queryText="SELECT * from paymentsreceived where settled_on is null and (chainid==0 or chainid==1 or chainid=137)  and nrvalidation>=minvalidation order by selleraddress  desc";
        }
        //console.log(queryText);
        rs=await client.query(queryText,[]);
        if(rs['rowCount']==0){
            console.log("No payments to settle");
            return;
        }
        //console.log(rs);
    } catch (e) {
        throw e;
    }
    // verify the data on blockchain before proceeding with the settlement
    console.log("Verifing data on the blockchain and stripe....");
    for (let i in rs.rows){
       let wb3;
       let contractaddress;
       //ignore stripe payment
       if(rs.rows[i].chainid==0){
        //TODO check stripeusing API
        continue;
       }
       // for ethereum
       if(rs.rows[i].chainid==1){
           wb3=web3;
           contractaddress=ETHUSDTADDRESS;
       }
       // for polygon
       if(rs.rows[i].chainid==137){
          wb3=web3p;
          contractaddress=POLYUSDTADDRESS;
       }
       // for Ethereum testnet sepolia
       if(rs.rows[i].chainid==11155111){
          wb3=web3t;      
          contractaddress=ETHTESTUSDTADDRESS;
       }
       //ignore the record in case of wrong chain
       if(typeof wb3 =='undefined')
          continue;
       // query the hash on chain to compare the data sender,recipient,amount, erc20 address
       //console.log("rs.rows[i].paymentid",rs.rows[i].paymentid);
       let tx= await wb3.eth.getTransaction(rs.rows[i].paymentid);
       //console.log("tx",tx);
       //decode data
       const erc20TransferABI = [{
        type: "address",
        name: "receiver"
        },{
         type: "uint256",
        name: "amount"
        }];
        const decoded = web3.eth.abi.decodeParameters(erc20TransferABI,tx.input.slice(10));
        //console.log("decoded",decoded);
        const amountpaid=decoded[1];
        const recipient=decoded[0];
        // verify amount
        if(Number(amountpaid)/1000000!=rs.rows[i].amount){
           let e="The amount on chain is different from the amount in the database";
           throw(e);
        }
        if(recipient!=rs.rows[i].recipient){
           let e="The recipient on chain is different from the one on the database";
           throw(e);
        }
    }
    console.log("Verificaton on chain passed...");
    // end verification data on chain
    
    // iterates the records found
    let seller='';
    let totamount=0.0;
    let totfees=0.0;
    let orders=[];
    for (let i in rs.rows){
        //console.log(rs.rows[i]);
        r=rs.rows[i];
        
        if (r['selleraddress']!=seller){
            //settlement for the current seller
            if(seller!=''){
                console.log("*******************************************************************");
                console.log("Payment of: ",totamount-totfees,"from total orders:",totamount,"fees: ",totfees," to: ",seller, " for: ",orders);
                console.log("*******************************************************************");
                if((totamount-totfees)>parseFloat(MINIMUMAMOUNT))
                    await make_payment(seller,(totamount-totfees),orders,client,api,keys);
                else{
                    console.log("##############################################################");
                    console.log("Payment of: ",totamount-totfees,"from total orders:",totamount,"fees: ",totfees," to: ",seller, " for: ",orders);
                    console.log("Under the minimum amount for payment");
                    console.log("##############################################################");
                }
            }
            // continue to next seller
            seller=r['selleraddress'];
            totamount=0.0;
            totfees=0.0;
            orders=[];
        }
        totamount=totamount+parseFloat(r['amount']);
        totfees=totfees+parseFloat(r['fees']);
        orders.push(r['referenceid']);
        //console.log("Totamount:",totamount,"totfees",totfees);
    }
    // execute the payment for the last seller
    if(seller!=''){
        console.log("*******************************************************************");
        console.log("Payment of: ",totamount-totfees,"from total orders:",totamount,"fees: ",totfees," to: ",seller, " for: ",orders);
        console.log("*******************************************************************");
        if((totamount-totfees)>parseFloat(MINIMUMAMOUNT))
            await make_payment(seller,(totamount-totfees),orders,client,api,keys);
        else {
            console.log("Under the minimum amount for payment");
            console.log("##############################################################");
        }

    }
    client.end();
        
}

// function to make payment
async function make_payment(selleraddress,amount,orders,client,api,keys){
    // fetch the payment method and coordinates
    console.log("selleraddress",selleraddress);
    let preferences= await api.query.dex.sellerPayoutPreferences(selleraddress);
    if(preferences.toHex()=='0x'){
        console.log("No payment preference set for: ",selleraddress);
        return;
    }
    console.log("preferences:", preferences.toHuman());
    return;
    //chainId:u32
    //recipientAddress: BoundedVec<u8, MaxAddressLen>
    //---
    let paymentmethod='';
    if(preferences.chainId==1)
      paymentmethod='ethusdt';
    if(preferences.chainId==137)
      paymentmethod='polyusdt';
     if(preferences.chainId==0)
      paymentmethod='bank';
      if(paymentmethod==''){
        console.log("No payment method found for: ",selleraddress);
        return;
     }
     if(typeof preferences.recipientAddress== 'undefined' && preferences.chainId!=0){
        console.log("No destinationa ddress has been found for: ",selleraddress);
        return;
     }
    let recipient=preferences.recipientAddress;
    console.log("Make Payment  for: ",selleraddress,"to: ",recipient,"paymentmethod:",paymentmethod);
    //---
    let tokenaddress='';
    let web3l;
    let chainid=0;
    if(paymentmethod=="stripe"){
        //send payment from stripe account to recipient
        try{
            const transfer = await stripe.transfers.create({
                amount: (amount-BANKTRANSFERFEES),
                currency: "usd",
                destination: recipient,});
        } catch(e){
            console.log(e);
            return;
        }
        for(i in orders){
            console.log("Updating order: ",orders[i]);
            try {
                const queryText="update paymentsreceived set settled_on=NOW(),settled_amount=amount-fees,settled_chainid=$1,settled_paymentid=$2 where referenceid=$3";
                console.log(queryText);
                console.log([chainid,transfer.id,orders[i]]);
                await client.query(queryText,[chainid,res,orders[i]]);
            } catch (e) {
                throw e;
            }
        }
        // update bitgreen blockchain
        const validate = api.tx.dex.recordPaymentToSeller(orders,0,seller,(amount-BANKTRANSFERFEES),transfer.id);
        // Sign and send the transaction using our account with nonce to consider the queue
        const hash = await validate.signAndSend(keys,{ nonce: -1 });
        console.log("Validation submitted tx: ",hash.toHex());
    }
    if(paymentmethod=='ethusdt'){
        tokenAddress=ETHUSDTADDRESS;
        web3l=web3;
        chainid=1;
   }
   if(paymentmethod=='polyusdt'){
        tokenAddress=POLYUSDTADDRESS;        
        web3l=web3p;
        chainid=137;
    }
    // transfer USDT
    // create contract object    
    let contract = new web3l.eth.Contract(JSON.parse(ABIJSON), tokenAddress, { from: WALLETADDRESS });
    //convert amount in hex
    amount=amount*1000000; // 6 decimals
    let amounthex = web3l.utils.toHex(amount); 
    console.log(amount,amounthex);
    //encode data
    let data = contract.methods.transfer(recipient, amounthex).encodeABI();
    // create tx object
    let txObj = {
       gas: web3l.utils.toHex(100000),
       "to": tokenAddress,
       "value": "0x00",
       "data": data,
       "from": WALLETADDRESS
   };
   // estimate gas cost
   const gasPrice = web3.eth.getGasPrice(); // estimate the gas price
   const gasLimit = web3.eth.estimateGas(txObj); // fetch gas limit for the tx
   const transactionFee = gasPrice * gasLimit;  // tx fees in native coin Eth/Matic
   // rebuild data and txObj based on the reduced amount and gas limits
   if(paymentmethod=='ethusdt')
       cp=ETHPRICE;
   if(paymentmethod=='polyusdt')
       cp=MATICPRICE;
   const txfeesusdt=transactionFee/1000000000000*cp;
   console.log("tx fees in usdt: ",txfeesusdt," tx fees: ",transactionFee);
   amount=amount-txfeesusdt;
   amounthex = web3l.utils.toHex(amount);
   data = contract.methods.transfer(recipient, amounthex).encodeABI();
   txObj = {
       gas: web3l.utils.toHex(gasLimit),
       "to": tokenAddress,
       "value": "0x00",
       "data": data,
       "from": WALLETADDRESS
   };
   //   return;
   //sign and send the tx
   web3l.eth.accounts.signTransaction(txObj, WALLETPRIVATEKEY, async (err, signedTx) => {
       if (err) {
           console.log(err);
       } else {
           console.log(signedTx)
           return  await web3l.eth.sendSignedTransaction(signedTx.rawTransaction, async (err, res) => {
               if (err) {
                   console.log(err)
               } else {
                   console.log("Transaction has been submitted with txhash:",res);
                   // update database with settlement data
                   for(i in orders){
                     console.log("Updating order: ",orders[i]);
                     try {
                         const queryText="update paymentsreceived set settled_on=NOW(),settled_amount=amount-fees,settled_chainid=$1,settled_paymentid=$2 where referenceid=$3";
                         console.log(queryText);
                         console.log([chainid,res,orders[i]]);
                         await client.query(queryText,[chainid,res,orders[i]]);
                     } catch (e) {
                         throw e;
                     }
                   }
                   const validate = api.tx.dex.recordPaymentToSeller(orders,chainid,recipient,amount,res);
                   // Sign and send the transaction using our account with nonce to consider the queue
                   const hash = await validate.signAndSend(keys,{ nonce: -1 });
                   console.log("Validation submitted tx: ",hash.toHex());
               }
           });
       }
   });
   // TODO write settlement data on chain

   return;
}
// TODOverify liquidity available and consolidate if necessary
