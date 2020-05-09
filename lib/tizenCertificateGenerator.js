const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cryptUtil = require('./cryptUtil');
const profileEditor = require('./profileEditor');

const extensionPath = path.resolve(__dirname, '..');
const certPath = path.resolve(__dirname, '..', 'resource', 'cert');
const authorPath = extensionPath + '/resource/Author'.split('/').join(path.sep);
const caPriKeyPath = certPath + path.sep + 'tizen-author.pri';
const caCertPath = certPath + path.sep + 'tizen-author.ca';
const distributorPublicSigner = certPath + path.sep + 'tizen-distributor-public-signer.p12';
const distributorPartnerSigner = certPath + path.sep + 'tizen-distributor-partner-signer.p12';
const distributorSignerPassword = 'tizenpkcs12passfordsigner';

function makeFilePath(pathName) {
    if (fs.existsSync(pathName)) {
        return true;
    }
    else {
        if (makeFilePath(path.dirname(pathName))) {
            fs.mkdirSync(pathName);
            return true;
        }
    }
}

function loadCaCert() {
    let key = 'SRCNSDKTEAM2019';
    key = crypto.createHash('sha256').update(key).digest('base64').substr(0, 32);
        
    let inputData = fs.readFileSync(caCertPath);
    const iv = Buffer.alloc(16, 0);
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let caCert = Buffer.concat([decipher.update(inputData,'hex'), decipher.final()]);
    let caContent = caCert.toString('utf8');

    let strBeginCertificate = '-----BEGIN CERTIFICATE-----';
    let strEndCertificate = '-----END CERTIFICATE-----';
    
    let line1Beg  = caContent.indexOf(strBeginCertificate);
    let line1End  = caContent.indexOf(strEndCertificate);

    let strBeginLen = strBeginCertificate.length;
    let strEndLen = strEndCertificate.length;
    
    let cert1 = caContent.substring(line1Beg, line1End+strEndLen);
    //console.log(cert1);
    return cert1;
}

function registerProfile(profileName, keyfileName, password, privilege) {
    let authorPwdFile = path.resolve(path.dirname(keyfileName), path.basename(keyfileName, '.p12') + '.pwd');
    let distributorKey = privilege == 'public' ? distributorPublicSigner : distributorPartnerSigner;
    let distributorPwdFile = path.resolve(path.dirname(distributorKey), path.basename(distributorKey, '.p12') + '.pwd');

    cryptUtil.encryptPassword(password, authorPwdFile);
    if (!fs.existsSync(distributorPwdFile)) {
        cryptUtil.encryptPassword(distributorSignerPassword, distributorPwdFile);
    }

    profileEditor.createProfile(profileName, {
        key: keyfileName,
        password: authorPwdFile
    }, {
        key: distributorKey,
        password: distributorPwdFile
    }, undefined, true);
}

function createCert(profileName, keyfileName, authorName, authorPassword, privilege){
    // generate a keypair
    let keys = forge.pki.rsa.generateKeyPair(1024);

    // create a certificate
    let cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();

    let notAfterDate = new Date();
    notAfterDate.setFullYear(cert.validity.notBefore.getFullYear() + 8);
    cert.validity.notAfter = notAfterDate;

    let attrs = [{
        name: 'commonName',
        value: authorName
    }];

    let issurInfo = [{
        name: 'organizationName',
        value: 'Tizen Association'
    }, {
        shortName: 'OU',
        value: 'Tizen Association'
    }, {
        shortName: 'CN',
        value: 'Tizen Developers CA'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(issurInfo);
    
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        codeSigning: true
    }]);

    //read ca private Key
    //var caPriPem = fs.readFileSync(caPriKeyPath);
    let key = 'SRCNSDKTEAM2019';
    key = crypto.createHash('sha256').update(key).digest('base64').substr(0, 32);
        
    let inputData = fs.readFileSync(caPriKeyPath);
    const iv = Buffer.alloc(16, 0);
    let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let caPriPem = Buffer.concat([decipher.update(inputData,'hex'), decipher.final()]);
    let caPassword = 'tizencertificatefordevelopercaroqkfwk';

    let decryptedCaPriKey = forge.pki.decryptRsaPrivateKey(caPriPem.toString('utf8'), caPassword);
    cert.sign(decryptedCaPriKey);

    //var userPriKey = forge.pki.privateKeyToPem(keys.privateKey);
    let userCert =  forge.pki.certificateToPem(cert);

    let caCert = loadCaCert();
    let certArray = [userCert, caCert];

    // create PKCS12
    let newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keys.privateKey, certArray, authorPassword,
        {generateLocalKeyId: true, friendlyName: authorName});

    let newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();

    if (!fs.existsSync(authorPath)) {
        makeFilePath(authorPath);
    }

    let keyFilePath = authorPath + path.sep + keyfileName + '.p12';
    fs.writeFileSync(keyFilePath, newPkcs12Der, {encoding: 'binary'});

    registerProfile(profileName, keyFilePath, authorPassword, privilege);
}
exports.createCert = createCert;
 
