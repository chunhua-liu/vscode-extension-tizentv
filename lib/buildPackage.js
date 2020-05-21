const vscode = require('vscode');
const TVWebApp = require('./projectHelper').TVWebApp;

module.exports = function buildPackage() {
    console.log(`build start`);
    console.log(`project root: ${vscode.workspace.rootPath}`);
    let webApp = TVWebApp.openProject(vscode.workspace.rootPath);
    console.log(webApp);
    if (webApp == null) {
        return;
    }

    webApp.buildWidget();
}