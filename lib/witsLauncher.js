const vscode = require('vscode');
const wits = require('@tizentv/wits');
const TVWebApp = require('./projectHelper').TVWebApp;
const profileEditor = require('./profileEditor');
const configUtil = require('./configUtil');

module.exports = async function launchWits(option) {
    let webApp = TVWebApp.openProject(vscode.workspace.rootPath);
    if (webApp == null) {
        return;
    }
    let appWidth = webApp.getAppScreenWidth();

    let targetAddr = configUtil.getConfig(configUtil.TARGET_IP);
    if (targetAddr == null) {
        targetAddr = await configUtil.userInputConfig(configUtil.TARGET_IP);
    }

    let hostAddr = configUtil.getConfig(configUtil.HOST_IP);
    if (hostAddr == null) {
        hostAddr = await configUtil.userInputConfig(configUtil.HOST_IP);
    }

    let config = {
         deviceIp: targetAddr,
         hostIp: hostAddr,
         width: appWidth,
         profilePath: profileEditor.profilePath,
         baseAppPath: webApp.appLocation
    }

    console.log(wits);
    wits.setWitsconfigInfo(config);

    switch (option) {
        case 's':
            console.log(`launch wits -start`);
            await wits.start();
            break;
        case 'w':
            console.log(`launch wits -watch`);
            await wits.watch();
            break;
    }
} 