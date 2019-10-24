const { sep } = require('path');
const { exec } = require('child_process');
const { getConfAppID } = require('./common')
const { existsSync } = require('fs');
const { get } = require('http');
const httpGet = get;
const vscode = require('vscode');
const logger = require('./logger');

const extensionRootPath = __dirname;
const sdbFolder = (process.platform == 'win32') ? 'win' : (process.platform == 'linux') ? 'linux' : 'mac';
const sdbToolname = (process.platform == 'win32') ? 'sdb.exe' : 'sdb';
const sdbExec = `${extensionRootPath}/tools/sdb/${sdbFolder}/${sdbToolname}`.split('/').join(sep);
const emulatorTmp = `/home/owner/share/tmp/sdk_tools/tmp/`;
const emulatorDev = `emulator-26101`;
const portRegExp = /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/;

class AppLauncher {
    constructor(props) {
        this.projectPath = props.projectPath;
        this.debugMode = props.debugMode;
        this.device = props.device == 'emulator' ? emulatorDev : props.device;
        this.pkgName = null;
        this.pkgID = null;
        this.wgtFile = null;
        this.debugPort = null;
        this.chromeExec = null;
    }
    _execAsync(cmd, outCheck) {
        let promise = new Promise(function(resolve, reject) {
            logger.info(`App Launcher: `, cmd);
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    reject(`${err.name}: ${err.message}`);
                }
                else {
                    if (outCheck) {
                        outCheck(stdout, resolve, reject);
                    }
                    else {
                        resolve();
                    }
                }
            });
        })
        return promise;
    }

    checkProject() {
        if (existsSync(`${this.projectPath}${sep}config.xml`)) {
            let appID = getConfAppID(`${this.projectPath}${sep}config.xml`).split('.');
            this.pkgID = appID[0];
            this.pkgName = appID[1];
        }
        else {
            return Promise.reject(`ProjectError: ${this.projectPath}${sep}config.xml not found.`);
        }

        if (existsSync(`${this.projectPath}${sep}${this.pkgName}.wgt`)) {
            this.wgtFile = `${this.projectPath}${sep}${this.pkgName}.wgt`;
        }
        else {
            return Promise.reject(`ProjectError: ${this.projectPath}${sep}${this.pkgName}.wgt not found.`);
        }

        return Promise.resolve();
    }

    checkEmulator() {
        return this._execAsync(`${sdbExec} --emulator devices`, function(stdout, resolve, reject) {
            if (stdout.includes(emulatorDev)) {
                resolve();
            }
            else {
                reject(`EnvError: No running emulator device.`);
            }
        }.bind(this))
    }

    checkChrome() {
        this.chromeExec = vscode.workspace.getConfiguration('tizentv')['chromeExecutable'];
        if (existsSync(this.chromeExec)) {
            if (process.platform == 'win32') {
                this.chromeExec = `"${this.chromeExec}"`;
            }
            return Promise.resolve();
        }

        return Promise.reject(`EnvError: Chrome executable file is not configured.`);
    }

    pushWgt() {
        return this._execAsync(`${sdbExec} -s ${this.device} push ${this.wgtFile} ${emulatorTmp}`);
    }

    installApp() {
        return this._execAsync(`${sdbExec} -s ${this.device} shell 0 vd_appinstall  ${this.pkgID}.${this.pkgName} ${emulatorTmp}${this.pkgName}.wgt`);
    }

    uninstallApp() {
        return this._execAsync(`${sdbExec} -s ${this.device} shell 0 vd_appuninstall ${this.pkgID}.${this.pkgName}`);
    }

    executeApp() {
        return this._execAsync(`${sdbExec} -s ${this.device} shell 0 execute ${this.pkgID}.${this.pkgName}`);
    }

    debugApp() {
        return this._execAsync(`${sdbExec} -s ${this.device} shell 0 debug ${this.pkgID}.${this.pkgName}`, (stdout, resolve, reject) => {
            // For debug mode stdout: ... successfully launched pid = xxxx with debug 1 port: xxxxx
            if (stdout.includes(`successfully launched`) && stdout.includes(`port:`)) {
                this.debugPort = stdout.split(' ').pop();
                
                let portN = this.debugPort.indexOf('\n');
                let portR = this.debugPort.indexOf('\r');
                if (portN || portR) {
                    this.debugPort = this.debugPort.substring(0, portN < portR ? portN : portR);
                }

                resolve();
            }
            else {
                reject(`error: ${stdout}`);
            }
        })
    }

    setDebugPort() {
        if (portRegExp.test(this.debugPort)) {
            return this._execAsync(`${sdbExec} -s ${this.device} forward tcp:7011 tcp:${this.debugPort}`);
        }
        
        return Promise.reject(`Error: Invalid debug port: ${this.debugPort}`);
    }

    rmRemoteFile() {
        // Remove remote files: /home/owner/share/tmp/sdk_tools/tmp/*.wgt 
        return this._execAsync(`${sdbExec} -s ${this.device} shell 0 rmfile`);
    }

    openChromeDevTool() {
        let ipAddr = this.device.includes('emulator') ? '127.0.0.1' : this.device;
        let port = this.device.includes('emulator') ? '7011' : this.debugPort;
        httpGet(`http://${ipAddr}:${port}/json`, (res) => {
            let weJson = '';
            
            if (res.statusCode != 200) {
                return;
            }

            res.on('data', (chunk) => { weJson += chunk; });
            res.on('end', () => {
                let devUrl = JSON.parse(weJson)[0].devtoolsFrontendUrl;
                this._execAsync(`${this.chromeExec} http://${ipAddr}:${port}${devUrl}`);
            })
        })
    }

    connectTarget() {
        return this._execAsync(`${sdbExec} connect ${this.device}`);
    }

    disconnectTarget() {
        return this._execAsync(`${sdbExec} disconnect ${this.device}`);
    } 
}

function launchAppOnEmualtor(projectPath) {
    let launcher = new AppLauncher({
        projectPath: projectPath,
        device: 'emulator'
    });

    launcher.checkProject()
            .then(launcher.checkEmulator.bind(launcher))
            .then(launcher.pushWgt.bind(launcher))
            .then(launcher.uninstallApp.bind(launcher))
            .then(launcher.installApp.bind(launcher))
            .then(launcher.rmRemoteFile.bind(launcher))
            .then(launcher.executeApp.bind(launcher))
            .catch((err) => {
                console.log(err);
            })
}
exports.launchAppOnEmualtor = launchAppOnEmualtor;

function debugAppOnEmualtor(projectPath) {
    let launcher = new AppLauncher({
        projectPath: projectPath,
        device: 'emulator',
        debugMode: true
    });

    launcher.checkChrome()
            .then(launcher.checkProject.bind(launcher))
            .then(launcher.checkEmulator.bind(launcher))
            .then(launcher.pushWgt.bind(launcher))
            .then(launcher.uninstallApp.bind(launcher))
            .then(launcher.installApp.bind(launcher))
            .then(launcher.rmRemoteFile.bind(launcher))
            .then(launcher.debugApp.bind(launcher))
            .then(launcher.setDebugPort.bind(launcher))
            .then(launcher.openChromeDevTool.bind(launcher))
            .catch((err) => {
                console.log(err);
            })
}
exports.debugAppOnEmualtor = debugAppOnEmualtor;

function launchAppOnTV(projectPath) {
    let TVAddr = vscode.workspace.getConfiguration('tizentv')['targetDeviceAddress'];
    if (TVAddr == null) {
        throw `Target device IP address not config.`
    }
    let launcher = new AppLauncher({
        projectPath: projectPath,
        device: TVAddr
    });

    launcher.checkProject()
            .then(launcher.connectTarget.bind(launcher))
            .then(launcher.pushWgt.bind(launcher))
            .then(launcher.uninstallApp.bind(launcher))
            .then(launcher.installApp.bind(launcher))
            .then(launcher.rmRemoteFile.bind(launcher))
            .then(launcher.executeApp.bind(launcher))
            .catch((err) => {
                console.log(err);
            })
}
exports.launchAppOnTV = launchAppOnTV;

function debugAppOnTV(projectPath) {
    let TVAddr = vscode.workspace.getConfiguration('tizentv')['targetDeviceAddress'];
    if (TVAddr == null) {
        throw `Target device IP address not config.`
    }
    let launcher = new AppLauncher({
        projectPath: projectPath,
        device: TVAddr,
        debugMode: true
    });

    launcher.checkChrome()
            .then(launcher.checkProject.bind(launcher))
            .then(launcher.connectTarget.bind(launcher))
            .then(launcher.pushWgt.bind(launcher))
            .then(launcher.uninstallApp.bind(launcher))
            .then(launcher.installApp.bind(launcher))
            .then(launcher.rmRemoteFile.bind(launcher))
            .then(launcher.debugApp.bind(launcher))
            .then(launcher.openChromeDevTool.bind(launcher))
            .catch((err) => {
                console.log(err);
            })
}
exports.debugAppOnTV = debugAppOnTV;