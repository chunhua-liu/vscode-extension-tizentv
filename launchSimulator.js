
var launchSimulator = (function() {
    // Imports
    var os = require('os');
    var fs = require('fs');
    var path = require('path');
    var child_process_1 = require('child_process');
    var common = require('./common');
    var logger = require('./logger');

    // Aguments for running Web Simulator
    var ARG_FILE_KEY = ' --file=';        //$NON-NLS-1$
    var SIMULATOR_EXECUTABLE_MAC = 'nwjs.app/Contents/MacOS/nwjs';
    var SIMULATOR_EXECUTABLE = (process.platform == 'win32') ? 'simulator.exe' : (process.platform == 'linux') ? 'simulator' : SIMULATOR_EXECUTABLE_MAC;
    var prefix = 'file:///';
    var extenstionPath = __dirname;

    //var workspacePath = vscode.workspace.rootPath;
    var workspacePath = common.getWorkspacePath();

    // Module name
    var moduleName = 'Run on TV Simulator';


    // Do launch Simulator task
    var launchSimulatorApp = function (fileUrl) {

        logger.debug(moduleName, '================launchSimulator');
        var vscode = require('vscode');
        var simulatorSettingPath = vscode.workspace.getConfiguration('tizentv')['simulatorLocation'];

		var sdkInstallPath = vscode.workspace.getConfiguration('tizentv')['tizenStudioLocation'];

        // Get simulator from extension tools, if path is not configured
        var defaultSimulatorpath = extenstionPath + '/tools/sec-tv-simulator/';
        var simulatorintSdKPath = sdkInstallPath + '/tools/sec-tv-simulator/';
        if (!simulatorSettingPath) {

            if (fs.existsSync(defaultSimulatorpath)) {
                logger.debug(moduleName, 'Use simulator path in extension:' + defaultSimulatorpath);
                simulatorSettingPath = defaultSimulatorpath;
            } else if (fs.existsSync(simulatorintSdKPath)){
                logger.debug(moduleName, 'Use simulator path in Tizen Studio:' + simulatorintSdKPath);
                simulatorSettingPath = simulatorintSdKPath;
            }
        }

        var simulatorLocation;
        if (simulatorSettingPath) {
            logger.debug(moduleName, "The simulator's location is " + simulatorSettingPath);
            simulatorSettingPath = simulatorSettingPath + path.sep + SIMULATOR_EXECUTABLE;
            if (fs.existsSync(simulatorSettingPath)) {
                simulatorLocation = simulatorSettingPath;
                logger.debug(moduleName, "The simulator's path is " + simulatorLocation);
            } else {
                var executableNotFound = 'Cannot find the simulator executable program';
                logger.warning(moduleName, executableNotFound);
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, executableNotFound);
                return;
            }
        } else {
            var locationNotDefine = 'The simulator location is not configured, please refer File->Preference->User Settings';
            common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, locationNotDefine);
            logger.error(moduleName, locationNotDefine);
            return;
        }

        fileUrl = prefix + fileUrl;

        // Get project name
        var projectName = ' ';
        // var pathArray = vscode.workspace.rootPath.split(path.sep);
        var pathArray = workspacePath.split(path.sep);
        if (pathArray.length > 0) {
            projectName = projectName + pathArray[pathArray.length - 1];
        }

        logger.info(moduleName, 'Start run the app on simulator');
        // Execute launch command
        //var command = simulatorLocation + ARG_FILE_KEY + fileUrl;
        var command = '\"' + simulatorLocation + '\"' + ARG_FILE_KEY + '\"' + fileUrl + '\"';
        logger.debug(moduleName, 'Simulator launch command:-------' + command);
        var notifyInfo = 'Running App... (If it has been running, will be replaced!)';
        logger.info(moduleName, notifyInfo);
        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, notifyInfo);
        this.simulatorProc2 = child_process_1.exec(command, function (error, stdout, stderr) {
            if (error) {
                logger.error(moduleName, `exec error: ${error}`);
                var commandFailMsg = 'Can not execute the command, please check your setting';
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, commandFailMsg);
                logger.error(moduleName, commandFailMsg);
                throw error;
            }
        });
        logger.info(moduleName, '==============================Run on simulator end!');
    };


    return {
        // Handle 'Run on TV Simulator' command
        handleCommand:function() {

            logger.info(moduleName, '==============================Run on simulator start!');
            // Check if a app path has been opened (vilidata)      
            if (workspacePath) {

                var startHtml = 'index.html';
                var configFilePath = workspacePath + path.sep + 'config.xml';
                
                // Check if start html set
                var configuredHtml = common.getConfStartHtml(configFilePath);
                if (configuredHtml != '')
                {
                    startHtml = configuredHtml;
                }

                var fileUrl = workspacePath + path.sep + startHtml;

                logger.debug(moduleName, 'fileUrl=' + fileUrl);
                if (fs.existsSync(fileUrl)) {
                    logger.info(moduleName, 'Prepare to launch your app on simulator');
                    launchSimulatorApp(fileUrl);
                } else {
                    var waringMsg = 'It is not a standard tizen web app, without a start html in content src';
                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
                    logger.warning(moduleName, waringMsg);
                }
            } else {
                var noWebApp = "There's no web app in the current workspace";
                logger.warning(moduleName, noWebApp);
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, noWebApp);
            }

        }
    };

})();
module.exports = launchSimulator;