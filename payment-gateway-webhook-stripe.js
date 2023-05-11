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
        //console.log(rs);
        if(typeof rs.rows[0]==='undefined'){
            console.log("ERROR: the payment id has not been found:",pi.id);
            response.json({received: true});
            return;
        }
        // verify the data event with the stored record to avoid injections
        // verify amount
        // verify referenceid in metadata
        
        // validate the payment on bitgreen blockchain
        // validate Bitgreen blockchain
        await validate_payment(rs.rows[0]['referenceid'],"0",rs.rows[0]['stripeid'],keys,api);
        // update the paymentrequest (striperequest table accordingly)
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
// function to confirm the payment on our blockchain
async function validate_payment(orderid,blockchainid,tx,keys,api){
            const validate = api.tx.dex.validateBuyOrder(orderid,blockchainid,tx);
            // Sign and send the transaction using our account
            const hash = await validate.signAndSend(keys);
            console.log("Validation submitted tx: ",hash.toHex());
}