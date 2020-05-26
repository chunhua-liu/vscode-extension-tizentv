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
        await vscode.workspace.getConfiguration('tizentv').update(config, userInput, true);
        return userInput;
    }
}