// app to remove the orphaned records from paymentrequests
// to mitigate DDOS attacks calling the API to create an api request

const { Client } = require('pg')
console.log("Payment Requests - Removal of orphaned records");
mainloop();

// main loop to use async functions
async function mainloop(){
    // connect to the Postgresql DB
    const client = new Client();
    await client.connect();
    await client.query("delete from paymentrequests  where created_on < now() - interval '30 minute'", []);
    await client.end();
    console.log("Clean up completed");
    return;
}