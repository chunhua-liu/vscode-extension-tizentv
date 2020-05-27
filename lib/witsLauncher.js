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

    /*
    let targetAddr = configUtil.getConfig(configUtil.TARGET_IP);
    if (targetAddr == null) {
        targetAddr = await configUtil.userInputConfig(configUtil.TARGET_IP);
    }

    let hostAddr = configUtil.getConfig(configUtil.HOST_IP);
    if (hostAddr == null) {
        hostAddr = await configUtil.userInputConfig(configUtil.HOST_IP);
    }
    */

    let connection = await configUtil.checkTVConnection();
    let debugMode = false;
    if (option == 's') {
        let select = await vscode.window.showQuickPick(
            [`Wits Start Mode: Debug`, `Wits Start Mode: Normal`],
            {ignoreFocusOut: true}
        );

        if (select == `Wits Start Mode: Debug`) {
            debugMode = true;
        }
    }

    let config = {
         deviceIp: connection.target,
         hostIp: connection.host,
         width: appWidth,
         profilePath: profileEditor.profilePath,
         baseAppPath: webApp.appLocation,
         isDebugMode: debugMode
    }

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