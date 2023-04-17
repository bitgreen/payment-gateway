// Payment Gateway Server
// Address fro  USDT
// https://tether.to/en/supported-protocols
// Example:
// https://pay.bitgreen.org?p=USDTP&a=100&r=123456&d=test_payment&rp=paid.html&rnp=notpaid.html
const express = require('express');
const  fs = require('fs');
const { Client } = require('pg')
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
    app.get('/', function (req, res) {
        console.log("[INFO] Sending index.html");
        let p=req.query.p;
        let a=req.query.a;
        let r=req.query.r;
        let rp=req.query.rp;
        let rnp=req.query.rnp;
        let d=req.query.d;
        console.log("Received call - p: ",p,"a: ",a,"r: ",r,"rp: ","rp: ",rp,"rnp: ",rnp," d: ",d);
        // p is the payment method: 
        // r is the referenceid
        // rp is the url to redirect for successfully payment
        // rnp is the url to redirect for failed payment
        // d is the description of the purchase
        if(p!==undefined){
            res.cookie('p', p);
            res.cookie('a',a);
            res.cookie('r',r);
            res.cookie('rp',rp);
            res.cookie('rnp',rnp);
            res.cookie('d',d);
            //USDT or USDT
            if(p=='USDC' || p=='USDT'){
                res.send(read_file("html/usdstable.html"));                
            }
        }
        if(p===undefined){
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
    // function to store a payment request
    app.get('/paymentrequest', function (req, res) {
        res.cookie('p', p);
        res.cookie('a',a);
        res.cookie('r',r);
        res.cookie('rp',rp);
        res.cookie('rnp',rnp);
        res.cookie('d',d);
        res.cookie('sender',sender);        
        res.cookie('recipient',recipient);
/*        try {
               const queryText = 'INSERT INTO paymentrequests(referenceid,token,sender,recipient,amount,created_on) values($1,$2,$3,$4,$5,,current_timestamp)';
               const res = await client.query(queryText, r,p,sender,recipient,a);
            } catch (e) {
                throw e;
            }*/
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