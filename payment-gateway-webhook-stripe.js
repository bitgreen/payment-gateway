// This a webhook server that received events from Stripe and vaidate the payments.
// Uses Express to receive webhooks

const fs = require('fs');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { Client } = require('pg');
console.log("Starting.....");
const BITGREENBLOCKCHAIN = process.env.BITGREENBLOCKCHAIN;
if (typeof BITGREENBLOCKCHAIN==='undefined'){
    console.log("BITGREENBLOCKCHAIN variable is not set, please set it for launching the validator");
    process.exit();
}
const MNEMONIC = process.env.MNEMONIC;
if (typeof MNEMONIC==='undefined'){
    console.log("MNEMONIC variable is not set, please set it for launching the validator");
    process.exit();
}
const MNEMONIC2 = process.env.MNEMONIC2;
if (typeof MNEMONIC2==='undefined'){
    console.log("MNEMONIC2 variable is not set, please set it for launching the validator");
    process.exit();
}
const STRIPEAPIKEY = process.env.STRIPEAPIKEY;
if (typeof STRIPEAPIKEY==='undefined'){
    console.log("STRIPEAPIKEY variable is not set, please set it for launching the validator");
    process.exit();
}
const STRIPESIGKEY = process.env.STRIPESIGKEY;
if (typeof STRIPESIGKEY==='undefined'){
    console.log("STRIPESIGKEY variable is not set, please set it for launching the validator");
    process.exit();
}

console.log("Configuring Stripe: ",STRIPEAPIKEY);
const stripe = require('stripe')(STRIPEAPIKEY);

console.log("Setting up Express server");
const express = require('express');
const app=express();

console.log("Payment Validator fo Stripe v.1.0 - Webhooks Server");
// we execute the main loop in an async function
mainloop();

async function mainloop(){
  //connect BITGREEN CHAIN
  const wsProvider = new WsProvider(BITGREENBLOCKCHAIN);
  const api = await ApiPromise.create({ provider: wsProvider });
  const keyring = new Keyring({ type: 'sr25519' });
  let keys=keyring.createFromUri(MNEMONIC);
  console.log("Validator Address: ",keys.address);
  const keyring2 = new Keyring({ type: 'sr25519' });
  let keys2=keyring2.createFromUri(MNEMONIC2);
  console.log("Validator Address: ",keys2.address);
  const client = new Client();
  // connecting to database
  await client.connect();
  // Match the raw body to content type application/json
  app.post('/webhook', express.raw({type: 'application/json'}), async function (request, response) {
    //const event = request.body;
    // verify signature and build the event object in case
    const sig = request.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, STRIPESIGKEY);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('PaymentIntent was successful!');
        // retrieve the event from stripe for security (someone may had submitted a fake one with the correct stripe signature.
        // just additional check with 0 costs to increase the security
        const eventv = await stripe.events.retrieve(event.id);
        const pi = eventv.data.object;      
        // search for the matching payment request
        let rs;
        try{
          const queryText="SELECT * from striperequests where status='pending' and stripeid=$1";
          rs=await client.query(queryText, [pi.id]);
          //console.log(rs);
        } catch (e) {
          throw e;
        }
        //console.log(pi);
        if(typeof rs.rows[0]==='undefined'){
            console.log("ERROR: the payment id has not been found:",pi.id);
            response.json({received: true});
            return;
        }
        // check for currency =usd
         if(pi.currency!='usd'){
             console.log("ERROR: the currency received is wrong, possible hacking attempt");
             response.json({received: true});
             return;
         }                   
        // verify amount
        if((rs.rows[0]['amount']*100)!=pi.amount_received){
            console.log("ERROR: the payment amount does not match the order (1): ",pi.id,rs.rows[0]['amount']*100,pi.amount_received);
            response.json({received: true});
            return;
        }
        // check the amount for matching on chain
         const totorders=await compute_total_order(rs.rows[0]['referenceid'],api);
         if((totorders*100)!=pi.amount_received){
            console.log("ERROR: the payment amount does not match the orders on chain (2): ",totorders,pi.id,rs.rows[0]['amount'],pi.amount_received);
            response.json({received: true});
            return;
        }
        // store the payment received
        await store_orders_paid(rs.rows[0]['referenceid'],api,client,pi.currency,rs.rows[0]['stripeid']);
         
        // validate the payment on bitgreen blockchain
        await validate_payment(rs.rows[0]['referenceid'],"0",rs.rows[0]['stripeid'],keys,keys2,api);
        
        // update the paymentrequest (striperequest table accordingly)
        // TODO
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
async function validate_payment(orderid,blockchainid,tx,keys,keys2,api){
    let ao=[];
    if(orderid.search(",")==-1)
        ao.push(orderid);
    else
        ao=orderid.split(",");
    for(x in ao){
        if(ao[x].length==0)
            continue;
        console.log("ao[x]",ao[x],blockchainid,tx)
	const validate = api.tx.dex.validateBuyOrder(ao[x],blockchainid,tx);
	// Sign and send the transaction using our account with nonce to consider the queue
    	const hash = await validate.signAndSend(keys,{ nonce: -1 });
	console.log("Validation submitted tx: ",hash.toHex());
        console.log("ao[x]",ao[x],blockchainid,tx)	
	 const validate2 = api.tx.dex.validateBuyOrder(ao[x],blockchainid,tx);
         // Sign and send the transaction using our account
         const hash2 = await validate.signAndSend(keys2,{ nonce: -1 });
         console.log("Validation submitted tx: ",hash2.toHex(),"order id: ",orderid);
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
        console.log("ao[x]",ao[x]);
        const d = await api.query.dex.buyOrders(ao[x]);
        const v=d.toHuman();
        //console.log(v);
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

//function to store the orders paid in the database for future settlement
async function store_orders_paid(orderid,api,client,token,stripeid){
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
        console.log("ao[x]",ao[x]);
        const d = await api.query.dex.buyOrders(ao[x]);
        const v=d.toHuman();
        let amount=0.00;
        try {
            const amounts=v.totalAmount.replace(/,/g,"");
            amount=parseFloat(amounts.substring(0,amounts.length-16));
        }catch(e){
            console.log("Compute amount:m",e);
        }
        let fees=0.00;
        try {
            const feess=v.totalFee.replace(/,/g,"");
            fees=parseFloat(amounts.substring(0,fees.length-16));
        }catch(e){
            console.log("Computing fees:",e);
        }
        let selleraddress='';
        let token='';       
        
        const assetid=v.orderId;
        const ai= await api.query.assets.asset(bov.assetId);
        const aiv=ai.toHuman();
        // get last block hash
        const { hash, parentHash } = await api.rpc.chain.getHeader();

        selleraddress=aiv.owner;
        // store the payment data
        try {
              const queryText = 'INSERT INTO paymentsreceived(referenceid,sender,recipient,amount,fees,created_on,selleraddress,token,chainid,paymentid,blockhash) values($1,$2,$3,$4,$5,current_timestamp,$6,$7,$8,$9,$10)';
              await client.query(queryText, [v.orderId,"","",amount,fees,selleraddress,token,0,rs.rows[0]['stripeid'],hash.toHex()]);
        } catch (e) {
                throw e;
        } 
    }
    return(tot);
}
