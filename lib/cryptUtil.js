const platform = require('os').platform();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const forge = require('node-forge');

const cryptToolExec = platform == 'win32' ? 'wincrypt.exe' : (platform == 'linux' ? 'secret-tool' : 'security');
const cryptTool = path.resolve(__dirname, '..', 'tools', 'certificate-encryptor', `${cryptToolExec}`);

function encryptPassword(password, pwdFile) {
    if (platform == 'win32') {
        try {
            execSync(`${cryptTool} --encrypt "${password}" ${pwdFile}`);
        } catch(err) {
            if (err.stderr && err.stderr.toString()) {
                console.log(err.stderr.toString());
            }
        }
    } else if (platform == 'linux') {
        execSync(`${cryptTool} store --label="tizen-studio" -p "${password}" keyfile ${pwdFile} tool certificate-manager`);
    } else if (platform == 'darwin') {
        execSync(`security add-generic-password -a ${pwdFile} -s certificate-manager -w "${password}" -U`);
    }
}

function decryptPassword(pwdFile) {
    let password = '';
    if (platform == 'win32') {
        try {
            let out = execSync(`${cryptTool} --decrypt ${pwdFile}`);
            if (out.includes('PASSWORD:')){
                out.trim();
                password = out.substring(9).replace(/[\r\n]/g,"");
            }
        } catch(err) {
            let stderr = err.stderr.toString();
            let stdout = err.stdout.toString();

            if (stderr) {
                console.log(stderr);
            } else if (stdout.includes('PASSWORD:')){
                stdout.trim();
                password = stdout.substring(9).replace(/[\r\n]/g,"");
            }
        }
    } else if (platform == 'linux') {
        let out = execSync(`${cryptTool} lookup --label="tizen-studio" keyfile ${pwdFile} tool certificate-manager`);
        out = out.toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g,"");
        }
    } else if (platform == 'darwin') {
        let out = execSync(`security find-generic-password -wa ${pwdFile} -s certificate-manager`);
        out = out.toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g,"");
        }
    }

    return password;
}

function checkP12Password(file, password) {
    try {
        let p12Der = fs.readFileSync(file).toString('binary');
        let p12Asn1 = forge.asn1.fromDer(p12Der);
        forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch(err) {
        console.log(err.message);
        return false;
    }

    return true;
}

function parseP12File(p12File, password) {
    let p12Content = {
        privateKey: '',
        certChain: []
    }
    try {
        let p12Der = fs.readFileSync(p12File).toString('binary');
        let p12Asn1 = forge.asn1.fromDer(p12Der);
        let p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

        p12.safeContents.forEach(safeContent => {
            safeContent.safeBags.forEach(safeBag => {
                if (safeBag.type == forge.pki.oids.certBag) {
                    let certBegin = '-----BEGIN CERTIFICATE-----';
                    let certEnd = '-----END CERTIFICATE-----';
                    let cert = forge.pki.certificateToPem(safeBag.cert);
                    let from = cert.indexOf(certBegin) + certBegin.length + 1;
                    let to = cert.indexOf(certEnd);
                    p12Content.certChain.push(cert.substring(from, to));
                } else if (safeBag.type == forge.pki.oids.pkcs8ShroudedKeyBag) {
                    let keyBegin = '-----BEGIN RSA PRIVATE KEY-----';
                    let key = forge.pki.privateKeyToPem(safeBag.key);
                    let from = key.indexOf(keyBegin);
                    p12Content.privateKey = key.substring(from)
                }
            })
        });
    } catch(err) {
        console.log(err.message);
        throw err;
    }

    return p12Content;
}

module.exports = {
    encryptPassword,
    decryptPassword,
    checkP12Password,
    parseP12File
}