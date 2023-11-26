// This a webhook server that received events from Stripe and vaidate the payments.
// Uses Express to receive webhooks
const fs = require('fs');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { Client } = require('pg');
const { BigNumber } = require('bignumber.js')
// add crypto module
const  {decrypt_symmetric} = require('./modules/cryptobitgreen.js');
const { Buffer } = require('node:buffer');
const { readFileSync } = require('node:fs');
const prompt = require('prompt-sync')();
//global vars
let SUBSTRATECHAIN;
let MNEMONIC;
let MNEMONIC2;
let STRIPEAPIKEY;
let STRIPESIGKEY;
let PGUSER;
let PGPASSWORD;
let PGHOST;
let PGDATABASE;
let stripe;

// we execute the main loop in an async function
mainloop();

// main loop body
async function mainloop() {
  console.log("Starting.....");
  const ENCRYPTEDCONF=process.env.ENCRYPTEDCONF;
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
        SUBSTRATECHAIN = conf.SUBSTRATECHAIN;
        if (typeof SUBSTRATECHAIN==='undefined'){
        console.log("SUBSTRATECHAIN variable is not set, please set it");
            process.exit();
        }
        MNEMONIC = conf.MNEMONIC;
        if (typeof MNEMONIC==='undefined'){
            console.log("MNEMONIC variable is not set, please set it");
            process.exit();
        }
        MNEMONIC2 = conf.MNEMONIC2;
        if (typeof MNEMONIC2==='undefined'){
            console.log("MNEMONIC2 variable is not set, please set it");
            process.exit();
        }
        STRIPEAPIKEY = conf.STRIPEAPIKEY;
        if (typeof STRIPEAPIKEY==='undefined'){
            console.log("STRIPEAPIKEY variable is not set, please set it");
            process.exit();
        }
        STRIPESIGKEY = conf.STRIPESIGKEY;
        if (typeof STRIPESIGKEY==='undefined'){
            console.log("STRIPESIGKEY variable is not set, please set it");
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
        SUBSTRATECHAIN = process.env.SUBSTRATECHAIN;
        if (typeof SUBSTRATECHAIN==='undefined'){
        console.log("SUBSTRATECHAIN variable is not set, please set it");
            process.exit();
        }
        MNEMONIC = process.env.MNEMONIC;
        if (typeof MNEMONIC==='undefined'){
            console.log("MNEMONIC variable is not set, please set it");
            process.exit();
        }
        MNEMONIC2 = process.env.MNEMONIC2;
        if (typeof MNEMONIC2==='undefined'){
            console.log("MNEMONIC2 variable is not set, please set it");
            process.exit();
        }
        STRIPEAPIKEY = process.env.STRIPEAPIKEY;
        if (typeof STRIPEAPIKEY==='undefined'){
            console.log("STRIPEAPIKEY variable is not set, please set it");
            process.exit();
        }
        STRIPESIGKEY = process.env.STRIPESIGKEY;
        if (typeof STRIPESIGKEY==='undefined'){
            console.log("STRIPESIGKEY variable is not set, please set it");
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
  // create stripe object
  stripe = require('stripe')(STRIPEAPIKEY);
  // setup express server
  console.log("Setting up Express server");
  const express = require('express');
  const app=express();
  console.log("Payment Validator fo Stripe v.1.01 - Webhooks Server");

  //connect BITGREEN CHAIN
  const wsProvider = new WsProvider(SUBSTRATECHAIN);
  const api = await ApiPromise.create({ provider: wsProvider });
  const keyring = new Keyring({ type: 'sr25519' });
  let keys=keyring.createFromUri(MNEMONIC);
  console.log("Validator Address: ",keys.address);
  const keyring2 = new Keyring({ type: 'sr25519' });
  let keys2=keyring2.createFromUri(MNEMONIC2);
  console.log("Validator Address: ",keys2.address);
  // Match the raw body to content type application/json
  app.post('/webhook', express.raw({type: 'application/json'}), async function (request, response) {
    //const event = request.body;
    // verify signature and build the event object in case
    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, STRIPESIGKEY);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      console.log("100 - ERROR",err.message);
      return;
    }
    // Handle the event
    switch (event.type) {
      case 'payment_intent.payment_failed':
          intent = event.data.object;
          const message = intent.last_payment_error && intent.last_payment_error.message;
          console.log('Payment Failed:', intent.id, message);
          let clientf=await opendb();
          try{
              const queryText="update striperequests set status='failed',statusmessage=$1 where stripeid=$2";
              await clientf.query(queryText, [message,intent.id]);
          } catch (e) {
              console.log("101 - ERROR",e);
              response.json({received: true});
              await clientf.end();
              return;  
          }
          await clientf.end();
          return;
        case 'payment_intent.succeeded':
        console.log('PaymentIntent was successful!');
        // retrieve the event from stripe for security (someone may had submitted a fake one with the correct stripe signature.
        // just additional check with 0 costs to increase the security
        const eventv = await stripe.events.retrieve(event.id);
        //TODO: check "livemode" should be true (now we accept from sandbox)
        const pi = eventv.data.object;      
        let client=await opendb();
        // search for the matching payment request
        let rs;
        try{

          const queryText="SELECT * from striperequests where stripeid=$1";
          rs=await client.query(queryText, [pi.id]);
          //console.log(rs);
        } catch (e) {
          console.log("101 - ERROR",e);
          response.json({received: true});
          await client.end();
          return;  
        }
        //console.log(pi);
        if(typeof rs.rows[0]==='undefined'){
            console.log("102 - ERROR: the payment id has not been found:",pi.id);
            await client.end();
            return;
        }
        // check for currency =usd
         if(pi.currency!='usd'){
             console.log("103 - ERROR: the currency received is wrong, possible hacking attempt");
             response.json({received: true});
             await client.end();
             return;
         }                   
        
        // verify amount
        if((rs.rows[0]['amount']*100).toFixed()!=pi.amount_received){
            console.log("104 - ERROR: the payment amount does not match the order (1): ",pi.id,(rs.rows[0]['amount']*100).toFixed(),pi.amount_received);
            response.json({received: true});
            await client.end();
            return;
        }
        // check the amount for matching on chain
         const totorders= await compute_total_order(rs.rows[0]['referenceid'],api);
         const total_with_fee = new BigNumber(totorders).times(0.029).plus(0.3).multipliedBy(100)
            console.log('total_with_fee', total_with_fee.toFixed())
            console.log('pi.amount_received', pi.amount_received)
         if(total_with_fee.toFixed()!=pi.amount_received){
            console.log("105 - ERROR: the payment amount does not match the orders on chain (2): ",(totorders*100).toFixed(),pi.id,rs.rows[0]['amount'],pi.amount_received);
            response.json({received: true});
            await client.end();
            return;
        }
        // update status on striperequests
         const queryUpdate="update striperequests set status='completed',statusmessage='' where stripeid=$1";
         await client.query(queryUpdate, [pi.id]);
        // delete previous striperequest for the same referenceid
        const queryUpdatep="delete from striperequests where referenceid=$1 and  status='pending'";
        await client.query(queryUpdatep, [rs.rows[0]['referenceid']]);


        // store the payment received
        await store_orders_paid(rs.rows[0]['referenceid'],api,client,pi.currency,rs.rows[0]['stripeid'],client);
         
        // validate the payment on bitgreen blockchain
        await validate_payment(rs.rows[0]['referenceid'],"0",rs.rows[0]['stripeid'],keys,keys2,api,event);
        //close db connection
        await client.end();        
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached to a Customer!');
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.json({received: true});
  });

  app.listen(4242, () => console.log('Webhook listening  on port 4242 '));
}
// function to submit the transaction to the blockchain
async function validate_payment(orderid,blockchainid,tx,keys,keys2,api,event){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    for(x of ao){
        if(x.length==0)
            continue;
        console.log("x",x,blockchainid,tx)

	// Sign and send the transaction using our account with nonce to consider the queue
	try{
            const validate = api.tx.dex.validateBuyOrder(x,blockchainid,tx);
            const hash = await validate.signAndSend(keys,{ nonce: -1 });
            console.log("Validation submitted tx: ",hash.toHex());
	}catch(e){
	    console.log("105 - ERROR",e);
	    return;
	}
	//
	let eventv;
	// query back stripe for the same transaction and make a second confirmation
	try{
            eventv = await stripe.events.retrieve(event.id);
        }catch(e){
            console.log("106 - ERROR",e);
            return;
        }
        if(event.id==eventv.id){
            try{
                const validate2 = api.tx.dex.validateBuyOrder(x,blockchainid,tx);
                // Sign and send the transaction using our account
                const hash2 = await validate2.signAndSend(keys2,{ nonce: -1 });
                console.log("Validation submitted tx: ",hash2.toHex(),"order id: ",orderid);
            } catch(e){
                 console.log("107 - ERROR",e);
                 return;
            }
        }else {
            console.log("Second confirmation failed");
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
    for(x of ao){
        if(x.length==0)
            continue;
        let v;
        try{
            const d = await api.query.dex.buyOrders(x);
            v=d.toHuman();
        }catch(e){
            console.log("108 - ERROR",e);
            return;
        }
        //console.log(v);
        let amount=0.00;
        try {
            const amounts=v.totalAmount.replace(/,/g,"");
            amount=parseFloat(amounts.substring(0,amounts.length-16));
        }catch(e){
            console.log("109 - ERROR",e);
            continue;
        }
       // console.log(amount);
        tot=tot+amount/100;        
    }
    return(tot);
}

//function to store the orders paid in the database for future settlement
async function store_orders_paid(orderid,api,client,token,stripeid,client){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    //console.log(ao);
    let tot=0.0;
    for(x of ao){
        if(x.length==0)
            continue;
        let v;
        try{
            const d = await api.query.dex.buyOrders(x);
            v=d.toHuman();
        }catch(e){
            console.log("110 - ERROR",e);
            return;
        }
        let amount=0.00;
        try {
            const amounts=v.totalAmount.replace(/,/g,"");
            amount=parseFloat(amounts.substring(0,amounts.length-16));
        }catch(e){
            console.log("111 - ERROR",e);
        }
        let fees=0.00;
        try {
            const feess=v.totalFee.replace(/,/g,"");
            fees=parseFloat(feess.substring(0,feess.length-16));
        }catch(e){
            console.log("112 - ERROR",e);
        }
        let selleraddress='';
        let token='';       
        
        const assetid=v.assetId;
        console.log("assetid: ",assetid);
        const ai= await api.query.assets.asset(assetid);
        const aiv=ai.toHuman();
        // get last block hash
        let header;
        try{
            header = await api.rpc.chain.getHeader();
        }catch(e){
            console.log("113 - ERROR",e);
            return;
        }
        selleraddress=aiv.owner;
        // store the payment data
        try {
              const queryText = 'INSERT INTO paymentsreceived(referenceid,sender,recipient,amount,fees,created_on,selleraddress,token,chainid,paymentid,blockhash,nrvalidation,minvalidation) values($1,$2,$3,$4,$5,current_timestamp,$6,$7,$8,$9,$10,1,1)';
              await client.query(queryText, [v.orderId,"","",amount,fees,selleraddress,token,0,stripeid,header.hash.toHex()]);
        } catch (e) {
              console.log("114 - ERROR",e);
              return;
        } 
    }
    return(tot);
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