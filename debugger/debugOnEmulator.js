/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";

var common = require('../common');

var vscode_chrome_debug_core_1 = require('vscode-chrome-debug-core');


common.setFuncMode(common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR);


vscode_chrome_debug_core_1.ChromeDebugSession.run(vscode_chrome_debug_core_1.ChromeDebugSession);  




