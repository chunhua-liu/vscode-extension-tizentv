
var launchEmulatorManager = (function() {
	// Imports
	var vscode = require('vscode');
	var os = require('os');
	var fs = require('fs');
	var path = require('path');
	var innerProcess = require('child_process');
	var buildPackage = require('./buildPackage');
	var common = require('./common');
	var logger = require('./logger');

	//Emulator Path definition
	var sdkInstallPath = '';
	var TOOLS_DIR = 'tools';
	var DIR_EMULATOR = 'emulator';
	var EMULATOR_MANAGER_MAC = 'emulator-manager.app/Contents/MacOS/emulator-manager';
	var EMULATOR_MANAGER_EXECUTABLE = (process.platform == 'win32') ? 'emulator-manager.exe' : (process.platform == 'linux') ? 'emulator-manager' : EMULATOR_MANAGER_MAC;
	
	var SPACE = ' ';
	var moduleName = 'Run TV Emulator Manager';

	return {
		// Handle 'Run TV Emulator Manager' command
		handleCommand:function() {

			logger.info(moduleName, '==============================Run TV Emulator Manager start!');
			sdkInstallPath = vscode.workspace.getConfiguration('tizentv')['tizenStudioLocation'];
			var emulatorInstallPath;

			if (sdkInstallPath) {
				if (fs.existsSync(sdkInstallPath)) {

					emulatorInstallPath = sdkInstallPath + path.sep + TOOLS_DIR + path.sep + DIR_EMULATOR;

				} else {
					var congureErr = "The configured sdk path doesn't exist";
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, congureErr);
					logger.error(moduleName, congureErr);
					return;
				}
			} else {
				var pathNotExist = 'Please configure your SDK path in Preferences->User Settings';
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, pathNotExist);
				logger.error(moduleName, pathNotExist);
				return;
			}

			logger.info(moduleName, 'The configured path of SDK is: ' + sdkInstallPath);
			logger.info(moduleName, 'The path of Emulator is: ' + emulatorInstallPath);

			var exePath = '';
			exePath = emulatorInstallPath + path.sep + 'bin'+ path.sep + EMULATOR_MANAGER_EXECUTABLE;
			
			logger.info(moduleName, 'Execute file: ' + exePath);
			if (fs.existsSync(exePath)) {

				var startEmulatorCommand;
				/* execute "open {EMULATOR BIN PATH}/{EMULATOR MANAGER APP NAME}.app" command on Mac OS	*/
			
				startEmulatorCommand = '\"' +exePath + '\"';
				
				// Check if the targe TV Emulator has been connected
				logger.info(moduleName, 'Executing Emulator Manager tool: ' + startEmulatorCommand);

				// Launch the TV Emulator Manager in the Tizen SDK Install Path;
				var libDir = emulatorInstallPath + path.sep + 'bin';

				innerProcess.exec(startEmulatorCommand, { cwd: libDir }, function (err, stdout, stderr) {
					if (err) {
						var launchErrStatus = 'Failed to start Emulator Manager!';
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, launchErrStatus);
						logger.error(moduleName, launchErrStatus);
						logger.info(moduleName, err.message);
					}
					else {
						logger.info(moduleName, 'The Emulator Manager is quited!');
						logger.info(moduleName, '==============================Run TV Emulator Manager end!');
					}
				});

			} else {

				var nullPathMsg = 'Tizen TV Emulator Manager is not installed in your Tizen Studio!';
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, nullPathMsg);
				logger.error(moduleName, nullPathMsg);
				return;
			}

		}
	};

})();
module.exports = launchEmulatorManager;
