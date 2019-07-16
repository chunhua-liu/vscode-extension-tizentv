
var launchTarget = (function() {
    // Import the module and reference it with the alias vscode
    //var vscode = require('vscode');
    var os = require('os');
    var fs = require('fs');
    var path = require('path');
    var innerProcess = require('child_process');

    var Q = require('q');

    // Use 'buildpakage.js' to refresh the App package
    var common = require('./common');
    var logger = require('./logger');

    var http = require('http');


    var SDB_NAME = (process.platform == 'win32') ? 'sdb.exe' : 'sdb';
    var SDB_FOLDER = (process.platform == 'win32') ? 'win' : (process.platform == 'linux') ? 'linux' : 'mac';
    var LIB_PATH = 'tools/sdb';
    var EXTENSION_PATH = __dirname;
    var OUTPPUT_PATH = 'output';

    var SPAWN_SDB_PATH = EXTENSION_PATH + path.sep + LIB_PATH + path.sep + SDB_FOLDER + path.sep + SDB_NAME;
    var SDB_PATH = '\"' + SPAWN_SDB_PATH + '\"';

    var workspacePath = '';
    var outputFullPath = '';
    var targetVersion = '2.4';
    var SPACE = ' ';
    var DEFAULT_IP = '255.255.255.255';
    var TARGET_IP = '255.255.255.255';
    

    // SDB command definition
    var SDB_COMMAND_CONNECT = 'connect';
    var SDB_COMMAND_DISCONNECT = 'disconnect';
    var SDB_COMMAND_INSTALL = 'install';

    var SDB_COMMAND_CAT = 'capability';

    var SDB_COMMAND_UNINSTALL = 'uninstall';

    //var SDB_COMMAND_GETWIDGETID = 'shell /usr/bin/wrt-launcher -l';
    //var SDB_COMMAND_LAUNCH = 'shell /usr/bin/wrt-launcher --start';

    //var SDB_COMMAND_DLOG = "shell /usr/bin/dlogutil -v time ConsoleMessage";
    //var SDB_COMMAND_DLOG = 'dlog -v time ConsoleMessage';
    
    //WAS command definition
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


    var SDB_COMMAND_ROOT = 'root on';
    var SDB_COMMAND_START = 'start-server';
    var SDB_COMMAND_KILL = 'kill-server';

    var SDB_COMMAND_PUSH = 'push';
    var SDB_OPT_SERIAL = '-s ' + DEFAULT_IP;

    // set init global output log level and module
    var LOG_LEVEL = 'DEBUG';
    var moduleName = 'Run on TV';

    //Prepare wgt and connect devices before install and run app
    var prepareInstall = function(dirpath, targetAddress) {
        var deferred = Q.defer();
        logger.debug(moduleName, '================Prepare install');
        workspacePath = dirpath;
        // Check if the targe device IP has been setted
        var targetAddressStart = targetAddress.indexOf(DEFAULT_IP);
        if (targetAddressStart == 0) {
            var targetNotConfig = 'The target device address is not configured, please refer File->Preference->User Settings';
            common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, targetNotConfig);
            logger.error(moduleName, targetNotConfig);
            return;
        }
        //logger.info(moduleName, 'Checking the app ...');

        // App folder path validation
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
            if (!fs.existsSync(fileUrl)) {
                var waringMsg = 'It is not a standard tizen web app, without a start html in content src';
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, waringMsg);
                logger.info(moduleName, waringMsg);
                return;
            }

            logger.debug(moduleName, 'workspacePath=' + workspacePath);
            //sdb command
            var disconnectCommand = SDB_PATH + SPACE + SDB_COMMAND_DISCONNECT + SPACE + targetAddress;
            var connectCommand = SDB_PATH + SPACE + SDB_COMMAND_CONNECT + SPACE + targetAddress;
            var devicesCommand = SDB_PATH + SPACE + 'devices';
            var killServerCommand = SDB_PATH + SPACE + SDB_COMMAND_KILL;
            var startServerCommand = SDB_PATH + SPACE + SDB_COMMAND_START;

            logger.info(moduleName, 'Prepare to connect your target');

            //When first run the extension , restart sdb to avoid sdb version not compatiable issue
            var extension_state = common.getExtensionState();

            if (extension_state == common.ENUM_EXTENSION_STATE.STOPPED) {
                logger.debug(moduleName, 'It is first time to run the extension, restart the sdb');
                common.setExtensionState(common.ENUM_EXTENSION_STATE.INITIALIZED);
                //this.restartSdb();
                launchTarget.restartSdb();
            }

            //Disconnect to target device first 
            logger.debug(moduleName, 'disconnectCommand:' + disconnectCommand);
            innerProcess.exec(disconnectCommand, function (error, stdout, stderr) {
                if (error) {
                    var disconnFailMsg = 'disconnectCommand is failed';
                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, disconnFailMsg);
                    logger.error(moduleName, `exec error: ${error}`);
                    logger.error(moduleName, disconnFailMsg);
                    throw error;
                }
                logger.debug(moduleName, 'Disconnect your target successful');

                //connect to target device 
                logger.debug(moduleName, 'connectCommand:' + connectCommand);
                var connectCommandResult = innerProcess.exec(connectCommand, function (error, stdout, stderr) {
                    if (error) {
                        var connFailMsg = 'connectCommand is failed';
                        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, connFailMsg);
                        logger.error(moduleName, `exec error: ${error}`);
                        logger.error(moduleName, connFailMsg);
                        throw error;
                    }
                    logger.debug(moduleName, 'connection result:' + stdout);

                    if (stdout.indexOf('error') >= 0) {
                        var failConnectMsg = 'Failed to connect to target device';
                        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, failConnectMsg);
                        logger.error(moduleName, failConnectMsg);
                        deferred.reject();
                        return;
                    }
                    logger.debug(moduleName, 'Connected the target');

                    //List devices    
                    logger.debug(moduleName, 'devicesCommand:' + devicesCommand);
                    if (!launchTarget.getDeviceStatus(targetAddress)) {
                        var cantFindDeviceMsg = 'Cannot find the device in devices list';
                        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, cantFindDeviceMsg);
                        logger.warning(moduleName, cantFindDeviceMsg);
                        deferred.reject();
                        return;
                    }
                    logger.info(moduleName, 'Found the device');

                    //Cat target version
                    logger.debug(moduleName, 'Pleae check your target version');
                    var targetAddressArray = targetAddress.split(':');
                    var targetIP = targetAddressArray[0];
                    
                    TARGET_IP = targetIP;

                    SDB_OPT_SERIAL = '-s ' + targetIP;
                    var catCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_CAT;
                    logger.debug(moduleName, 'catCommand:' + catCommand);

                    targetVersion = common.getTargetVersion(catCommand);
                    logger.debug(moduleName, 'targetVersion=' + targetVersion);

                    // Refresh the application.wgt
                    
                    //var buildPackage = require('./buildPackage');
                    //buildPackage.handleCommand();

                    if (common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER) {
                        var buildPackage = require('./buildPackage');
                        buildPackage.handleCommand();
                    }
  
                    deferred.resolve();
                });

            });

        } else {
            var noWebApp = 'There is no web app in workspace';
            common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, noWebApp);
            logger.error(moduleName, noWebApp);

        }
        return deferred.promise;

    };


    var runApp = function() {
        logger.debug(moduleName, '================runApp');

        var pathArray = workspacePath.split(path.sep);
        var appName = pathArray[pathArray.length - 1];
        outputFullPath = workspacePath + path.sep + appName + '.wgt';
        logger.debug(moduleName, 'outputFullPath =' + outputFullPath);

        var buildInterval = setInterval(function () { 
            if(fs.existsSync(outputFullPath)){
                logger.info(moduleName, 'Generate the .wgt file successfully');
                clearInterval(buildInterval);           
                if (targetVersion == '3.0') {
                    runAppOnTizen3();
                } else if (targetVersion == '2.4') {
                    runAppOnTizen2();
                }else {
                    logger.error(moduleName, 'Cannot run App on the unknown Tizen version!');
                }
            }
            
        }, 1000);    

    };


    //Run app on tizen2.4 target
    var runAppOnTizen2 = function() {
        logger.debug(moduleName, '================runAppOnTizen 2.4');
        var configFilePath = workspacePath + path.sep + 'config.xml';
        var appId = common.getConfAppID(configFilePath);
        var packageId = common.getPackageID(appId);

        //Uninstall package 
        var uninstallCommand =  SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_UNINSTALL + SPACE + packageId;
        logger.debug(moduleName, 'uninstallCommand:' + uninstallCommand);
        var result = innerProcess.execSync(uninstallCommand);
       
        // Install package to target Device     
        var installCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_INSTALL + SPACE + outputFullPath;
        // Lanuch App on target device              
        //var debugMode = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV) ? '--debug' : '';

        var launchCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_LAUNCH + SPACE + appId + SPACE + TIME_OUT;
        if(common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV){
            launchCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_DEBUG + SPACE + appId + SPACE + TIME_OUT; 
        }

        installAndLaunch(installCommand, launchCommand);

    };


    // Run app on tizen3.0 target
    var runAppOnTizen3 = function() {
        logger.debug(moduleName, '================runAppOnTizen 3.0');
        var configFilePath = workspacePath + path.sep + 'config.xml';
        var appId = common.getConfAppID(configFilePath);
        
        // Get packaged widget path

        //Set root authority
        logger.debug(moduleName, 'Set the priviledge as root');
        var rootCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_ROOT;
        innerProcess.execSync(rootCommand);

        //Push wgt to target device 
        logger.info(moduleName, 'Trying to push the wgt to target device');
        var localPath = outputFullPath;
        //var remotePath = 'opt/home/owner/apps_rw/tmp/';
        var remotePath = '/home/owner/share/tmp/sdk_tools/tmp/';
        var pushCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + SDB_COMMAND_PUSH + SPACE + localPath + SPACE + remotePath;
        logger.debug(moduleName, 'pushCommand:' + pushCommand);
        innerProcess.exec(pushCommand, function (error, stdout, stderr) {
            if (error) {
                var failPushMsg = 'Failed to push to widget to target';
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, failPushMsg);
                logger.error(moduleName, `exec error: ${error}`);
                logger.error(moduleName, failPushMsg);

                reject('fail');
                throw error;
            }
            logger.debug(moduleName, 'Push result:' + stdout);
            logger.info(moduleName, 'Pushed the widget target device successfully');

            var setVconfCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + 'shell 0 setRWIAppID' + SPACE + 'null';
            //If debug mode ,set vconf 
            if ((common.getFuncMode() == common.ENUM_COMMAND_MODE.DEBUGGER) || (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV)) {
                logger.debug(moduleName, 'If it is debug mode, set vconf to enable RWI');
                setVconfCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + 'shell 0 setRWIAppID' + SPACE + appId;      
            }
            logger.debug(moduleName, 'setVconfCommand:' + setVconfCommand);
            innerProcess.execSync(setVconfCommand);

            //Uninstall package 
            var uninstallCommand =  SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + WAS_COMMAND_UNINSTALL + SPACE + appId;
            logger.debug(moduleName, 'uninstallCommand:' + uninstallCommand);
            innerProcess.execSync(uninstallCommand);

            // Install package to target Device                 
            var appNameArray = outputFullPath.split(path.sep);
            var appName = appNameArray[appNameArray.length - 1];
            var installCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + WAS_COMMAD_INSTALL + SPACE + appId + SPACE + remotePath + appName;

            // Lanuch App on target device
            var launchCommand = SDB_PATH + SPACE + SDB_OPT_SERIAL + SPACE + WAS_COMMAD_LAUNCH + SPACE + appId;
            installAndLaunch(installCommand, launchCommand);

        });

    };


    //Install and luanch wgt 
    var installAndLaunch = function(installCommand, launchCommand) {
        logger.debug(moduleName, '================installAndLaunch');
        logger.info(moduleName, 'Start to install wgt to the device');
        logger.debug(moduleName, 'installCommand:' + installCommand);
        innerProcess.exec(installCommand, function (error, stdout, stderr) {
            if (error) {
                var installFailMsg = 'Failed install the App';
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, installFailMsg);
                logger.error(moduleName, `exec error: ${error}`);
                logger.error(moduleName, installFailMsg);
                throw error;
            }

            logger.debug(moduleName, 'Install result:' + stdout);
            if (stdout.indexOf('install failed') >= 0) {
                var failInstallApp = 'Failed install the App, please check';
                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, failInstallApp);
                logger.error(moduleName, failInstallApp);
                return;
            }
            logger.info(moduleName, 'Install the wgt successfully');
            
            // Output JS Log info from target Device 
            logger.debug(moduleName, 'Start the SDB dlog function ');
            const spawn = require('child_process').spawn;
            //const dlog = spawn(SDB_PATH, ['dlog', '-v', 'time', 'ConsoleMessage']);
            const dlog = spawn(SPAWN_SDB_PATH, ['-s', TARGET_IP, 'shell', '0', 'showlog', 'time']);

            dlog.stdout.on('data', function (data) {
                //console.log(`stdout: ${data}`);
                logger.debug(moduleName, `stdout: ${data}`);
            });

            dlog.stderr.on('data', function (data) {
                logger.error(moduleName, `stderr: ${data}`);
            });

            dlog.on('close', function (code) {
                logger.info(moduleName, 'child process exited with code ${code}');
            });


            logger.info(moduleName, 'Start to launch the app');
            logger.debug(moduleName, 'launchCommand:' + launchCommand);
            innerProcess.exec(launchCommand, function (error, stdout, stderr) {
                if (error) {
                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, 'Failed to launch the App');
                    logger.error(moduleName, `exec error: ${error}`);
                    throw err;
                }

                logger.debug(moduleName, 'Launch result:' + stdout);
                if (stdout.indexOf('fail') >= 0) {
                    var launchFailApp = 'Failed to launch the App, please check';
                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, launchFailApp);
                    logger.error(moduleName, launchFailApp);
                    return;
                }
                logger.info(moduleName, 'Launch your app successfully');
                
                // web inspector on tv mode
                if (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV)
                {
                    var debugIp = TARGET_IP +':7011';
                    //seqRequest(debugIp, false);
                    var httpRequestCount = 0;
                    launchTarget.seqRequest(httpRequestCount,debugIp, false,targetVersion);
                }
                else
                {
                    logger.info(moduleName, '==============================Run on TV end!');
                }

            });

            //logger.info(moduleName, '==============================Run on TV end!');

        });

    };


    return {
        // Handle 'Run on TV' command
        handleCommand:function() {

            // For getting compatible with sdb in Tizen Studio
            var INSTALLED_SDB_INSDK = common.getTizenStudioSdbPath();
            if (fs.existsSync(INSTALLED_SDB_INSDK)) {
                SPAWN_SDB_PATH = INSTALLED_SDB_INSDK;
                SDB_PATH = '\"' + INSTALLED_SDB_INSDK + '\"';
            }else{
                SPAWN_SDB_PATH = EXTENSION_PATH + path.sep + LIB_PATH + path.sep + SDB_FOLDER + path.sep + SDB_NAME;
                SDB_PATH = '\"' + SPAWN_SDB_PATH + '\"';
            }

            //moduleName = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV) ? 'Debug on TV' : 'Run on TV';
            //logger.info(moduleName, '==============================Run on TV start!');

            moduleName = (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV) ? 'WebInspector on TV' : 'Run on TV';
            logger.info(moduleName, '==============================' + 'Run on TV start!');

            var dirpath = common.getWorkspacePath();
            var targetip = common.getTargetIp();

            var promise = prepareInstall(dirpath, targetip);
            promise.then(runApp);
        },


        // Restart sdb to compatiable sdb server version and client version
        restartSdb:function() {

            logger.info(moduleName, 'Begin SDB restart');
            var killServerCommand = SDB_PATH + SPACE + 'kill-server';
            var startServerCommand = SDB_PATH + SPACE + 'start-server';

            //Kill Server to compatiable with client sdb version 
            logger.debug(moduleName, 'killServerCommand: ' + killServerCommand);
            try {

                var killServerResult = innerProcess.execSync(killServerCommand);
                logger.debug(moduleName, 'Kill completed: ' + killServerResult.toString());
            } catch (ex) {

                logger.warning(moduleName, 'Failed to kill exsiting SDB process');
                logger.debug(moduleName, ex.message);
            }

            // Start SDB again
            logger.debug(moduleName, 'startServerCommand: ' + startServerCommand);
            innerProcess.exec(startServerCommand, function (error, stdout, stderr) {

                if (error) {
                    logger.warning(moduleName, `Failed to start SDB server: ${error}`);
                    throw error;
                }

                logger.debug(moduleName, 'Started SDB server: ' + stdout);
            });
            common.sleepMs(2000);

        },


        // Send HTTP request to target device to get the TV debug webInspector URL
        seqRequest:function(httpRequestCount,debugIp,flag,targetversion) {
            
            logger.debug(moduleName, 'flag:' + flag);
            logger.info(moduleName, 'Remote WebInspector debugIp:' + debugIp);	
            httpRequestCount = httpRequestCount+1;
            var aUrl = 'http://'+debugIp+'/pagelist.json';
            var webInspectorValue = ''; //web inspector value in pagelist.json or json page
            if(targetversion == '3.0'){
                aUrl = 'http://'+debugIp+'/json';
            }
            
            logger.info(moduleName, 'Remote WebInspector requestUrl:' + aUrl);
            var timeoutEventId;
            var req = http.get(aUrl,function(res) {
                
                var resultdata = '';
                res.on('data',function(chunk) {
                    resultdata += chunk;           
                });

                res.on('end',function() {
                    //logger.info(moduleName, '================seqRequest to get Json data============= ');
                    if (res.statusCode !=200) {  
                        logger.info(moduleName, '================Resend Request to get Json data============= ');
                        launchTarget.seqRequest(httpRequestCount,debugIp, flag, targetversion);
                    }else{
                        logger.info(moduleName, '================Request to get Json data successfully============== ');
                        var responseArray = JSON.parse(resultdata);
                        var pages = responseArray.filter(function (target) { return target  });
                        logger.info(moduleName, 'WebInspectorURl.pages.length:' + pages.length);
                        
                        if(pages.length>0 && targetversion == '3.0'){
                            webInspectorValue = pages[0].devtoolsFrontendUrl;
                        }else if(pages.length>0 && targetversion == '2.4'){
                            webInspectorValue = pages[0].inspectorUrl;
                        }			
                    
                        if( webInspectorValue && (webInspectorValue !='')){

                            
                            //logger.info(moduleName, 'pages.length0:' + pages[0]);
                            logger.info(moduleName, 'WebInspectorURl.pages.inspectorUrl:' + webInspectorValue);
                            if ((common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_TV) || (common.getFuncMode() == common.ENUM_COMMAND_MODE.WEB_INSPECTOR_ON_EMULATOR)){          
                                var vscode = require('vscode');						
                                var chromeExceutePath = vscode.workspace.getConfiguration('tizentv')['chromeExecutable'];
                                logger.info(moduleName, 'Finding configured chromeExceutePath:' + chromeExceutePath);
                                if (chromeExceutePath == null || typeof(chromeExceutePath) == 'undefined')
                                {
                                    var chromeNotFound = 'Chrome exceutable file not found, please check and set the default path in user setting';
                                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, chromeNotFound);
                                    logger.error(moduleName, chromeNotFound);
                                    return;
                                }
                                
                                if (!fs.existsSync(chromeExceutePath)) {
                                    var nullPathMsg = "Cannot find the Chrome Executable, please configure it!";
                                    common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, nullPathMsg);
                                    logger.error(moduleName, nullPathMsg);
                                    //return;
                                    
                                    if (process.platform == 'linux') {
                                        chromeExceutePath = '/opt/google/chrome/google-chrome';
                                    } else if (process.platform == 'win32' ) {
                                        chromeExceutePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
                                    }else if ( process.platform == 'darwin') {
                                        chromeExceutePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
                                    }
                                }	
                                
            
                                var WebInspectorUrl = 'http://'+debugIp+webInspectorValue;
                                logger.info(moduleName, 'WebInspectorUrl:' + WebInspectorUrl);
                                
                                var startChromeCommand = '';						
                                
                                if (process.platform == 'win32' )
                                {
                                    startChromeCommand = '\"' + chromeExceutePath + '\"' + SPACE + '\"' + WebInspectorUrl + '\"';
                                }
                                else
                                {
                                    startChromeCommand = '\"' + chromeExceutePath + '\"' + SPACE + WebInspectorUrl;
                                }
                                // Launch the Web Inspector URL page in the chrome browser debugger
                                logger.debug(moduleName, 'startChromeCommand:' + startChromeCommand);
                                innerProcess.exec(startChromeCommand, function (error, stdout, stderr) {
                                    if (error) {
                                        logger.error(moduleName, `exec error: ${error}`);
                                        throw error;
                                    }

                                    //logger.info(moduleName, "stdout:" + stdout);
                                });
                                
                                
                                
                                flag = true;						
                            }else{                        
                                var modeErrMsg = "Google chrome's web inspector is not supported in current Tizen platform debug mode";
                                common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, modeErrMsg);
                                logger.error(moduleName, modeErrMsg);
                                return ;
                            }
                            
                        }else{
                            launchTarget.seqRequest(httpRequestCount,debugIp, flag, targetversion);      
                        }    
                        
                    }    
                });
            });

            req.on('error',function(err) {
                logger.error(moduleName, 'Failed to send request: ' + err.message);
                common.sleepMs(2000);
                if(!flag){
                    if(httpRequestCount <5){
                        logger.info(moduleName, 'Repeat request: ' + httpRequestCount + ' time, request 5 times for maxmimum');
                        launchTarget.seqRequest(httpRequestCount,debugIp,flag,targetversion);
                    }else{
                        var requestFailMsg = 'Failed to send request: '+ err.message+', please try later';
                        common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, requestFailMsg);
                        logger.error(moduleName, requestFailMsg);
                    }
                    
                }
                
            });


            req.on('timeout',function(err){
                logger.warning(moduleName, 'Http Request timeout, abort connection to Remote WebInspector!');
                req.abort();
            });

            timeoutEventId=setTimeout(function(){
                req.emit('timeout',{message:'have been timeout...'});
            },5000);     
        },

        // Handle 'Debug on TV 3.0' command
        prepareInstallForDebug:function(dirPath, targetIp) {
            logger.info(moduleName, '==============================Debug on TV 3.0 start!');    
            SPAWN_SDB_PATH = EXTENSION_PATH + path.sep + LIB_PATH + path.sep + SDB_FOLDER + path.sep + SDB_NAME;
            SDB_PATH = '\"' + SPAWN_SDB_PATH + '\"';   
	        workspacePath = dirPath;
            SDB_OPT_SERIAL = '-s ' + targetIp;             
            targetVersion = '3.0' ;
            TARGET_IP = targetIp ;
            runApp();  
        },

        //Get the device status by sdb devices command 
        getDeviceStatus:function(targetAddress) {
            logger.debug(moduleName, '================getDeviceStatus');
            //List devices    
            var devicesCommand = SDB_PATH + SPACE + 'devices';

            //console.log('devicesCommand:'+devicesCommand);      
            var listdata = innerProcess.execSync(devicesCommand);
            logger.debug(moduleName, 'devices result:' + listdata.toString());

            if (listdata.indexOf(targetAddress) < 0) {
                return false;
            } else {
                return true;
            }

        },

        // Get the current extension dir path 
        getExtensionPath:function() {
            logger.debug(moduleName, '================getExtensionPath');
            return EXTENSION_PATH;
        }
        
    };


})();
module.exports = launchTarget;