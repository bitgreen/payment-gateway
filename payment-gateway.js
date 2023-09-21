// Payment Gateway Server
// Address from  USDT
// https://tether.to/en/supported-protocols
// Example:
// https://pay.bitgreen.org?p=USDTP&a=100&r=123456&d=test_payment&rp=paid.html&rnp=notpaid.html
const express = require('express');
const  fs = require('fs');
const { Client } = require('pg')
// add crypto module
const  {decrypt_symmetric} = require('./modules/cryptobitgreen.js');
const { Buffer } = require('node:buffer');
const { readFileSync } = require('node:fs');
const prompt = require('prompt-sync')();
// global vars
let STRIPEAPIKEY;
let SUBSTRATE;
let SSL_CERT;
let SSL_KEY;
let PGUSER;
let PGPASSWORD;
let PGHOST;
let PGDATABASE;

// call the main async function 
mainloop();

// main loop to use async functions
async function mainloop(){
    // check for encryped configuration
    const ENCRYPTEDCONF= process.env.ENCRYPTEDCONF;
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
        STRIPEAPIKEY = conf.STRIPEAPIKEY;
        if (typeof STRIPEAPIKEY==='undefined'){
            console.log("STRIPEAPIKEY variable is not set, please set it for launching the validator");
            process.exit();
        }
        SUBSTRATE = conf.SUBSTRATE;
        if (typeof SUBSTRATE=='=undefined'){
            console.log("SUBSTRATE variable is not set, please set it for launching the validator");
            process.exit();
        }
        SSL_CERT = conf.SSL_CERT;
        SSL_KEY = conf.SSL_KEY;
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
        return;
    }
    //load parameters from environment variables if configuration is not encrypted
    else{
        STRIPEAPIKEY = process.env.STRIPEAPIKEY;
        if (typeof STRIPEAPIKEY==='undefined'){
            console.log("STRIPEAPIKEY variable is not set, please set it for launching the validator");
            process.exit();
        }
        // read environment variables
        SUBSTRATE = process.env.SUBSTRATE;
        if (typeof SUBSTRATE=='=undefined'){
            console.log("SUBSTRATE variable is not set, please set it for launching the validator");
            process.exit();
        }
        SSL_CERT = process.env.SSL_CERT;
        SSL_KEY = process.env.SSL_KEY;
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
    // create strip object
    const stripe = require('stripe')(STRIPEAPIKEY);
    // Polkadot.js to connect to the Substrate chain
    const { ApiPromise, WsProvider } = require('@polkadot/api');
    // rate limit middleware
    const rateLimit = require('express-rate-limit');
    // setup the web server based on "express"
    let app = express();
    // configure the rate limit
    const rateLimitsUser = rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hrs in milliseconds
      max: 1000,
      message: 'You have exceeded the 1000 requests in 24 hrs limit!', 
      standardHeaders: true,
      legacyHeaders: false,
    });
    // show banner 
    console.log("Payment Gateway 1.01 - Starting");
    console.log("[INFO] Listening for connections");
    // configure the connection to the Postgresql DB
    const client = new Client({
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
    });
    // we make the connection inside the api calls since the postgres drops the connection when unused for some time
    
    // connect to the substrate Node:
    const wsProvider = new WsProvider(SUBSTRATE);
    const api = await ApiPromise.create({ provider: wsProvider });    
    
    // manage the API on express server
    app.get('/', async function (req, res) {
        let p=req.query.p;
        let a=req.query.a;
        let r=req.query.r;
        let rp=req.query.rp;
        let rnp=req.query.rnp;
        let d=req.query.d;
        let o=req.query.o;
        let dp=req.query.dp;
        let v=req.query.v;
        // p is the payment method: 
        // r is the referenceid
        // rp is the url to redirect for successfully payment
        // rnp is the url to redirect for failed payment
        // d is the description of the purchase
        // o is the origin address on the substrate chain
        if(typeof p === 'undefined'){
            res.send("ERROR - parameter p (payment method), is missing");
            return;
        }
        if(p != 'USDT' && p!="USDC"){
            res.send("ERROR - payment method (p) is wrong. it should be USDT or USDC");
            return;
        }
        if(typeof r === 'undefined'){
            res.send("ERROR - parameter r (reference id), is missing");
            return;
        }
        if(typeof d === 'undefined'){
            res.send("ERROR - parameter d (description), is missing");
            return;
        }
        if(typeof o === 'undefined'){
            res.send("ERROR - parameter o (origin address on substrate chain), is missing");
            return;
        }
        if(typeof rp === 'undefined'){
            res.send("ERROR - parameter rp (redirect page for successfully payment) is missing");
            return;
        }
        if(typeof rnp === 'undefined'){
            res.send("ERROR - parameter rnp (redirect page for failed payment) is missing");
            return;
        }
        if(rp.substring(0,8)!='https://'){
            res.send("ERROR - parameter rp (redirect page for successfully payment) must start with https://");
            return;
        }
        if(rnp.substring(0,8)!='https://'){
            res.send("ERROR - parameter rnp (redirect page for failed payment) must start with https://");
            return;
        }
        if(typeof dp === 'undefined'){
            dp="[]";
        }
        if(typeof v === 'undefined'){
            v="fullview";
        }
        if(typeof p!== 'undefined'){
            res.cookie('p', p);
            res.cookie('a',a);
            res.cookie('r',r);
            res.cookie('rp',rp);
            res.cookie('rnp',rnp);
            res.cookie('d',d);
            res.cookie('o',o);
            res.cookie('dp',dp);
            res.cookie('v',v);
            // get url from Stripe
            let stripesession;
            try{
                stripesession = await stripe.checkout.sessions.create({
                line_items: [
                  {
                    price_data: {
                    currency: 'usd',
                    product_data: {name: d,},unit_amount: a*100,},quantity: 1,},],
                    //metadata: {"id":r},
                    mode: 'payment',
                    success_url: rp,
                    cancel_url: rnp,
                    client_reference_id: r,
                });
            } catch(e){
                console.log(e);
                res.send("100 - Error connecting to payment gateway");
                return;
            }
            res.cookie('stu',stripesession.url);
            // store stripe id
            // check for the same referenceid already present
            const status="pending";
            try {
              const queryText = 'INSERT INTO striperequests(stripeid,referenceid,amount,created_on,status) values($1,$2,$3,current_timestamp,$4)';
              await client.connect();
              await client.query(queryText, [stripesession.id,r,a,status]);
              await client.end();
            } catch (e) {
                console.log(e);
                res.send("101 - Error storing payment request");
                return;
            }
            //USDT or USDT
            if(p=='USDC' || p=='USDT'){
                if(v=="modal")
                    res.send(read_file("html/usdstablemodal.html"));
                else
                    res.send(read_file("html/usdstable.html"));                
            }
        }
        // sending index.html
        if(p===undefined){
            let v="";
            try{
                v=read_file("html/index.html");    
            }catch(e){
                res.send("102 - Error index.html not found");
                console.log(e);
                return;
            }
            res.send(v);
        }
    });
    // function to generate a payment intent and store it
    app.get('/stripe/',async function (req, res) {
        let a=req.query.a;
        let r=req.query.r;
        let d=req.query.d;
        if(typeof r==='undefined'){
            res.json({error: "ERROR: The reference id is missing, please use parameter r"});
            return;
        }
        if(typeof a==='undefined'){
            res.json({error: "ERROR: The amount is missing, please use parameter a"});
            return;
        }
        if(typeof d==='undefined'){
            res.json({error: "ERROR: The description is missing, please use parameter d"});
            return;
        }
        let paymentIntent;
        try {
                paymentIntent = await stripe.paymentIntents.create({
                  amount: a,
                  currency: 'usd',
                  description: d,
                  metadata: {referencid: r,},
                  automatic_payment_methods: {
                  enabled: true,
             },});
        }catch(e){
            res.send("103 - Error connecting to the payment gateway");
            console.log(e);
            return;
        }
        // send the client secret
        res.json({client_secret: paymentIntent.client_secret});
       // store the payment intent 
       const status="pending";
       try {
              await client.connect();
              const queryText = 'INSERT INTO striperequests(stripeid,referenceid,amount,created_on,status) values($1,$2,$3,current_timestamp,$4)';
              await client.query(queryText, [paymentIntent.id,r,(a/100),status]);
              await client.end();
       } catch (e) {
           res.send("104 - Error storing payment request");
           console.log(e);
           return;
       }
    });
    // function to store a payment request
    app.get('/paymentrequest', async function (req, res) {
        let token=req.query.token;    
        let referenceid=req.query.referenceid;
        let sender=req.query.sender;
        let recipient=req.query.recipient;
        let originaddress=req.query.originaddress;
        let chainid=req.query.chainid;
        let amount=req.query.amount;
        if(typeof token === 'undefined'){
            let v="ERROR - token is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(token !="USDT" && token !="USDC"){
            let v="ERROR - Not supported token";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof referenceid === 'undefined'){
            let v="ERROR - referenceid is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof sender === 'undefined'){
            let v="ERROR - sender is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof recipient === 'undefined'){
            let v="ERROR - recipient is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof originaddress === 'undefined'){
            let v="ERROR - originaddress is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof amount === 'undefined'){
            let v="ERROR - amount is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
         if(amount<=0){
            let v="ERROR - amount must be > 0";
            res.send(v);
            console.log(v);
            return;
        }
        if(typeof chainid=== 'undefined'){
            let v="ERROR - chainid is mandatory";
            res.send(v);
            console.log(v);
            return;
        }
        if(chainid<=0){
            let v="ERROR - chainid is wrong, must be > 0";
            res.send(v);
            console.log(v);
            return;
        }
        // check for the same referenceid already present
        let rs;
        try{
            await client.connect();
            const queryText="SELECT * from paymentrequests where referenceid=$1";
            rs=await client.query(queryText, [referenceid]);
            //console.log(rs);
        } catch (e) {
                res.send("105 - Error checking payment requests");
                console.log(e);
                return;
        }
        // read last block hash
        let blockhash;
        try{
            blockhash = await api.query.system.parentHash();
        } catch(e){
            res.send("115 - Error reading block hash");
            console.log(e);
            return;
        }
        // insert new record            
        if(typeof rs.rows[0]==='undefined'){
            let queryText="";
            // add the payment request
            try {
              queryText = 'INSERT INTO paymentrequests(referenceid,token,sender,recipient,amount,created_on,originaddress,chainid,blockhash) values($1,$2,$3,$4,$5,current_timestamp,$6,$7,$8)';
              await client.query(queryText, [referenceid,token,sender,recipient,amount,originaddress,parseInt(chainid),blockhash.toString()]);
              await client.end();
            } catch (e) {
                res.send("107 - Error storing payment request");
                console.log(e);
                return;
            }
            res.send('{"answer":"OK","message":"payment request accepted"}');
            return;
        }
        else {
            //check for the same data
            if(	rs.rows[0].referenceid==referenceid &&
                rs.rows[0].token==token &&
                rs.rows[0].sender==sender &&
                rs.rows[0].recipient==recipient &&
                rs.rows[0].amount==amount &&
                rs.rows[0].originaddress==originaddress &&
                rs.rows[0].chaind==parseInt(chainid)){
                    res.send('{"answer":"OK","message":"payment request accepted"}');
                    return;
            } else {
                res.send('{"answer":"KO","message":"payment request is preent with different data, cannot be changed for a while"}');
                return;
            }
        }
    });
    // send static files from html folder
    app.use(express.static('html'));
    // use the rate limits middleware
    app.use(rateLimitsUser);
    app.set('trust proxy', 1);
    // listen on port 3000        
    let server = app.listen(3000, function () { });
    // it can manage directly a https connection, but may be better to use NGINX as reverse proxy.
    if (typeof SSL_CERT !== 'undefined' && SSL_KEY !== 'undefined') {
        // loading certificate/key
        const options = {
            key: fs.readFileSync(SSL_KEY),
            cert: fs.readFileSync(SSL_CERT)
        };
        // Https listening on port 9443 -> proxy to 3002
        https.createServer(options, app).listen(9443);
    }
}
//function to return content of a file name
function read_file(name) {
    if (!fs.existsSync(name)) {
        return (undefined);
    }
    try {
        const data = fs.readFileSync(name, 'utf8')
        return (data);
    } catch (err) {
        console.error(err);
        return (undefined);
    }
}