
var launchEmulatorApp = (function () {
	// Imports
	//var vscode = require('vscode');
	var os = require('os');
	var fs = require('fs');
	var path = require('path');
	var innerProcess = require('child_process');
	var buildPackage = require('./buildPackage');
	var common = require('./common');
	//var launchSimulator = require('./launchSimulator');
	var launchTarget = require('./launchTarget');
	var logger = require('./logger');

	//var http = require('http');
	var TARGET_IP = '127.0.0.1';

	var extensionPath = __dirname;
	//var workspacePath = vscode.workspace.rootPath;
	var workspacePath = '';
	// Define SDB tool's path
	var sdbRelativePath = 'tools/sdb';
	var SPACE = ' ';
	var sdbToolname = (process.platform == 'win32') ? 'sdb.exe' : 'sdb';
	var sdbFolder = (process.platform == 'win32') ? 'win' : (process.platform == 'linux') ? 'linux' : 'mac';

    var spawn_sdbAbsolutePath = extensionPath + path.sep + sdbRelativePath + path.sep + sdbFolder + path.sep + sdbToolname;
	var sdbAbsolutePath = '\"' + spawn_sdbAbsolutePath + '\"';

	// SDB command definition
	var SDB_COMMAND_INSTALL = 'install';
	var SDB_COMMAND_UNINSTALL = 'uninstall';
	//var SDB_COMMAND_GETWIDGETID = 'shell /usr/bin/wrt-launcher -l';
	//var SDB_COMMAND_LAUNCH = 'shell /usr/bin/wrt-launcher --start';
	//var SDB_COMMAND_DLOG = 'dlog -v time ConsoleMessage';
	var SDB_COMMAND_DEVICE = 'devices';
	var SDB_COMMAND_ROOT = 'root on';
	var SDB_COMMAND_CAT = 'capability';
	var SDB_COMMAND_PUSH = 'push';

	//WAS command definition
	//var WAS_COMMAND_GETWIDGETID = 'shell wascmd -l';
	//var WAS_COMMAND_UNINSTALL = 'shell wascmd -u ';

	//var WAS_COMMAD_INSTALL = 'shell wascmd -i ';
	//var WAS_COMMAD_LAUNCH = 'shell wascmd -r';

	//sdb shell secure command
	var SDB_COMMAND_DLOG = 'shell 0 showlog time';
    var WAS_COMMAND_UNINSTALL = 'shell 0 vd_appuninstall ';
    var WAS_COMMAD_INSTALL = 'shell 0 vd_appinstall ';
    var WAS_COMMAD_LAUNCH = 'shell 0 was_execute ';

	var SDB_COMMAND_LAUNCH = 'shell 0 execute';
    var SDB_COMMAND_DEBUG = 'shell 0 debug';
	var TIME_OUT = '5000';

	var moduleName = 'Run on TV Emulator';


	return {
		// Handle 'Run on TV Emulator' command

		handleCommand: function () {

			// For getting compatible with sdb in Tizen Studio
			var INSTALLED_SDB_INSDK = common.getTizenStudioSdbPath();
            if (fs.existsSync(INSTALLED_SDB_INSDK)) {
                spawn_sdbAbsolutePath = INSTALLED_SDB_INSDK;
				sdbAbsolutePath ='\"' + INSTALLED_SDB_INSDK  + '\"';
            }else{
				spawn_sdbAbsolutePath = extensionPath + path.sep + sdbRelativePath + path.sep + sdbFolder + path.sep + sdbToolname;
				sdbAbsolutePath = '\"' + spawn_sdbAbsolutePath + '\"';
			}
		
			//moduleName = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR) ? 'Debug on TV Emulator' : 'Run on TV Emulator';
			//logger.info(moduleName, '==============================Run on TV Emulator start!');

			moduleName = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR) ? 'WebInspector on Emulator' : 'Run on Emulator';
			logger.info(moduleName, '==============================' + moduleName + 'start!');

			//workspacePath = common.getWorkspacePath();
			if (common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR) {
				logger.debug(moduleName, 'If it is debug mode, set vconf to enable RWI');
				workspacePath = common.getWorkspacePath();
			}
			// App folder path validation
			if (workspacePath) {
				var startHtml = 'index.html';
				var configFilePath = workspacePath + path.sep + 'config.xml';

				// Check if start html set
				var configuredHtml = common.getConfStartHtml(configFilePath);
				if (configuredHtml != '') {
					startHtml = configuredHtml;
				}

				var fileUrl = workspacePath + path.sep + startHtml;
				logger.info(moduleName, "The workspace's path is: " + workspacePath);
				logger.info(moduleName, "The App's index url is: " + fileUrl);

				// App validate failed
				if (!fs.existsSync(fileUrl)) {

					var waringMsg = 'It is not a standard tizen web app, without a start html in content src';
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					logger.warning(moduleName, waringMsg);
					return;
				}

				// SDB command definition
				var deviceCommand = sdbAbsolutePath + SPACE + '--emulator' + SPACE + SDB_COMMAND_DEVICE;
				//var listWidgetCommand = sdbAbsolutePath + SPACE + SDB_COMMAND_GETWIDGETID;
				//var uninstallCommand = sdbAbsolutePath + SPACE + SDB_COMMAND_UNINSTALL;

				// Check if need restart SDB
				var extension_state = common.getExtensionState();
				if (extension_state == common.ENUM_EXTENSION_STATE.STOPPED) {

					common.setExtensionState(common.ENUM_EXTENSION_STATE.INITIALIZED);
					//launchTarget.restartSdb();
				}

				// Before connect to target emulator device, check whether there's existing emulator instance
				logger.debug(moduleName, "Check if there's Emualtor instance: ' + deviceCommand");
				innerProcess.exec(deviceCommand, function (err, stdout, stderr) {

					if (err) {

						var waringMsg = 'Cannot find a started Emulator instance!';
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
						logger.warning(moduleName, waringMsg);
						logger.info(err.message);
						return;
					}
					else {

						logger.info(moduleName, 'Emulator device is runned as: ' + stdout);

						var isEmulatorInstalled = stdout.indexOf('emulator-26101');

						if (isEmulatorInstalled >= 0) { //Has been launched instance on the TV Emulator			
							
							// Build .wgt
							if (common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR) {
								buildPackage.handleCommand();
							}


							var pathArray = workspacePath.split(path.sep);
							var appName = pathArray[pathArray.length - 1];
							if (appName == '') {
								var wrongApp = "The App's path is not correct!";
								logger.error(moduleName, wrongApp);
								common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, wrongApp);
								return;
							}
							logger.info(moduleName, "The app's name is: " + appName);
							// Get packaged widget path
							var outputFullPath = workspacePath + path.sep + appName + '.wgt';

							var buildInterval = setInterval(function () { 
								if(fs.existsSync(outputFullPath)){
									logger.info(moduleName, 'Generate the .wgt file successfully');
									clearInterval(buildInterval); 

									// Validate the appID            
									var appId = common.getConfAppID(configFilePath);

									// App ID was not generated
									if (appId == '') {
										var errMsg = 'The application id is null!';
										common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, errMsg);
										logger.error(moduleName, errMsg);
										return;
									}

									// Check if the widget has been installed on target 
									var deviceSerial = '-s emulator-26101';

									// Change to root user
									//var rootCommand =  SDB_PATH + SPACE + SDB_COMMAND_ROOT;
									var rootCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_ROOT;
									innerProcess.execSync(rootCommand);
									logger.debug(moduleName, 'Set root on authority');

									var catCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_CAT;
									logger.debug(moduleName, 'catCommand:' + catCommand);
									var targetVersion = common.getTargetVersion(catCommand);
									logger.debug(moduleName, 'targetVersion=' + targetVersion);
									if (targetVersion == '3.0') {
										//common.setFuncMode(common.ENUM_COMMAND_MODE.DEBUGGER);
										//common.setFuncMode(common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR);
										//var vscode_chrome_debug_core_1 = require('vscode-chrome-debug-core');
										//vscode_chrome_debug_core_1.ChromeDebugSession.run(vscode_chrome_debug_core_1.ChromeDebugSession);
										//runAppOnTizen3();									

										//Push wgt to target device 
										logger.info(moduleName, 'Trying to push your wgt to Emulator');
										var localPath = outputFullPath;
										var remotePath = '/home/owner/share/tmp/sdk_tools/tmp/';
										
										var pushCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_PUSH + SPACE + localPath + SPACE + remotePath;
										logger.debug(moduleName, 'pushCommand:' + pushCommand);
										innerProcess.exec(pushCommand, function (error, stdout, stderr) {
											if (error) {
												var pushFailMsg = 'Push command execute error, please check';
												common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, pushFailMsg);
												logger.error(moduleName, `exec error: ${error}`);
												logger.error(moduleName, pushFailMsg);
												throw error;
											}
											logger.debug(moduleName, 'Push result:' + stdout);
											logger.info(moduleName, 'Your wgt is pushed to target Emulator successfully');

											var setVconfCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + 'shell 0 setRWIAppID' + SPACE + 'null';
											//If debug mode ,set vconf to current app_id
											if ((common.getFuncMode() == common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR) || (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR)) {
												logger.debug(moduleName, 'If it is debug mode, set vconf to enable RWI');
												
												setVconfCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + 'shell 0 setRWIAppID' + SPACE + appId;
											}
											logger.debug(moduleName, 'setVconfCommand:' + setVconfCommand);
											innerProcess.execSync(setVconfCommand);

										});

									}
			
									var packageId = common.getPackageID(appId);
									var uninstallCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_UNINSTALL + SPACE + packageId;

									// Install package to target Device							
									// var installCommand = SDB_PATH + SPACE + SDB_COMMAND_INSTALL + SPACE + outputFullPath;
									var installCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_INSTALL + SPACE + outputFullPath;
									if (targetVersion == '3.0') {
										
										var remotePath = '/home/owner/share/tmp/sdk_tools/tmp/';
										uninstallCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + WAS_COMMAND_UNINSTALL + SPACE + appId;
										installCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + WAS_COMMAD_INSTALL + SPACE + appId + SPACE  + remotePath + appName + '.wgt';
									}
									logger.debug(moduleName, installCommand);

									//Uninstall package 
									logger.debug(moduleName, 'uninstallCommand:' + uninstallCommand);
									innerProcess.execSync(uninstallCommand);

									innerProcess.exec(installCommand, { timeout: 45000 }, function (err, stdout, stderr) {

										logger.debug(moduleName, 'installCommand:'+installCommand);
										if (err) {
											var appNotRunning = 'Cannot install App to device, please check if the device is running!';
											common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, appNotRunning);
											logger.error(moduleName, appNotRunning);
											logger.info(moduleName, err.message);
											return;
										}
										logger.debug(moduleName, 'Install result:' + stdout);
										if (stdout.indexOf('install failed') >= 0) {
											var timeoutMsg = 'Error happened when install the App!';
											logger.error(moduleName, timeoutMsg);
											common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, timeoutMsg);
											logger.info(moduleName, stdout);
											return;
										}

										// Tizen2.4 debug mode
										if ((common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR) || (common.getFuncMode() == common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR)) {
											// forward sdb command
											//var forwardCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + "forward --remove-all";
											var forwardCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + 'forward tcp:7011 tcp:7011';

											// TODO: 
											logger.debug(moduleName, 'Forward ports!');
											innerProcess.execSync(forwardCommand);
										}

										// Lanuch App on target device
										//var debugMode = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR) ? '--debug' : '';
										var launchCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_LAUNCH + SPACE + appId + SPACE + TIME_OUT;

										if(common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR){
											launchCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_DEBUG + SPACE + appId + SPACE +TIME_OUT;
										}

										if (targetVersion == '3.0') {
											
											launchCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + WAS_COMMAD_LAUNCH + SPACE + appId;
										}

										logger.debug(moduleName, launchCommand);
										innerProcess.exec(launchCommand, function (err, stdout, stderr) {

											logger.debug(moduleName, '-----exec=launchCommand-----');
											if (err) {
												var canNotLaunched = 'Cannot launch to the target emulator, please check';
												common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, canNotLaunched);
												logger.error(moduleName, canNotLaunched);
												
												logger.info(moduleName, err.message);
												return;
											}

											logger.debug(moduleName, 'Launch result:' + stdout);
											if (stdout.indexOf('fail') >= 0) {
												var launchFailMsg = 'Failed to launch App';
												common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, launchFailMsg);
												logger.error(moduleName, launchFailMsg);
												return;
											}
											logger.info(moduleName, 'Launch the app successfully');

											// Tizen2.4 debug mode
											if (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR) {
												var debugIp = TARGET_IP + ':7011';
												var httpRequestCount = 0;
												launchTarget.seqRequest(httpRequestCount,debugIp, false,targetVersion);
												logger.debug(moduleName, '-----Run Web Inspector on Emulator-----');
											}

										});

									});

									// Output JS Log info from target Device 
									var dlogCommand = sdbAbsolutePath + SPACE + deviceSerial + SPACE + SDB_COMMAND_DLOG;

									const spawn = innerProcess.spawn;
									//const dlog = spawn(dlogCommand, []);
									//const dlog = spawn(sdbAbsolutePath, ['dlog', '-v', 'time', 'ConsoleMessage']);
									const dlog = spawn(spawn_sdbAbsolutePath, ['-s', 'emulator-26101', 'shell', '0', 'showlog', 'time']);

									dlog.stdout.on('data', function(data) {
										//console.log(`stdout: ${data}`);
										logger.debug(moduleName, `stdout: ${data}`);
									});

									dlog.stderr.on('data', function(data) {
										logger.error(moduleName, `stderr: ${data}`);
									});

									dlog.on('close', function(code) {
										logger.info(moduleName, 'child process exited with code ${code}');
									});

								}
								
							}, 1000);  

						}
						else {
							var noInstance = 'There is no TV Emulator running instance, please check the Emulator Manager and ensure at least one running emulator instance';
							logger.error(moduleName, noInstance);
							common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, noInstance);
						}

						logger.info(moduleName, '==============================Run on TV Emulator end!');
					}
				});

				


			} else {
				var noWebAppMsg = 'No web app in the current workspace';
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, noWebAppMsg);
				logger.warning(moduleName, noWebAppMsg);
			}

		},

		// Handle 'Debug on TV 3.0' command
		prepareInstallForDebug:function(dirpath) {

			logger.info(moduleName, '==============================Debug on Emulator 3.0 start!');			

			workspacePath = dirpath;
			launchEmulatorApp.handleCommand();
			
		}

	};

})();
module.exports = launchEmulatorApp;
