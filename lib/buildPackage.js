const vscode = require('vscode');
const { TVWebApp } = require('./projectHelper');

module.exports = function buildPackage() {
    console.log('build package start!!');
    let projectLocation = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath;
    console.log(`${projectLocation}`);
    let webApp = TVWebApp.openProject(projectLocation);
    if (webApp) {
        webApp.packageWidget();
    }
}