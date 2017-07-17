
// Imports
var os = require('os');
var fs = require('fs');
var path = require('path');
var innerProcess = require('child_process');
var common = require('./common');

// TODO: Define of current time

// Log level
var ENUM_LOG_LEVEL = {
    'DEBUG': 0,
    'INFO': 1,
    'WARNING': 2,
    'ERROR': 3,
    'FATAL': 4
}; 
// Markable lable of log level 
var LOG_LEVEL_LABEL = ['<DEBUG>_## ', '<INFO>_## ', '<WARNING>_## ', '<ERROR>_## ', '<FATAL>_## '];
// Default log level
var userLogLevel = ENUM_LOG_LEVEL.INFO;

// Log console declaration
var outputConsole;
var LAUNCH_MODE = common.ENUM_COMMAND_MODE.COMMAND;

// Prefix tag of log message
var colon = ': ';
var sepSymbol = '##_';

// Create/Show log channel of TizenTV
function createOutputPanel() {

    LAUNCH_MODE = common.getFuncMode();

    if (LAUNCH_MODE != common.ENUM_COMMAND_MODE.DEBUGGER) {

        var vscode = require('vscode');
        if (!outputConsole || typeof (outputConsole) == 'undefined') {
            outputConsole = vscode.window.createOutputChannel('TizenTV');
            outputConsole.show();
        }

        setLogLevel(vscode);
    }

}
exports.createOutputPanel = createOutputPanel;

function showOutputPanel() {
    if(outputConsole && typeof (outputConsole) != 'undefined'){
        outputConsole.show();
    }
}
exports.showOutputPanel = showOutputPanel;


// Set log level for filter logs
function setLogLevel(vscode) {

    var configedLevel = vscode.workspace.getConfiguration('tizentv')['logLevel'];

    if (configedLevel != null && typeof(configedLevel) != 'undefined') {
        // Read configured log level
        switch(configedLevel) {
            case 'DEBUG':
                userLogLevel = ENUM_LOG_LEVEL.DEBUG;
                break;
            case 'INFO':
                userLogLevel = ENUM_LOG_LEVEL.INFO;
                break;
            case 'WARNING':
                userLogLevel = ENUM_LOG_LEVEL.WARNING;
                break;
            case 'ERROR':
                userLogLevel = ENUM_LOG_LEVEL.ERROR;
                break;
            default:
                userLogLevel = ENUM_LOG_LEVEL.INFO;
        }
    }
}

// Print 'debug' log, full logs
function debug(moduleID, msg) {

    var printLog = moduleID + colon + msg;
    console.log(printLog);

    if (outputConsole && userLogLevel <= ENUM_LOG_LEVEL.DEBUG) {
        outputConsole.appendLine(`${(new Date().toLocaleTimeString())}` + sepSymbol + printLog);
    }
}
exports.debug = debug;

// Print 'info' log
function info(moduleID, msg) {

    var printLog = moduleID + colon + msg;
    console.info(printLog);

    if (outputConsole && userLogLevel <= ENUM_LOG_LEVEL.INFO) {
        outputConsole.appendLine(`${(new Date().toLocaleTimeString())}` + sepSymbol + printLog);
    }
}
exports.info = info;

// Print 'warning' log
function warning(moduleID, msg) {

    var printLog = LOG_LEVEL_LABEL[ENUM_LOG_LEVEL.WARNING] + moduleID + colon + msg;
    console.warn(printLog);

    if (outputConsole && userLogLevel <= ENUM_LOG_LEVEL.WARNING) {
        outputConsole.appendLine( `${(new Date().toLocaleTimeString())}` + sepSymbol + printLog);
    }
}
exports.warning = warning;

// Print "error" log
function error(moduleID, msg) {

    var printLog = LOG_LEVEL_LABEL[ENUM_LOG_LEVEL.ERROR] + moduleID + colon + msg;
    console.error(printLog);

    if (outputConsole && userLogLevel <= ENUM_LOG_LEVEL.ERROR) {
        outputConsole.appendLine(`${(new Date().toLocaleTimeString())}` + sepSymbol + printLog);
    }
}
exports.error = error;

// Print "fatal" log
function fatal(moduleID, msg) {

    var printLog = LOG_LEVEL_LABEL[ENUM_LOG_LEVEL.FATAL] + moduleID + colon + msg;
    console.error(printLog);

    if (_outputConsole && userLogLevel <= ENUM_LOG_LEVEL.FATAL) {
        _outputConsole.appendLine(`${(new Date().toLocaleTimeString())}` + sepSymbol + printLog);
    }
}
exports.fatal = fatal;
