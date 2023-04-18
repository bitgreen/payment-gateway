const { ApiPromise, WsProvider } = require('@polkadot/api');
const { Keyring } = require('@polkadot/keyring');
const  fs = require('fs');

//const MNEMONIC = 'sample split bamboo west visual approve brain fox arch impact relief smile';
const MNEMONIC = process.env.MNEMONIC;
mainloop();

async function mainloop(){
    const wsProvider = new WsProvider('wss://testnet.bitgreen.org');
    const api = await ApiPromise.create({ provider: wsProvider });
    console.log("Genesis hash: ",api.genesisHash.toHex());
    // create keyring for transaction submission
    let keyring = new Keyring({ type: 'sr25519' });
    let keys=keyring.createFromUri(MNEMONIC);
    console.log(keys.address);
    const validate = api.tx.dex.validateBuyOrder(1,1,"xxxx");

    // Sign and send the transaction using our account
    const hash = await validate.signAndSend(keys);
    console.log("tx: ",hash);
    
}

