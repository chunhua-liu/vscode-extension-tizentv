/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";

var common = require('../common');
//var launchTarget = require('../launchTarget');
var vscode_chrome_debug_core_1 = require('vscode-chrome-debug-core');

var innerProcess = require('child_process');

common.setFuncMode(common.ENUM_COMMAND_MODE.DEBUGGER);

vscode_chrome_debug_core_1.ChromeDebugSession.run(vscode_chrome_debug_core_1.ChromeDebugSession);  




