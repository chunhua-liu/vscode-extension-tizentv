const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const archiver = require('archiver');
const PackageSigner = require('./packageSigner');
const profileEditor = require('./profileEditor');

class TVWebApp {
    constructor(name, location, id) {
        this.name = name;
        this.location = location;
        this.id = id === undefined ? this._generateID(10) : id;
    }
    
    get appID() { return this.id; }
    get appName() { return this.name; }
    get appLocation() { return this.location; }

    _generateID(length) {
        let res = '';
        let idChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 
            'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 
            'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 
            'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

        for (let i = 0; i < length; i++) {
            res += idChars[Math.round(Math.random() * 61)];
        }
        return res;
    }

    _cleanFiles(rmWgt) {
        if (rmWgt) {
            let widgetFile = path.resolve(this.location, `${this.name}.wgt`);
            if (fs.existsSync(widgetFile)) {
                fs.unlinkSync(widgetFile)
            }
        }
        
        let authorSigFile = path.resolve(this.location, `author-signature.xml`);
        if (fs.existsSync(authorSigFile)) {
            fs.unlinkSync(authorSigFile)
        }
        let distributorSigFile1 = path.resolve(this.location, `signature1.xml`);
        if (fs.existsSync(distributorSigFile1)) {
            fs.unlinkSync(distributorSigFile1)
        }
        let distributorSigFile2 = path.resolve(this.location, `signature2.xml`);
        if (fs.existsSync(distributorSigFile2)) {
            fs.unlinkSync(distributorSigFile2)
        }
    }

    _getContentSrc() {
        let configXml = path.resolve(this.location, `config.xml`);
        fs.readFile(configXml, (err, orignalXml) => {
            xml2js.parseString(orignalXml, (err, jsonTemp) => {
                if (jsonTemp.widget.content == undefined) {
                    return;
                }
                console.log(jsonTemp.widget);

                return jsonTemp.widget.content[0].$.src;
            });
        });
    }
    init() {
        let configXml = path.resolve(this.location, `config.xml`);
        fs.readFile(configXml, (err, orignalXml) => {
            xml2js.parseString(orignalXml, (err, jsonTemp) => {
                if (jsonTemp.widget.name == undefined) {
                    jsonTemp.widget.name = new Array(this.name);
                }
                else {
                    jsonTemp.widget.name[0] = this.name;
                }

                if (jsonTemp.widget['tizen:application'] == undefined) {
                    jsonTemp.widget['tizen:application'] = new Array({
                        '$': {
                            'id': `${this.id}.${this.name}`,
                            'package' : `${this.id}`,
                            'required_version': '2.3'
                        }
                    });
                }
                else {
                    jsonTemp.widget['tizen:application'][0].$.id = `${this.id}.${this.name}`;
                    jsonTemp.widget['tizen:application'][0].$.package = `${this.id}`;
                }

                let builder = new xml2js.Builder();
                let newXml = builder.buildObject(jsonTemp);
                fs.writeFileSync(configXml, newXml);
            });
        });
    }

    buildWidget() {       
        this._cleanFiles(true);
        let activeProfile = profileEditor.getActiveProfile();
        if (activeProfile == null) {
            return;
        }

        let pkgSigner = new PackageSigner();
        pkgSigner.setProfile(activeProfile);
        pkgSigner.signPackage(this.location);

        let widget = fs.createWriteStream(path.resolve(this.location, `${this.name}.wgt`));
        let archive = archiver('zip');
        archive.pipe(widget);

        let rootPath = this.location;
        let excludeFiles = [`${this.name}.wgt`];
        let excludeDir = []; 
        let dirent = fs.readdirSync(rootPath, {withFileTypes: true});
        dirent.forEach(item => {
            if (!item.name.startsWith('.')) {
                if (item.isDirectory()) {
                    if (!excludeDir.includes(item.name)) {
                        archive.directory(path.resolve(rootPath, item.name), item.name);
                    }
                } else {
                    if (!excludeFiles.includes(item.name)) {
                        archive.append(fs.createReadStream(path.resolve(rootPath, item.name)), {name: item.name});
                    }
                }
            }
        });

        archive.finalize();
        this._cleanFiles(false);
    }

    }

    static openProject(projectPath) {
        let appObj = null;
        let configXml = path.resolve(projectPath, `config.xml`);
        if (fs.existsSync(configXml)) {
            let configData = fs.readFileSync(configXml);
            xml2js.parseString(configData, (err, jsonData) => {
                if (!err) {
                    if (jsonData.widget != undefined && jsonData.widget['tizen:application'] != undefined) {
                        let id = jsonData.widget['tizen:application'][0].$.package;
                        let name = jsonData.widget.name;
        
                        appObj = new TVWebApp(name, projectPath, id);
                    }
                }
            });
        }

        return appObj;
    }
}
exports.TVWebApp = TVWebApp;

function initTVWebApp(name, location) {
    let newApp = new TVWebApp(name, location);
    newApp.init();
}
exports.initTVWebApp = initTVWebApp;