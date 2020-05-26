const vscode = require('vscode');
const TVWebApp = require('./projectHelper').TVWebApp;
const StepController = require('./inputStepController').StepController;
const configUtil = require('./configUtil');

module.exports = async function launchApplication(isDebug) {
    let controller = new StepController();
    if (isDebug) {
        controller.addStep({
            title: 'Debug Application',
            items: ['Debug On TV', 'Debug On TV Emulator'].map(label => ({label}))
        });
    } else {
        controller.addStep({
            title: 'Launch Application',
            items: ['Run On TV', 'Run On TV Emulator', 'Run On TV Simulator'].map(label => ({label}))
        });
    }
    
    let results = await controller.start();

    let webApp = TVWebApp.openProject(vscode.workspace.rootPath);
    if (webApp == null) {
        return;
    }

    let device = null;
    switch (results[0]) {
        case 'Run On TV':
        case 'Debug On TV':
            device = configUtil.getConfig(configUtil.TARGET_IP);
            if (device == null) {
                device = await configUtil.userInputConfig(configUtil.TARGET_IP);
            }
            break;
        case 'Run On TV Emulator':
        case 'Debug On TV Emulator':
            device = 'emulator';
            break;
        case 'Run On TV Simulator':
            device = 'simulator';
            break;
    }
    
    await webApp.launch(device, isDebug);
}