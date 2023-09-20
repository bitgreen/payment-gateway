const  {decrypt_symmetric} = require('./modules/cryptobitgreen.js');
const { Buffer } = require('node:buffer');
const { readFileSync,writeFileSync } = require('node:fs');

// read parameters
var argv = process.argv ;
const filename=argv[2];
if(typeof filename==='undefined'){
    console.log("File name parameter is missing");
    show_help();
    return;
}
const pwd=argv[3];
if(typeof pwd==='undefined'){
    console.log("Password parameter is missing");
    show_help();
    return;
}
mainloop(filename,pwd);
// async main body
async function mainloop(filename,pwd){
    let fc;
    // read file
    try {
         fc=readFileSync(filename);
    }catch(e){
        console.log("ERROR reading file",filename,e);
        return;
    }
    
    //decrypt
    let cleartextuint8= await decrypt_symmetric(fc,pwd);
    if(cleartextuint8==false){
        console.log("ERROR: decryption failed, password may be wrong");
        return;
    }
    let cleartext = Buffer.from(cleartextuint8).toString();
    //console.log("decrypted buffer: ",cleartext);
    // save decrypted file removing .enc
    let filenamedec=filename.replace(".enc","");
    try{
        writeFileSync(filenamedec,cleartext);
    }catch(e){
        console.log("Error saving decrypted file",filenamedec,e);
        return;
    }
    console.log("File:",filename,"has been decrypted in:",filenamedec);
    return;
}
//functiont to show help
function show_help(){
    console.log("decrypt-file.js requires 2 parameters:");
    console.log("- file name to decrypt");
    console.log("- password");
    console.log("For example:");
    console.log("node decrypt-file.js test.txt.enc my_password")
}