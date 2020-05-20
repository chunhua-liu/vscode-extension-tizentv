const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const vscode = require('vscode');
const SignedXml = require('xml-crypto').SignedXml;
const cryptUtil = require('./cryptUtil');
const profileEditor = require('./profileEditor');

const Dom = require('xmldom').DOMParser;
const ExclusiveCanonicalization = require('./exclusive-canonicalization').ExclusiveCanonicalization;

const authorPropDgst = `lpo8tUDs054eLlBQXiDPVDVKfw30ZZdtkRs1jd7H5K8=`;
const distributorPropDgst = `u/jU3U4Zm5ihTMSjKGlGYbWzDfRkGphPPHx3gJIYEJ4=`;

class Reference {
    constructor(uri) {
        this.uri = uri;
        this.digestValue = '';
    }

    digest(content) {
        if (this.uri == '#prop') { // currently we use const prop digest value, TO BE DONE: this should be calulated
            this.digestValue = content;
        }
        else {
            let shasum = crypto.createHash('sha256');
            shasum.update(content, 'utf8');
            this.digestValue = shasum.digest('base64');
        }
    }

    getElement() {
        let transform = `<Transforms>\n` +
        `<Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"></Transform>\n` +
        `</Transforms>\n`;

        return `<Reference URI="${this.uri}">\n` + 
        `${this.uri == '#prop' ? transform: ''}` +
        `<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>\n` +
        `<DigestValue>${this.digestValue}</DigestValue>\n` +
        `</Reference>\n`;
    }
}

class Signature {
    constructor(id, projectRoot) {
        this.id = id;
        this.projectRoot = projectRoot;
        this.signedInfo = ``;
        this.signatureValue = ``;
        this.keyInfo = ``;
        this.objectInfo = ``;
    }

    _listFiles() {
        let dirList = [];
        let excludeFile = this.id == 'AuthorSignature' ? ['author-signature.xml', 'signature1.xml', 'signature2.xml'] : ['signature1.xml', 'signature2.xml'];
        function _listDirs(curDir) {
            let dir = fs.readdirSync(curDir, {withFileTypes: true});
            dir.forEach(item => {
                if (!item.name.startsWith('.') && !excludeFile.includes(item.name)) {
                    console.log(item);
                    if (item.isDirectory()) {
                        _listDirs(path.resolve(curDir, item.name))
                    }
                    else {
                        dirList.push(path.resolve(curDir, item.name));
                    }
                }		
            })
        }

        _listDirs(this.projectRoot);
        return dirList.sort();
    }

    _addReferences(fileList) {
        let references = '';
        // add file references
        fileList.forEach(file => {
            let uri = encodeURIComponent(file.substring(this.projectRoot.length + 1).replace(/\\/g, '/'));
            let ref = new Reference(uri);
            ref.digest(fs.readFileSync(file));
            references += `${ref.getElement()}`;
        });
        
        // add prop reference
        let propRef = new Reference('#prop');
        propRef.digest(this.id == 'AuthorSignature' ? authorPropDgst : distributorPropDgst);
        references += `${propRef.getElement()}`;

        return references;
    }

    sign(key) {
        let fileList = this._listFiles();
        let references = this._addReferences(fileList);
        
        this.signedInfo = '<SignedInfo>\n' +
            '<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>\n' +
            '<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>\n' +
            `${references}`+
            '</SignedInfo>\n';

        let signWrapper = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${this.signedInfo}</Signature>`;
        let xml = new Dom().parseFromString(signWrapper);
        let node = xml.documentElement.firstChild;
        let transform = new ExclusiveCanonicalization();
        let canonedXMl = transform.process(node, {defaultNsForPrefix: {ds: 'http://www.w3c.org/2000/09/xmldsig#'}});

        let signer = crypto.createSign('RSA-SHA256');
        signer.update(canonedXMl);
        let sigValue = signer.sign(key, 'base64');
        this.signatureValue = `<SignatureValue>\n` + 
            `${sigValue}\n` +
            `</SignatureValue>\n`;
    }

    addKeyInfo(certChain) {
        this.keyInfo = `<KeyInfo>\n<X509Data>\n`;
        certChain.forEach(cert => {
            this.keyInfo += `<X509Certificate>${cert}</X509Certificate>\n`;
        });
        this.keyInfo += `</X509Data>\n</KeyInfo>\n`;
    }

    generateSignatureXml() {
        return `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#" Id="${this.id}">\n` +
        `${this.signedInfo}` +
        `${this.signatureValue}` +
        `${this.keyInfo}` +
        `<Object Id="prop"><SignatureProperties xmlns:dsp="http://www.w3.org/2009/xmldsig-properties"><SignatureProperty Id="profile" Target="#${this.id}"><dsp:Profile URI="http://www.w3.org/ns/widgets-digsig#profile"></dsp:Profile></SignatureProperty><SignatureProperty Id="role" Target="#${this.id}"><dsp:Role URI="http://www.w3.org/ns/widgets-digsig#role-${this.id == 'AuthorSignature' ? 'author' : 'distributor'}"></dsp:Role></SignatureProperty><SignatureProperty Id="identifier" Target="#${this.id}"><dsp:Identifier></dsp:Identifier></SignatureProperty></SignatureProperties></Object>\n` +
        `</Signature>\n`;
    }
}

module.exports = class PackageSigner {
    constructor() {
        this.profile = '';
        this.fileList = [];
        this.profileInfo = {
            author: null,
            distributor1: null,
            distributor2: null
        };
    }

    setProfile(profile) {
        let items = profileEditor.getProfileItems(profile);
        if (items.authorKey == null || items.authorPwd == null || items.distributorKey1 == null || items.distributorPwd1 == null) {
            // must contain author and at least 1 distributor certificate
            return false;
        }

        try {
            let authorPwd = cryptUtil.decryptPassword(items.authorPwd);
            this.profileInfo.author = cryptUtil.parseP12File(items.authorKey, authorPwd);

            let distributorPwd1 = cryptUtil.decryptPassword(items.distributorPwd1);
            this.profileInfo.distributor1 = cryptUtil.parseP12File(items.distributorKey1, distributorPwd1);

            if (items.distributorKey2 && items.distributorPwd2) {
                let distributorPwd2 = cryptUtil.decryptPassword(items.distributorPwd1);
                this.profileInfo.distributor2 = cryptUtil.parseP12File(items.distributorKey1, distributorPwd2);
            }
        } catch (err) {
            return false;
        }

        return true;
    }

    signPackage(projectRoot) {
        let authorSig = new Signature('AuthorSignature', projectRoot);
        authorSig.sign(this.profileInfo.author.privateKey);
        authorSig.addKeyInfo(this.profileInfo.author.certChain);
        let authorSignatureXml = authorSig.generateSignatureXml();
        let authorSigFile = path.resolve(projectRoot, `author-signature.xml`);
        fs.writeFileSync(authorSigFile, authorSignatureXml, {encoding: 'utf-8'});
        
        let distributorSig1 = new Signature('DistributorSignature', projectRoot);
        distributorSig1.sign(this.profileInfo.distributor1.privateKey);
        distributorSig1.addKeyInfo(this.profileInfo.distributor1.certChain);
        let distributorSignatureXml1 = distributorSig1.generateSignatureXml();
        let distributorSigFile1 = path.resolve(projectRoot, `signature1.xml`);
        fs.writeFileSync(distributorSigFile1, distributorSignatureXml1, {encoding: 'utf-8'});

        let distributorSignatureXml2 = '';
        if (this.profileInfo.distributor2) {
            let distributorSig2 = new Signature('DistributorSignature', projectRoot);
            distributorSig2.sign(this.profileInfo.distributor2.privateKey);
            distributorSig2.addKeyInfo(this.profileInfo.distributor2.certChain);
            distributorSignatureXml2 = distributorSig2.generateSignatureXml();
            let distributorSigFile2 = path.resolve(projectRoot, `signature2.xml`);
            fs.writeFileSync(distributorSigFile2, distributorSignatureXml2, {encoding: 'utf-8'});
        }
    }
}
