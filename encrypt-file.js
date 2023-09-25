const  {encrypt_symmetric} = require('./modules/cryptobitgreen.js');
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
    
    //encrypt
    let encmsg= await encrypt_symmetric(fc,pwd);
    //console.log("encrypted buffer: ",encmsg);
    // save encrypted file adding .enc
    let filenameenc=filename+'.enc';
    try{
        writeFileSync(filenameenc,encmsg);
    }catch(e){
        console.log("Error saving encrypted file",filenameenc,e);
        return;
    }
    console.log("File:",filename,"has been encrypted in:",filenameenc);
    return;
}
//functiont to show help
function show_help(){
    console.log("encrypt-file.js requires 2 parameters:");
    console.log("- file name to encrypt");
    console.log("- password");
    console.log("For example:");
    console.log("node encrypt-file.js test.txt my_password")
}