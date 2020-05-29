const vscode = require('vscode');
const fileURLToPath = require('url').fileURLToPath;
const InputValidator = require('./inputValidator').InputValidator;

const targetDeviceAddress = 'targetDeviceAddress';
const hostPCAddress = 'hostPCAddress';
const simulatorExecutable = 'simulatorExecutable';
const chromeExecutable = 'chromeExecutable';

async function configFromUserInput(config) {
    return new Promise((resolve, reject) => {
        if (!vscode.workspace.getConfiguration('tizentv').has(config)) {
            reject('Invalid configuration item!');
            return;
        }

        let input = vscode.window.createInputBox();
        input.ignoreFocusOut = true;
        if (config == targetDeviceAddress) {
            input.title = 'Configure Target Device IP Address';
            input.placeholder = 'xxx.xxx.xxx.xxx';
        } else if (config == hostPCAddress) {
            input.title = 'Configure Host PC IP Address';
            input.placeholder = 'xxx.xxx.xxx.xxx';
        } else if (config == simulatorExecutable) {
            input.title = 'Configure Tizen Web Simulator Executable';
            input.placeholder = 'Enter simulator installation path';
            input.buttons = [{
                iconPath: new vscode.ThemeIcon('file-directory'), 
                tooltip: 'Browser File System'
            }];
        } else if (config == chromeExecutable) {
            input.title = 'Configure Chrome Executable';
            input.placeholder = 'Enter Chrome installation path';
            input.buttons = [{
                iconPath: new vscode.ThemeIcon('file-directory'), 
                tooltip: 'Browser File System'
            }];
        }
    
        input.onDidTriggerButton(async btn => {
            let file = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false
            });
        
            if (file) {
                input.value = fileURLToPath(file[0].toString(true));
            }
        });
    
        input.onDidAccept(() => {
            if (config == targetDeviceAddress || config == hostPCAddress) {
                input.validationMessage = InputValidator.checkIPAddress(input.value);
            }

            if (input.validationMessage == null) {
                resolve(input.value);
                input.hide();
            }
        });
    
        input.show();
    });
}

module.exports = {
    TARGET_IP: targetDeviceAddress,
    HOST_IP: hostPCAddress,
    SIMULATOR_EXEC: simulatorExecutable,
    CHROME_EXEC: chromeExecutable,

    getConfig: (config) => {
        return vscode.workspace.getConfiguration('tizentv').get(config);
    },

    userInputConfig: async (config) => {
        let userInput = await configFromUserInput(config);
        if (process.platform == 'darwin' && config == chromeExecutable) {
            if (userInput.split('/').pop() == 'Google Chrome.app') {
                userInput += '/Contents/MacOS/Google Chrome';
            }
        }
		if (process.platform == 'darwin' && config == simulatorExecutable) {
            if (userInput.split('/').pop() == 'nwjs.app') {
                userInput += '/Contents/MacOS/nwjs';
            }
        }
        await vscode.workspace.getConfiguration('tizentv').update(config, userInput, true);
        return userInput;
    },

    checkTVConnection: async () => {
        let host = vscode.workspace.getConfiguration('tizentv').get(hostPCAddress);
        let target = vscode.workspace.getConfiguration('tizentv').get(targetDeviceAddress);
        let select = '';

        do {
            if (host == null) {
                host = await configFromUserInput(hostPCAddress);
                await vscode.workspace.getConfiguration('tizentv').update(hostPCAddress, host, true);
            }
    
            if (target == null) {
                target = await configFromUserInput(targetDeviceAddress);
                await vscode.workspace.getConfiguration('tizentv').update(targetDeviceAddress, target, true);
            }
    
            select = await vscode.window.showQuickPick(
                [`connection: ${host} (HOST) <--> ${target} (TARGET)`, `Change Host IP Address`, `Change Target IP Address`],
                {ignoreFocusOut: true}
            );
    
            if (select == undefined) {
                return Promise.resolve(select);
            }
    
            if (select == `Change Host IP Address`) {
                host = await configFromUserInput(hostPCAddress);
                await vscode.workspace.getConfiguration('tizentv').update(hostPCAddress, host, true);
            } else if (select == `Change Target IP Address`) {
                target = await configFromUserInput(targetDeviceAddress);
                await vscode.workspace.getConfiguration('tizentv').update(targetDeviceAddress, target, true);
            }
    
        } while (!select.includes(`connection`))

        return Promise.resolve({host, target});
    }
}