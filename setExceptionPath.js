
var setExceptionPath = (function() {
	// Imports
	var vscode = require('vscode');
	var os = require('os');
	var fs = require('fs');
	var path = require('path');

	//var parseString = require('xml2js').parseString;
	var common = require('./common');
	var logger = require('./logger');
	var ostype = os.type();
	var filepaths = null;
	var exceptionPaths = null;

	var SPACE = ' ';
	var moduleName = 'Set Exception Path';
	var workspacePath = '';
	var expconfname = 'buildExceptionPath.conf';
	//var explist = '';

	var showAllFeatures = function(){
		// Notify msg
		var selectTip = 'You can add, delete Exception Path.';
		var options = {
			placeHolder: selectTip,
			ignoreFocusOut: true
		};
        logger.info(moduleName, selectTip);

        // Templates
		var choices = [
			{ label: 'Check Exception Path', description: 'Check Exception Path' },
			{ label: 'Add Exception Path', description: 'Add Exception Path' },
			{ label: 'Delete Exception Path', description: 'Delete Exception Path' }
		];

        // Show App templates list
		vscode.window.showQuickPick(choices, options).then(function (choice) {
            // Cancel without selecting
			if (!choice) {

				var waringMsg = 'Cancelled the "Set Exception Path" without selecting operation!';
        		logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			//filepaths = getFilepaths();
			//logger.warning(moduleName, filepaths[0]);
			exceptionPaths = getExceptionPaths();
			// Select 'Check source'
			if (choice.label === 'Check Exception Path') {
				logger.info(moduleName, 'The "Check Exception Path" is selected');
				checkOrDelete(0);
				return;
			}
			// Select 'Add source'
			else if (choice.label === 'Add Exception Path') {
        		logger.info(moduleName, 'The "Add Exception Path" is selected');
				add();
				return;
			}
			// Select 'Delete source'
			else if (choice.label === 'Delete Exception Path') {
        		logger.info(moduleName, 'The "Delete Exception Path" is selected');
				checkOrDelete(1);
				return;
			}
		});

	};
	
	var getExceptionPaths = function()
	{
		var expfile = workspacePath+path.sep+ expconfname;
		var explist = [];
		if(fs.existsSync(expfile))
		{
			var expfiledata = fs.readFileSync(expfile, 'utf8');;
			explist = expfiledata.toString().split(";");
			for(var i =explist.length - 1;i >= 0;i --)
			{
				if(explist[i]=='')
				{
					explist.splice(i,1);
				}
			}
		}
		return explist;
		
	}

	var writetoFile = function()
	{
		var expfile = workspacePath+path.sep+ expconfname;
		var expfiledata = ';';
		if(exceptionPaths.length == 0)
		{
			if(fs.existsSync(expfile)) {
				try {
		
					fs.unlinkSync(expfile);
				} catch (ex) {
	
					logger.warning(moduleName, 'The existing '+ expfile + ' cannot be removed');
					logger.debug(moduleName, ex.message);
					return;
				}
			}
			return;
		}
		for(var i = 0;i < exceptionPaths.length;i ++)
		{
			expfiledata += exceptionPaths[i]+';';
		}
		fs.writeFileSync(expfile,expfiledata,'utf-8','w');
	}
	var add =function(){
		var sourcekey = '';
		var sourceurl = '';
		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Please input your Exception Path ' ,
			value: ''
		// Use input name
		}).then(function (input) {
			if (!input) {
				var dirNotDef = 'Cancelled the "Add Exception Path" without inputting path!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			var pathp = input.toString();
			if(path.sep == '\\')
			{
				pathp = pathp.replace(/\//g,path.sep);
			}
			var fullpath = workspacePath + path.sep + pathp;
			if(fs.existsSync(fullpath))
			{
				var stats = fs.statSync(fullpath);
				if (stats.isDirectory()){
					fullpath += path.sep;
				}
				for(var i = 0;i < exceptionPaths.length;i ++)
				{
					if(fullpath == exceptionPaths[i])
					{
						var nameMsg = 'Exception Path already exists';
						logger.warning(moduleName, nameMsg);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, nameMsg);
						throw nameMsg;		
					}
				}
				exceptionPaths.push(fullpath);
				writetoFile();
				logger.info(moduleName, 'Add path ('+fullpath+') successful!');
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Add path successful!');
			}
			else
			{
				var dirNotDef = 'Inputpath:'+fullpath+' is not exsit!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;

			}
		});
	};

	var checkOrDelete =function(checkOpration){
		if(exceptionPaths && exceptionPaths.length>0){
			var selectTip = 'You can select a source';
			var options = {
				placeHolder: selectTip
			};
			var Choices= new Array();
			for(var i = 0 ; i<exceptionPaths.length; i++){
				Choices.push({label: exceptionPaths[i]});
			}
			vscode.window.showQuickPick(Choices, options).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Check source" without selecting a key!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				var key = choice.label;
				var id = 0;
				for(;id < exceptionPaths.length;id ++)
				{
					if(key == exceptionPaths[id])
					{
						break;		
					}
				}
				if(id < exceptionPaths.length)
				{
					if(checkOpration == 0)
					{
					}
					else if (checkOpration == 1)
					{
						deleteById(id);
					}
				}
				else
				{
					var waringMsg = 'Selected error!!! ';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				}
			});
		}else{
			var waringMsg = 'There is no source ,you can add firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};

	var deleteById =function(id){
		var confirmTip = 'Are you sure you want to delete the '+ exceptionPaths[id]+' ?';
		options = {
			placeHolder: confirmTip
		};
		var confirmchoices = [
			{ label: 'Yes' },
			{ label: 'No'}
		];

		vscode.window.showQuickPick(confirmchoices, options).then(function (choice) {
			if (!choice) {
				waringMsg = 'Cancelled the "Delete" without select Yes or No to confirm';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			if(choice.label === 'Yes'){
				exceptionPaths.splice(id,1);
				writetoFile();
				logger.info(moduleName, 'Delete path successful!');
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Delete path successful!');
			}else{
				waringMsg = 'Cancelled the "Delete" process';
				logger.warning(moduleName,waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
			}
		});
		
	};

	return {
        // Handle 'Set Exception Path' command
        handleCommand:function() {
            logger.info(moduleName, '==============================Set Exception Path start!');
			//var workspacePath = common.getWorkspacePath();
			if (common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER && common.getFuncMode() != common.ENUM_COMMAND_MODE.DEBUGGER_TIZEN3_0_EMULATOR) {
				logger.debug(moduleName, 'If is debug mode ,set workspace to current work dir');
				workspacePath = common.getWorkspacePath();
			}
				// Check if there's workspace
			if (typeof(workspacePath) == 'undefined')
			{
				var noWorkspace = 'No project in workspace, please check!';
				logger.error(moduleName, noWorkspace);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.ERROR, noWorkspace);
				return;
			}


			showAllFeatures();
        }
	};

})();
module.exports = setExceptionPath;
