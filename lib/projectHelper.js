const fs = require('fs');
const sep = require('path').sep;
const xml2js = require('xml2js');
const archiver = require('archiver');

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

    init() {
        let configXml = this.location + `${sep}config.xml`;
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

    packageWidget() {
        let widget = fs.createWriteStream(this.location + `${sep}${this.name}.wgt`);
        let archive = archiver('zip');
        archive.pipe(widget);
        archive.directory(this.location);
        archive.finalize();

    }

    static openProject(projectPath) {
        let appObj = null;
        let configXml = projectPath + `${sep}config.xml`;
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