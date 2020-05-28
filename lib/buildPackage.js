const vscode = require('vscode');
const TVWebApp = require('./projectHelper').TVWebApp;

module.exports = function buildPackage() {
    let webApp = TVWebApp.openProject(vscode.workspace.rootPath);
    if (webApp == null) {
        return;
    }

    webApp.buildWidget();
}