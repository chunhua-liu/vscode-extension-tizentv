var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var forge = require('node-forge');
//var Buffer = require('buffer').Buffer;


function encryptPassword(password){
    //crypto.cipher encrypt
    var iv = Buffer.from('2ayhs91xsa79xchf', 'utf8');
    var key = Buffer.from('8uIwsoc7yhsOpw25', 'utf8');
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);  //default true
    var ciph = cipher.update(password, 'utf8', 'hex');
    ciph += cipher.final('hex');

    //base64 encode
    var b1 = Buffer.from(ciph,'hex');
    var s1= b1.toString('base64');
    return s1;
}
exports.encryptPassword = encryptPassword;

function decryptPassword(password){

    //base64 decode
    var baseBuffer = Buffer.from(password, 'base64');
    var hexCode = baseBuffer.toString('hex');

    //crypto.decipher decrypt
    var iv = Buffer.from('2ayhs91xsa79xchf', 'utf8');
    var key = Buffer.from('8uIwsoc7yhsOpw25', 'utf8');
    try {
      var decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    } catch (err) {
      console.log(err);
      throw err;
    }
    decipher.setAutoPadding(true);
    var txt = decipher.update(hexCode, 'hex', 'utf8');
    txt += decipher.final('utf8');
    return txt;
}
exports.decryptPassword = decryptPassword;

function checkP12Password(file, password) {
    try {
        let p12Der = fs.readFileSync(file).toString('binary');
        let p12Asn1 = forge.asn1.fromDer(p12Der);
        forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch(err) {
        logger.warning(moduleName, err.message);
        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, err.message);
        return false;
    }

    return true;
}
exports.checkP12Password = checkP12Password;