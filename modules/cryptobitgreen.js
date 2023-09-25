const _sodium =require('libsodium-wrappers-sumo');
const { unpack, pack } = require('msgpackr');
// function to encrypt a msg by password using symmetric encryption
// the msg data type is Uint8Array, to support text or binary data
// encrypts using chacha80
// the random nonces are generated internally
// the function returns an object with all salt and nonce, involved and the encrypted msg
// the object is serialised
async function encrypt_symmetric(msg,password){
    await _sodium.ready;
    const sodium = _sodium;
    // secure derivation of 1 key of 32 bytes + salt 16 byte (salt is random so the result is different)
    const key=await derive_key_from_password(password);
    // generate random nonce for AES AND CHACHA
    const saltchacha = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    // get derive secret key and random salt
    const secretkeychacha=key[0];
    const saltpwd=key[1];
    //encrypt msg by chacha
    const encmsgchachab=sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(msg,null,null,saltchacha,secretkeychacha);
    const encmsgchacha=new Uint8Array(encmsgchachab);
    let result={
      saltpwd:saltpwd,
      saltchacha: saltchacha,
      encmsg: encmsgchacha
    };
    // return encrypted object serialized with msgpackr
    return(pack(result));
  }
  //function to decrypt an encrypted obj
  async function decrypt_symmetric(encmsgb,password){
    // deserialize the encrypted object
    const encmsg=unpack(encmsgb);
    // wait for sodium available
    await _sodium.ready;
    const sodium = _sodium;
    // get keys salt
    const saltpwd=encmsg.saltpwd;
    const key=await derive_key_from_password(password,saltpwd);
    // get derived secret keys
    const secretkeychacha=key[0];
    //decryption 
    const encmsgchacha=encmsg.encmsg;
    // decryption
    let result;
    try {
      result=sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null,encmsgchacha,null,encmsg.saltchacha,secretkeychacha);
    } catch(e) {
      return(false);
    }
    return(result);
  }
  
  // function to derive a secure key from a password
  // it returns a 32 bytes key optionally using a specific salt
  async function derive_key_from_password(password,salt){
    await _sodium.ready;
    const sodium = _sodium;
    let randomsalt=sodium.randombytes_buf(16);
    if(typeof salt!='undefined'){
      randomsalt=salt;
    }
    const key = _sodium.crypto_pwhash(
        _sodium.crypto_box_SEEDBYTES,
        password,
        randomsalt,
        _sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        _sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        _sodium.crypto_pwhash_ALG_DEFAULT,
    );
    return([key,randomsalt]);
  }

  module.exports = {encrypt_symmetric,decrypt_symmetric};