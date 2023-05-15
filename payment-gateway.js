// Payment Gateway Server
// Address fro  USDT
// https://tether.to/en/supported-protocols
// Example:
// https://pay.bitgreen.org?p=USDTP&a=100&r=123456&d=test_payment&rp=paid.html&rnp=notpaid.html
const express = require('express');
const  fs = require('fs');
const { Client } = require('pg')
const stripe = require('stripe')('sk_test_51MDq0VKluWo1Xbjw9dB5xdWgGUulDA6ckewLKyz4wdQee6yrxX5QhhJ5oblHgWhVApt2VDOlHH0JxARlaimxnC5s00Laa66Evw');

let app = express();
// read environment variables
const SSL_CERT = process.env.SSL_CERT
const SSL_KEY = process.env.SSL_KEY
// static settings for contract address of the supported currencies
// USDT on Polygon
//https://polygonscan.com/address/0xc2132d05d31c914a87c6611c10748aeb04b58e8f
// https://polygonscan.com/token/0xc2132d05d31c914a87c6611c10748aeb04b58e8f
// project id for web3modal
const web3projectid='430bb551306002b2cd049dcc47587247';

console.log("Payment Gateway 1.0 - Starting");
mainloop();
console.log("[INFO] Listening for connections");

// main loop to use async functions
async function mainloop(){
    const client = new Client();
    await client.connect();
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
        console.log("Received call - p: ",p,"a: ",a,"r: ",r,"rp: ","rp: ",rp,"rnp: ",rnp," d: ",d,"o: ",o);
        
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
            const stripesession = await stripe.checkout.sessions.create({
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
            res.cookie('stu',stripesession.url);
            // store stripe id
            // check for the same referenceid already present
            const status="pending";
            try {
              const queryText = 'INSERT INTO striperequests(stripeid,referenceid,amount,created_on,status) values($1,$2,$3,current_timestamp,$4)';
              await client.query(queryText, [stripesession.id,r,a,status]);
            } catch (e) {
                throw e;
            }
            //USDT or USDT
            if(p=='USDC' || p=='USDT'){
                if(v=="modal")
                    res.send(read_file("html/usdstablemodal.html"));
                else
                    res.send(read_file("html/usdstable.html"));                
            }
        }
        if(p===undefined){
            console.log("[INFO] Sending index.html");
            let v="";
            try{
                v=read_file("html/index.html");    
            }catch(e){
                res.send(e);
                console.log(e);
            }
            res.send(v);
            console.log(v);
        }
    });
    // function to generate a payment intent and store it
    app.get('/stripe/',async function (req, res) {
        let a=req.query.a;
        let r=req.query.r;
        let d=req.query.d;
        if(typeof r==='undefined'){
            res.json({error: "The reference id is missing, please use parameter r"});
            return;
        }
        if(typeof a==='undefined'){
            res.json({error: "The amount is missing, please use parameter a"});
            return;
        }
        if(typeof d==='undefined'){
            res.json({error: "The description is missing, please use parameter d"});
            return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
              amount: a,
              currency: 'usd',
              description: d,
              metadata: {referencid: r,},
              automatic_payment_methods: {
                enabled: true,
              },});
       res.json({client_secret: paymentIntent.client_secret});
       // store the payment intent 
       const status="pending";
       try {
              const queryText = 'INSERT INTO striperequests(stripeid,referenceid,amount,created_on,status) values($1,$2,$3,current_timestamp,$4)';
              await client.query(queryText, [paymentIntent.id,r,(a/100),status]);
       } catch (e) {
           throw e;
       }
    });
    /*
    // proxy stripe.com to turn around the iframe blocking
    // this solution does not work with stripe since they are dynamically changing the url:(
    app.get('/stripe',async function (req, res) {
         let url=req.query.url;
         let r=await fetch(url)
         let rp= await r.text();
         console.log(rp);
         rp=rp.replace("https://","https://pay.bitgreen.org/stripe?url=");
         rp=rp.replace('"/','"https://pay.bitgreen.org/stripe?url='+url+'/');
         res.send(rp);
    });*/
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
            const queryText="SELECT COUNT(*) AS tot from paymentrequests where referenceid=$1";
            rs=await client.query(queryText, [referenceid]);
            //console.log(rs);
            } catch (e) {
                throw e;
            }
        // insert new record            
        if(rs.rows[0]['tot']==0){
            try {
              const queryText = 'INSERT INTO paymentrequests(referenceid,token,sender,recipient,amount,created_on,originaddress,chainid) values($1,$2,$3,$4,$5,current_timestamp,$6,$7)';
              await client.query(queryText, [referenceid,token,sender,recipient,amount,originaddress,parseInt(chainid)]);
            } catch (e) {
                throw e;
            }
        }
        else {
        // update some fields only to avoid an injection attack to replace the orderid to associate the payment to a different orderid
            try {
              const queryText = 'UPDATE paymentrequests SET token=$1,sender=$2,recipient=$3,amount=$4,chainid=$6,created_on=current_timestamp where referenceid=$5';
              await client.query(queryText, [token,sender,recipient,amount,referenceid,parseInt(chainid)]);
            } catch (e) {
                throw e;
            }            
        }
            res.send("OK");
    });
    app.use(express.static('html'));
        
    let server = app.listen(3000, function () { });
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