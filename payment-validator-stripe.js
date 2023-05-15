// Validator program for the payment gateway using stripe with "session"
// this program should be executed every  minute from crontab
const fs = require('fs');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const { Client } = require('pg');

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
const stripe = require('stripe')(STRIPEAPIKEY);

console.log("Payment Validator fo Stripe v.1.0");

// execute a main loop for async oeprations
mainloop();
async function mainloop(){
    //connect BITGREEN CHAIN
    const wsProvider = new WsProvider(BITGREENBLOCKCHAIN);
    const api = await ApiPromise.create({ provider: wsProvider });
    const keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log("Validator Address: ",keys.address);
    const client = new Client();
    // connect to database
    await client.connect();
    // check for stripe request in pending status
    let rs;
    try{
        const queryText="SELECT * from striperequests where status='pending'";
        rs=await client.query(queryText, []);
        //console.log(rs);
    } catch (e) {
        throw e;
    }
    // iterate the records founds
    for(r in rs['rows']) {
        const stripeid=rs['rows'][r]['stripeid'];
        const amount=rs['rows'][r]['amount'];
        const referenceid=rs['rows'][r]['referenceid'];
        const status=rs['rows'][r]['status'];
        // get session object from stripe
        const session = await stripe.checkout.sessions.retrieve(stripeid);        
        if(session.status=='expired'){
             try{
                const queryText="update striperequests set status='expired' where stripeid=$1";
                rs=await client.query(queryText, [stripeid]);
                console.log(rs);
            } catch (e) {
                throw e;
            }
        }
        // payment completed
        if(session.status=='complete' && session.payment_status=='paid' && session.amount_total==amount){
            try{
                const queryText="update striperequests set status='completed' where stripeid=$1";
                rs=await client.query(queryText, [stripeid]);
                console.log(rs);
            } catch (e) {
                throw e;
            }
            // validate Bitgreen blockchain
            await validate_payment(referenceid,"0",stripeid,keys,api);
        }
    }
    await client.end();
    await api.disconnect();
    process.exit()
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
	const validate = api.tx.dex.validateBuyOrder(orderid,blockchainid,tx);
	// Sign and send the transaction using our account with nonce to consider the queue
    	const hash = await validate.signAndSend(keys,{ nonce: -1 });
	console.log("Validation submitted tx: ",hash.toHex());
    }
}

