
// Imports
var vscode = require('vscode');
var os = require('os');
var fs = require('fs');
var async = require('async');
var path = require('path');
var Q = require('q');
var common = require('./common');
var logger = require('./logger');

// Path definition
var extensionPath = __dirname;
var defaultOutputDir = os.homedir() + path.sep + '.vscode';

// Templates' info
var selectedTmpPath = extensionPath + '/templates/Basic/Tizen_Blank/project';
var selectedTmpName = 'TV Basic App';

// Module name
var moduleName = 'Create Project';

// Handle 'Create Web Project' commands
function handleCommand() {

	logger.info(moduleName, '==============================Creat Web Project start!');

    // Create Web project by templates
	// New an 'FileContoller' instance
	// Execute App generation by steps
	var File = new FileController();
	File.showAllTemplates()
		.then(File.inputDirOfApp)
		.then(File.updateOutputPath)
		.then(File.generateApp)
		.catch(function (err) {

			// Show message when an error happen
			if (err) {
				logger.debug(moduleName, err);
			}
			var errMsg = 'Create Web Project failed!';
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, errMsg);
			logger.error(moduleName, errMsg);
		});

}
exports.handleCommand = handleCommand;

// Define FileController propotype
// Execute App generation by functions flow 
var FileController = (function () {

    // Constructor
    function FileController() {
    }

	// Show App templates list
	FileController.prototype.showAllTemplates = function () {

        logger.info(moduleName, "App's tempalte list was showed");
		var deferred = Q.defer();

        // Notify msg
		var selectTip = 'Please select a template:';
		var options = {
			placeHolder: selectTip
		};
        logger.info(moduleName, selectTip);

        // Templates
		var choices = [
			{ label: 'Empty App', description: 'Empty Template.' },
			{ label: 'TV Basic App', description: 'Samsung TV Basic Template.' },
			{ label: 'Empty_AngularJS App', description: 'Caph Empty Template for AngularJS.' },
			{ label: 'Empty_jQuery App', description: 'Caph Empty Template for jQuery.' },
			{ label: 'MasterDetail App', description: 'jQuery Mobile Empty Template for MasterDetail.' },
			{ label: 'MultiPage App', description: 'jQuery Mobile Empty Template for MultiPage.' },
			{ label: 'NavigationView App', description: 'jQuery Mobile Empty Template for NavigationView.' },
			{ label: 'SinglePage App', description: 'jQuery Mobile Empty Template for SinglePage.' }
		];

        // Show App templates list
		vscode.window.showQuickPick(choices, options).then(function (choice) {

            // Cancel without selecting
			if (!choice) {

				var waringMsg = 'Cancelled the "Create Web App" without selecting template!';
        		logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			// Select 'Empty App'
			if (choice.label === 'Empty App') {

				selectedTmpName = 'Empty App';
				selectedTmpPath = extensionPath + '/templates/Basic/Empty/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "Empty App" is selected');
				return;
			}
			// Select 'TV Basic App'
			else if (choice.label === 'TV Basic App') {

				selectedTmpName = 'TV Basic App';
				selectedTmpPath = extensionPath + '/templates/Basic/Tizen_Blank/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "TV Basic App" is selected');
				return;
			}
			// Select 'Empty_AngularJS App'
			else if (choice.label === 'Empty_AngularJS App') {

				selectedTmpName = 'Empty_AngularJS App';
				selectedTmpPath = extensionPath + '/templates/Caph/Empty_AngularJS/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "Empty_AngularJS App" is selected');
				return;
			}
			// Select 'Empty_jQuery App'
			else if (choice.label === 'Empty_jQuery App') {

				selectedTmpName = 'Empty_jQuery App';
				selectedTmpPath = extensionPath + '/templates/Caph/Empty_jQuery/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "Empty_jQuery App" is selected');
				return;
			}
			else if (choice.label === 'MasterDetail App') {

				selectedTmpName = 'MasterDetail App';
				selectedTmpPath = extensionPath + '/templates/jQuery Mobile/MasterDetail/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "MasterDetail App" is selected');
				return;
			}
			// Select 'MultiPage App'
			else if (choice.label === 'MultiPage App') {

				selectedTmpName = 'MultiPage App';
				selectedTmpPath = extensionPath + '/templates/jQuery Mobile/MultiPage/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "MultiPage App" is selected');
				return;
			}
			// Select 'NavigationView App'
			else if (choice.label === 'NavigationView App') {

				selectedTmpName = 'NavigationView App';
				selectedTmpPath = extensionPath + '/templates/jQuery Mobile/NavigationView/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "NavigationView App" is selected');
				return;
			}
			// Select 'SinglePage App'
			else if (choice.label === 'SinglePage App') {

				selectedTmpName = 'SinglePage App';
				selectedTmpPath = extensionPath + '/templates/jQuery Mobile/SinglePage/project';
				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The "SinglePage App" is selected');
				return;
			}
			// Use default 'TV Basic App'
			else {

				deferred.resolve(selectedTmpPath);
        		logger.info(moduleName, 'The default "TV Basic App" is selected');
				return;
			}

		});

		return deferred.promise;
	};

	// Get the App's path/name
    FileController.prototype.inputDirOfApp = function () {

        var deferred = Q.defer();

        var samplePath = process.platform === 'win32'?'"C:\\workdir\\appname"  ':'"/home/workdir/appname"  ';
        // Tip and default value
        vscode.window.showInputBox({
			ignoreFocusOut: true,
            prompt: 'Please input your workspace, as ' + samplePath,
            value: ''

		// Use input name
        }).then(function (appDir) {

            if (appDir) {
                deferred.resolve(appDir);
        		logger.info(moduleName, 'Use inputed App directory: ' + appDir);
            }
			else {
				var dirNotDef = 'Cancelled the "Create Web App" without inputting App name!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
        });

        return deferred.promise;
    };

	// Confirm the App's path/name
    FileController.prototype.updateOutputPath = function (appDir) {

        logger.debug(moduleName, 'Get appdir: ' + appDir);
		var deferred = Q.defer();

		var fullPath = '';

		// In not input directory case
		if (appDir.indexOf(path.sep) == -1) {

			var warning_path = 'The inputted directory is invalid!';
			logger.warning(moduleName, warning_path);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warning_path);
			throw warning_path;

		// In inputed directory case
		} else {
            
			// Format the directory URL
			var pathArray = appDir.split(path.sep);
			var i = 0;
			var flag = false;
			var containerDir = '';
			for (i = 0; i < pathArray.length - 1; i++) {

				if (pathArray[i] != '') {
					nullFlag = true;
				}
				containerDir = containerDir + pathArray[i] + path.sep;
			}
			logger.debug(moduleName, "The App's container dir is " + appDir);

            // Correct OS path case
			if (fs.existsSync(containerDir)) {

                // If the App name not defined, add 'webapp' automatically
				if (pathArray[pathArray.length - 1] == '')
				{
					var warning_name = 'The input workspace name is invalid!';
					logger.warning(moduleName, warning_name);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warning_name);
					throw warning_name;
				}
				deferred.resolve(appDir);
				logger.info(moduleName, 'The App will be put in defined path: ' + appDir);
	
            // Invalid OS path case
			} else {
				
				var warningMsg = 'Inputed directory is invalid!';
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warningMsg);
				logger.warning(moduleName, warningMsg);
				throw warningMsg;
			}
		}

		return deferred.promise;
    };

	// Generate App by inputed parameters
    FileController.prototype.generateApp = function(destPath) {

		logger.info(moduleName, 'App generating...');
        var deferred = Q.defer();

        // Copy template
		copyDir(selectedTmpPath, destPath, function (err) {
			
			// Copy failed
			if (err) {

				logger.warning(moduleName, 'Generate App failed for filesystem permission!');
				logger.debug(moduleName, err);
				throw err;

            // Copy sucesfully
			} else {

				logger.info(moduleName, 'Folder generated');
				var randomID = common.GetRandomNum(10);
				var WIDGETDID = path.basename(destPath);
				var applicationId = randomID + '.' + WIDGETDID;
				logger.info(moduleName, 'The random App ID is: ' + applicationId);

				common.writeConfigXml(applicationId, randomID, destPath + path.sep + 'config.xml');
				// add the <name> attribute in the config.xml
				common.writeConfigXmlNameAttr(WIDGETDID, destPath + path.sep + 'config.xml');
				logger.info(moduleName, 'The config.xml was updated');

				updateWorkspace(destPath);
				//deferred.resolve(destPath);
			}

			logger.info(moduleName, '==============================Creat Web Project end!');
        });

        return deferred.promise;
    };

    return FileController;
})();
exports.FileController = FileController;

// Open the generated App
function updateWorkspace (destPath) {

	logger.debug(moduleName, 'Open the generated App into workspace');

	// Format the uri
	var uri = vscode.Uri.parse(destPath);
	// In windows, the disk path D: etc. cannot be parsed, format it manually
	if (process.platform === 'win32')
	{
		var pathArray = destPath.split(path.sep);
		uri._path = pathArray[0] + uri._path;
	}
	vscode.commands.executeCommand('vscode.openFolder', uri);
}

// Make dir
function mkdirs(p, mode, f, made) {

	if (typeof mode === 'function' || mode === undefined) {
		f = mode;
		mode = 0777 & (~process.umask());
	}
	if (!made)
		made = null;

	var cb = f || function () { };
	if (typeof mode === 'string')
		mode = parseInt(mode, 8);
	p = path.resolve(p);

	fs.mkdir(p, mode, function (er) {
		if (!er) {
			made = made || p;
			return cb(null, made);
		}
		switch (er.code) {
			case 'ENOENT':
				mkdirs(path.dirname(p), mode, function (er, made) {
					if (er) {
						cb(er, made);
					} else {
						mkdirs(p, mode, cb, made);
					}
				});
				break;

			// In the case of any other error, just see if there's a dir
			// there already.  If so, then hooray!  If not, then something
			// is borked.
			default:
				fs.stat(p, function (er2, stat) {
					// if the stat fails, then that's super weird.
					// let the original error be the failure reason.
					if (er2 || !stat.isDirectory()) {
						cb(er, made);
					} else {
						cb(null, made);
					}
				});
				break;
		}
	});
}

// Count the files that need to be copied
function _ccoutTask(from, to, cbw) {

	async.waterfall([
		function (callback) {
			fs.stat(from, callback);
		},
		function (stats, callback) {
			if (stats.isFile()) {
				cbw.addFile(from, to);
				callback(null, []);
			} else if (stats.isDirectory()) {
				fs.readdir(from, callback);
			}
		},
		function (files, callback) {
			if (files.length) {
				for (var i = 0; i < files.length; i++) {
					_ccoutTask(path.join(from, files[i]), path.join(to, files[i]), cbw.increase());
				}
			}
			callback(null);
		}
	], cbw);
}

// wrap the callback before counting
function ccoutTask(from, to, cb) {
	var files = [];
	var count = 1;

	function wrapper(err) {
		count--;
		if (err || count <= 0) {
			cb(err, files);
		}
	}
	wrapper.increase = function () {
		count++;
		return wrapper;
	};
	wrapper.addFile = function (file, dir) {
		files.push({
			file: file,
			dir: dir
		});
	};

	_ccoutTask(from, to, wrapper);
}

// Copy a single file
function copyFile(file, toDir, cb) {
	async.waterfall([
		function (callback) {
			fs.exists(toDir, function (exists) {
				if (exists) {
					callback(null, false);
				} else {
					callback(null, true);
				}
			});
		}, function (need, callback) {
			if (need) {
				mkdirs(path.dirname(toDir), callback);
			} else {
				callback(null, true);
			}
		}, function (p, callback) {
			var reads = fs.createReadStream(file);
			var writes = fs.createWriteStream(path.join(path.dirname(toDir), path.basename(file)));
			reads.pipe(writes);
			//don't forget close the  when  all the data are read
			reads.on('end', function () {
				writes.end();
				callback(null);
			});
			reads.on('error', function (err) {
				logger.error(moduleName, 'error occur in reads');
				callback(true, err);
			});

		}
	], cb);

}

//copy a directory
function copyDir(from, to, cb) {
    if (!cb) {
		cb = function () { };
	}
	async.waterfall([
		function (callback) {
			fs.exists(from, function (exists) {
				if (exists) {
					callback(null, true);
				} else {
					logger.warning(from + ' not exists');
					callback(true);
				}
			});
		},
		function (exists, callback) {
			fs.stat(from, callback);
		},
		function (stats, callback) {
			if (stats.isFile()) {
				// one file copy
				copyFile(from, to, function (err) {
					if (err) {
						// break the waterfall
						callback(true);
					} else {
						callback(null, []);
					}
				});
			} else if (stats.isDirectory()) {
				ccoutTask(from, to, callback);
			}
		},
		function (files, callback) {
			// prevent reaching to max file open limit		    
			async.mapLimit(files, 10, function (f, cb) {
				copyFile(f.file, f.dir, cb);
			}, callback);
		}
	], cb);
}
