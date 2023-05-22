// program to pay the sellers for the orders that have been paid
const { Client } = require('pg');
const Web3 = require('web3');
const fs = require('fs');
const stripe = require('stripe')('sk_test_51MDq0VKluWo1Xbjw9dB5xdWgGUulDA6ckewLKyz4wdQee6yrxX5QhhJ5oblHgWhVApt2VDOlHH0JxARlaimxnC5s00Laa66Evw');

console.log("Payment Gateway Settlement 1.0 - Starting");
// get environment variables
const ETHEREUMNODE = process.env.ETHEREUMNODE;
if (typeof ETHEREUMNODE==='undefined'){
    console.log("ETHEREUMNODE variable is not set, please set it for launching the validator");
    process.exit();
}
const POLYGONNODE = process.env.POLYGONNODE;
if (typeof POLYGONNODE==='undefined'){
    console.log("POLYGONNODE variable is not set, please set it for launching the validator");
    process.exit();
}
const ETHUSDTADDRESS = process.env.ETHUSDTADDRESS;
if (typeof ETHUSDTADDRESS==='undefined'){
    console.log("ETHUSDTADDRESS variable is not set, please set it for launching the validator");
    process.exit();
}
const POLYUSDTADDRESS = process.env.POLYUSDTADDRESS;
if (typeof POLYUSDTADDRESS==='undefined'){
    console.log("POLYUSDTADDRESS variable is not set, please set it for launching the validator");
    process.exit();
}
const WALLETADDRESS = process.env.WALLETADDRESS;
if (typeof WALLETADDRESS==='undefined'){
    console.log("WALLETADDRESS variable is not set, please set it for launching the validator");
    process.exit();
}
const WALLETPRIVATEKEY = process.env.WALLETPRIVATEKEY;
if (typeof WALLETPRIVATEKEY==='undefined'){
    console.log("WALLETPRIVATEKEY variable is not set, please set it for launching the validator");
    process.exit();
}
const ABI = process.env.ABI;
if (typeof ABI==='undefined'){
    console.log("ABI variable is not set, please set it for launching the validator. It's the file where to read the ABI of the contract");
    process.exit();
}
const ABIJSON=fs.readFileSync(ABI,"ascii");

const TESTNETENABLED = process.env.TESTNETENABLED;
if (typeof TESTNETENABLED==='undefined'){
    console.log("TESTNETENABLED variable is not set, please set it for launching the validator");
    process.exit();
}
const MINIMUMAMOUNT = process.env.MINIMUMAMOUNT;
if (typeof MINIMUMAMOUNT==='undefined'){
    console.log("MINIMUMAMOUNT variable is not set, please set it for launching the validator");
    process.exit();
}
// connect Ethereum/Polygon node
console.log("Connecting Ethereum Node");
const web3 = new Web3(ETHEREUMNODE);
console.log("Connecting Polygon Node");
const web3p= new Web3(POLYGONNODE);
console.log("Processing Settlements");
const client = new Client();
mainloop();
async function mainloop(){
    // connect to the database posttgres
    await client.connect();
    let rs;
    try {
        let queryText='';
        if(TESTNETENABLED=="yes")
          queryText="SELECT * from paymentsreceived where settled_on is NULL order by selleraddress  desc";
        else
          queryText="SELECT * from paymentsreceived where settled_on is NULL and (chainid==0 or chainid==1 or chainid=137) order by selleraddress  desc";
        rs=await client.query(queryText,[]);
        if(rs['rowCount']==0){
            console.log("No payments to settle");
            return;
        }
        //console.log(rs);
    } catch (e) {
        throw e;
    }
    // iterates the records found
    let seller='';
    let totamount=0.0;
    let totfees=0.0;
    let orders=[];
    for (i in rs.rows){
        console.log(rs.rows[i]);
        r=rs.rows[i];
        // TODO check data on chain to protect from possible injection in the database
        if (r['selleraddress']!=seller){
            //settlement for the current seller
            if(seller!=''){
                console.log("Payment of: ",totamount-totfees," to: ",seller, " for: ",orders);
                if((totamount-totfees)>parseFloat(MINIMUMAMOUNT))
                    await make_payment(seller,(totamount-totfees),orders,client);
                else
                    console.log("Under the minimum amount for payment");
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
        console.log(totamount,totfees);
    }
    // execute the payment for the last seller
    if(seller!=''){
        console.log("Payment of: ",totamount,"fees: ",totfees," to: ",seller, " for: ",orders);
        if((totamount-totfees)>parseFloat(MINIMUMAMOUNT))
            await make_payment(seller,(totamount-totfees),orders,client);
        else
         console.log("Under the minimum amount for payment");
    }
    client.end();
        
}

// function to make payment
async function make_payment(selleraddress,amount,orders){
    // TODO, fetch the payment method and coordinates
    // use static data for testing for now
    //---
    let paymentmethod='ethusdt';
    let recipient="0x8cD6F362F061B97EACb9252b820a8Acecd7e3229"
    //---
    let tokenaddress='';
    let web3l;
    let chainid=0;
    if(paymentmethod=="stripe"){
        //send payment from stripe account to recipient
        try{
            const transfer = await stripe.transfers.create({
                amount: amount,
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
    //TODO decrease the amount of the gas fees
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
   console.log(txObj);
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
               }
           });
       }
   });




    
    // bank transfer by Stripe
    // update settlement data on the database
    // write settlement data on chain
    return;
}
// TODOverify liquidity available and consolidate if necessary
