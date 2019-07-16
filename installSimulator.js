
// Imports
var fs = require('fs');
var vscode = require('vscode');
var innerProcess = require('child_process');
var innerSpawn = innerProcess.spawn;
var logger = require('./logger');
var common = require('./common');

var extensionPath = __dirname;
var _BLANK = ' ';
// Module name
var moduleName = 'Create Web Project';

// Handle 'Install WebSimulator' commands
// Can be invoked by other features
function handleCommand() {

	// Install samsungsimulator process
	try {

        // Tip
		logger.info(moduleName, '==============================Install Web Simulator start!');
		var installWarning = 'Runing web simulator installation in background';
		logger.warning(moduleName, installWarning);
        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, installWarning);

		installCommand = innerSpawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', 'samsungsimulator']);
		logger.debug(moduleName, 'Install web simulator by command: ' + installCommand);

        // Monitor 'install status'
		installCommand.stdout.on('data', function (data) {
			logger.info(moduleName, 'Keep installing samsungsimulator...');
			logger.debug(moduleName, data.toString());
		});

        // Monitor 'install error'
		installCommand.stderr.on('data', function (data) {
			logger.error(moduleName, data.toString());
			var installSimulatorFail = 'Failed to install simulator!';
       		common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, installSimulatorFail);
			logger.error(moduleName, installSimulatorFail);
		});

        // Monitor 'install exit'
		installCommand.on('exit', function (code, signal) {

			logger.debug(moduleName, 'Move samsungsimulator to Tools diretory');
			logger.info(moduleName, 'Installing samsungsimulator ..., 80%');

			// Copy the samsungsimulator folder into 'tools' path
			var sourcePath = extensionPath + '/node_modules/sec-tv-simulator';
			var targetpath = extensionPath + '/tools/';
			var sucessfulInstall = false;
			if (fs.existsSync(sourcePath)) {

				try {
					var moveCommand = process.platform === 'win32' ? 'move /y' : 'mv -rf';
					moveCommand = moveCommand + _BLANK + sourcePath + _BLANK + targetpath;
					logger.debug(moduleName, 'Copy web simulator to tool: ' + moveCommand);
					innerProcess.execSync(moveCommand);
					sucessfulInstall = true;
					logger.debug(moduleName, 'Copy web simulator sucessfully');
				}
				catch (ex) {
					// Copy failed
					sucessfulInstall = false;
					logger.debug(moduleName, ex.message);
					logger.debug(moduleName, 'Copy web simulator failed');
				}
			}

            // Install sucessfully case
            if (sucessfulInstall) {
				var completeStatus = 'Install Web Simulator sucessfully!';
				logger.warning(moduleName, completeStatus);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, completeStatus);
			}
            // Install failed case
			else {
				var failStatus = 'Install Tizen WebSimulator Failed!';
				logger.info(moduleName, failStatus);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, failStatus);
			}

			logger.info(moduleName, '==============================Install Web Simulator end!');
		});

	}
	catch (ex) {
		logger.debug(moduleName, ex.message);
		logger.error(moduleName, 'Install Web Simulator failed!');
	}

}
exports.handleCommand = handleCommand;
