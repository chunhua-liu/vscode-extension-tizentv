var certificateManager = (function(){
	// Imports
	var vscode = require('vscode');
	var os = require('os');
	var fs = require('fs');
	var path = require('path');
	var common = require('./common');
	var logger = require('./logger');
	var p12ToPem = require('./p12ToPem');
	var parseString = require('xml2js').parseString;
	var generateCertificate = require('./generateCertificate');

	//Certificate Resources
	var extensionPath = __dirname;
	var developerCA = extensionPath + '/resource/certificate-generator/certificates/developer/tizen-developer-ca.cer';
	var distributorCA = extensionPath + '/resource/certificate-generator/certificates/distributor/tizen-distributor-ca.cer';
	var distributorSigner = extensionPath + '/resource/certificate-generator/certificates/distributor/tizen-distributor-signer.p12';
	var distributorSignerPassword = 'tizenpkcs12passfordsigner';
	var ResourcePath = extensionPath + '/resource';
	var AuthorPath = ResourcePath + '/Author';
	var profilePath = ResourcePath + '/profiles.xml';


	// Module name
	var moduleName = 'Certificate Manager';

	//profile INFO
	var profileName = '';
	var authorCertPath = '';
	var authorPassword = '';
	var authorCertName = '';

	//Optional Info to create Author Certificate
	var countryInfo , stateInfo, cityInfo, organizationInfo, DepartmentInfo, EmailInfo;

	var authorFlag = 'create'; // To distinguish create or select a author certificate
    var activeFlag = false ; // To distinguish whether set the new profile as active

	var showAllFeatures = function(){
		// Notify msg
		var selectTip = 'You can create, remove or active a profile.';
		var options = {
			placeHolder: selectTip,
			ignoreFocusOut: true
		};
        logger.info(moduleName, selectTip);

        // Templates
		var choices = [
			{ label: 'Create Profile', description: 'Create a new profile' },
			{ label: 'Remove Profile', description: 'Remove a profile' },
			{ label: 'Set Active Profile', description: 'Set a profile to active' },
			{ label: 'Change Certificate Info', description: 'You can check or change the certificates of the selected certificate profile'}

		];

        // Show App templates list
		vscode.window.showQuickPick(choices, options).then(function (choice) {
            // Cancel without selecting
			if (!choice) {

				var waringMsg = 'Cancelled the "Certificate Manager" without selecting operation!';
        		logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			// Select 'Create Profile'
			if (choice.label === 'Create Profile') {
				logger.info(moduleName, 'The "Create Profile" is selected');
				createProfile();
				return;
			}
			// Select 'Remove Profile'
			else if (choice.label === 'Remove Profile') {
        		logger.info(moduleName, 'The "Remove Profile" is selected');
				removeProfile();
				return;
			}
			// Select 'Set Active Profile'
			else if (choice.label === 'Set Active Profile') {
        		logger.info(moduleName, 'The "Set Active Profile" is selected');
				setActiveProfile();
				return;
			}// Select 'Change Certificate Info'
			else if (choice.label === 'Change Certificate Info') {
        		logger.info(moduleName, 'The "Change Certificate Info" is selected');
				showCertificateInfo();
				return;
			}
		});

    };

	var createProfile =function(){
		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Please input your certificate profile name ' ,
			value: ''
		// Use input name
		}).then(function (name) {
			if (!name) {
				var dirNotDef = 'Cancelled the "Create Profile" without inputting certificate profile name!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			if(!checkProfileName(name))
			{
				var nameMsg = 'A certificate profile with the same name already exists';
				logger.warning(moduleName, nameMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, nameMsg);
				throw nameMsg;
			}
			profileName = name;

			var selectTip = 'You can create a new author certificate or select an existing author certificate ';
			var options = {
				placeHolder: selectTip,
				ignoreFocusOut: true
			};

			// Templates
			var createChoices = [
				{ label: 'Create a new author certificate' },
				{ label: 'Select an existing author certificate'}
			];
			vscode.window.showQuickPick(createChoices, options).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Create profile" without selecting operation!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				// Select 'Empty App'
				if (choice.label === 'Create a new author certificate') {
					authorFlag = 'create';
					var tipsMsg = 'You can set optional info for create author certificate in the settings.json,please refer File->Preference->User Settings';
					logger.warning(moduleName, tipsMsg);
					//setTimeout(createAuthorCertificate,5000);
					createAuthorCertificate();
				}else if(choice.label === 'Select an existing author certificate'){
					authorFlag = 'select';
					selectAuthorCertificate();
				}

			});

		});

	};

	var createAuthorCertificate =function(){
		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Please enter the author certificate file name ' ,
			value: ''
		}).then(function (value1) {
			if(!value1){
				var dirNotDef = 'Cancelled "Create profile" without inputting the author certificate file name!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			if(!checkCertificateName(value1)){
				var cerMsg = 'A key file with the same name already exists';
				logger.warning(moduleName, cerMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, cerMsg);
				throw cerMsg;

			}

			authorCertName = value1;
			authorCertPath = AuthorPath + '/'+value1+'.p12';

			vscode.window.showInputBox({
					ignoreFocusOut: true,
					password: true,
					prompt: 'Please enter the author certificate password you are creating' ,
					value: ''
				}).then(function(password){
					if(!password){
						var passNotDef = 'Cancelled "Create profile" without inputting the author certificate password!';
						logger.warning(moduleName, passNotDef);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, passNotDef);
						throw passNotDef;
					}else{
						authorPassword = password;
						vscode.window.showInputBox({
							ignoreFocusOut: true,
							password: true,
							prompt: 'Please enter the confirm password' ,
							value: ''
						// Use input name
						}).then(function(confirmPass){
							if(!confirmPass){
								var confirmWarn = 'Cancelled "Create profile" without inputting the confirm password';
								logger.warning(moduleName, confirmWarn);
								common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, confirmWarn);
								throw confirmWarn;
							}
							if(confirmPass != password)
							{
								var confirmWarn = 'The confirm password you entered is not the same with password entered ';
								logger.warning(moduleName, confirmWarn);
								common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, confirmWarn);
								throw confirmWarn;
							}
							setOptionalInfo();

						});

					}

				});

		});
	};

	var selectAuthorCertificate =function(){
		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Please enter the Author certificate file location ' ,
			value: ''
		// Use input name
		}).then(function (authorpath) {
			if(!authorpath){
				var dirNotDef = 'Cancelled "Create profile" without inputting the Author certificate file location';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			var extension = path.extname(authorpath);
			if(fs.existsSync(authorpath) && extension == '.p12'){
				authorCertPath = authorpath;
				vscode.window.showInputBox({
					ignoreFocusOut: true,
					password: true,
					prompt: 'Please enter the author certificate password you selected ' ,
					value: ''
				// Use input name
				}).then(function(password){
					if(!password){
						var passNotDef = 'Cancelled "Create profile" without inputting the selected author certificate password!';
						logger.warning(moduleName, passNotDef);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, passNotDef);
						throw passNotDef;
					}else{
						authorPassword = password;
						setDistributorCertificate();
					}

				});
			}else{
				var waringMsg = 'The author certificate path you entered is not correct';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;

			}

		});
	};

	var setOptionalInfo =function(){
		var optionalCountry = vscode.workspace.getConfiguration('tizentv')['certificateManager']['Country'];
		if( optionalCountry ){
			if(optionalCountry.length == 2){
				countryInfo = optionalCountry;
			}else{
				var optionMsg = '(Optional) Country info for creating author certificate, two characters limit, eg: CN';
				logger.warning(moduleName, optionMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, optionMsg);
				throw optionMsg;
			}
		}

		if(vscode.workspace.getConfiguration('tizentv')['certificateManager']['State']){
			stateInfo = vscode.workspace.getConfiguration('tizentv')['certificateManager']['State'];
		}

		if(vscode.workspace.getConfiguration('tizentv')['certificateManager']['City']){
			cityInfo = vscode.workspace.getConfiguration('tizentv')['certificateManager']['City'];
		}

		if(vscode.workspace.getConfiguration('tizentv')['certificateManager']['Orgnaization']){
			organizationInfo = vscode.workspace.getConfiguration('tizentv')['certificateManager']['Orgnaization'];
		}

		if(vscode.workspace.getConfiguration('tizentv')['certificateManager']['Department']){
			DepartmentInfo = vscode.workspace.getConfiguration('tizentv')['certificateManager']['Department'];
		}

		if(vscode.workspace.getConfiguration('tizentv')['certificateManager']['Email']){
			EmailInfo = vscode.workspace.getConfiguration('tizentv')['certificateManager']['Email'];
		}

		//console.log(countryInfo+' '+stateInfo+' '+cityInfo+' '+organizationInfo+' '+DepartmentInfo+' '+EmailInfo+' ')

		setDistributorCertificate();

	};

	var setDistributorCertificate =function(){
		var selectTip = 'You can use the default Tizen distributor certificate or select a distributor certificate for an another app store';
		var options = {
			placeHolder: selectTip,
			ignoreFocusOut: true
		};
		var distributorChoices = [
			{ label: 'Use the default Tizen distributor certificate' },
			{ label: 'Select a distributor certificate for an another app store'}
		];
		vscode.window.showQuickPick(distributorChoices, options).then(function (choice) {
			if (!choice) {
				var waringMsg = 'Cancelled the "Create profile" without selecting distributor certificate';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}

			// Select 'Empty App'
			if (choice.label == 'Select a distributor certificate for an another app store' ) {
				selectDistributorCertificate();
			}else{
				finishOrCancel();
			}

		});
	};

	var selectDistributorCertificate =function(){
		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: 'Please enter the Distributor certificate file location ' ,
			value: ''
		// Use input name
		}).then(function (distributorpath) {
			if(!distributorpath){
				var dirNotDef = 'Cancelled "Create profile" without inputing the Distributor certificate file location!';
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			var extension = path.extname(distributorpath);
			if(fs.existsSync(distributorpath) && extension == '.p12'){
				distributorSigner = distributorpath;
				vscode.window.showInputBox({
					ignoreFocusOut: true,
					password: true,
					prompt: 'Please enter the Distributor certificate password you selected ' ,
					value: ''
				// Use input name
				}).then(function(password){
					if(!password){
						var passNotDef = 'Cancelled "Create profile" without inputting the selected Distributor certificate password!';
						logger.warning(moduleName, passNotDef);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, passNotDef);
						throw passNotDef;
					}else{
						distributorSignerPassword = password;
						finishOrCancel();
					}

				});
			}else{

				var waringMsg = 'The Distributor certificate file Location you entered is not correct';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;

			}

		});
	};

	var finishOrCancel =function(){
		var selectTip = 'You can Finish or Cancel "Create Profile" process';
		var options = {
			placeHolder: selectTip,
			ignoreFocusOut: true
		};
		var finishChoices = [
			{ label: 'Finish' },
			{ label: 'Cancel'}
		];
		vscode.window.showQuickPick(finishChoices, options).then(function (choice) {
			if (!choice) {
				var waringMsg = 'Cancelled the "Create profile" without selecting Finish or Cancel!';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			// Select 'Empty App'
			if (choice.label === 'Finish' ) {
				if(authorFlag == 'create'){
					generateAuthorCert();
				}
				var profileNum = getProfileItems().itemNum;
				/*if(profileNum>0){
					setActiveOrNot();
				}else{*/
					activeFlag = true;
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'This certificate profile will be set as active');
					registerProfile();
				//}

			}
		});

	};

	var setActiveOrNot =function(){
		var selectTip = 'Set the new profile as active?';
		var options = {
			placeHolder: selectTip,
			ignoreFocusOut: true
		};
		var activeChoices = [
			{ label: 'Yes' },
			{ label: 'No'}
		];
		vscode.window.showQuickPick(activeChoices, options).then(function (choice) {
			if (!choice) {
				var waringMsg = 'Cancelled the "Create profile" without selecting Yes or No';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}

			// Select 'Empty App'
			if (choice.label === 'Yes' ) {
				activeFlag = true;
			}
			registerProfile();
		});
	};

	var generateAuthorCert =function(){
		common.createDir(AuthorPath);
		if(profileName != '' && authorCertPath !='' && authorPassword !=''&& authorCertName !=''){
			logger.info(moduleName, 'profileName:'+profileName);
			logger.info(moduleName, 'authorCertPath:'+authorCertPath);
			logger.info(moduleName, 'authorCertName:'+authorCertName);
			generateCertificate.createCert(authorCertName, authorCertPath, authorPassword, countryInfo, stateInfo, cityInfo, organizationInfo, DepartmentInfo, EmailInfo);
		}else{
			var waringMsg = 'The info you entered is not enough for create Author Certificate';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
			throw waringMsg;
		}

	};

	var registerProfile =function(){
		logger.info(moduleName,'Register certificate to profile: '+profilePath );
		var encryptedAuthorPassword = p12ToPem.encryptPassword(authorPassword);
		var encryptedDistributorPassword = p12ToPem.encryptPassword(distributorSignerPassword);

		var profilePrefix = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'+
			'<profiles active=\"'+profileName + '\" version="3.1">\n';

		var profileItem = '<profile name=\"'+profileName + '\">\n' +
			'<profileitem ca=\"'+developerCA +'\" distributor="0" key=\"'+authorCertPath+'\" password=\"'+encryptedAuthorPassword+'\" rootca=""/>\n' +
			'<profileitem ca=\"'+distributorCA +'\" distributor="1" key=\"'+distributorSigner+'\" password=\"'+encryptedDistributorPassword+'\" rootca=""/>\n' +
			'<profileitem ca="" distributor="2" key="" password="xmEcrXPl1ss=" rootca=""/>\n' +
			'</profile>\n';

		if(fs.existsSync(profilePath)){
			var originContent = fs.readFileSync(profilePath);
			originContent = originContent.toString();
			var newContent = '';
			var strPrefix = '';
			var strVersion = '';
			var strEndProfiles = '';
			if(activeFlag){
				var strBeginActive = originContent.indexOf('<profiles active=');
				strPrefix = originContent.substring(0,strBeginActive+17) + '\"' + profileName + '\"';
				strVersion= originContent.indexOf('version=\"3.1\"');
				strEndProfiles= originContent.indexOf('</profiles>');
				var strContent = originContent.substring(strVersion-1,strEndProfiles );
				newContent = strPrefix + strContent + profileItem+'</profiles>';

			}else{
				strEndProfiles= originContent.indexOf('</profiles>');
				var strContent = originContent.substring(0,strEndProfiles );
				newContent = strContent +profileItem+ '</profiles>';
			}

			fs.writeFileSync(profilePath, newContent);
		}else{
			profileItem = profilePrefix + profileItem + '</profiles>';
			fs.writeFileSync(profilePath, profileItem);
		}

		common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Creating new profile successful');

	};

	var getProfileItems =function(){
		var itemNum = 0;
		var nameArray = new Array();
		if(fs.existsSync(profilePath)){
			var data = fs.readFileSync(profilePath,'utf-8');
			//parse profiles.xml file to get author and distributor p12 certificate file
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);

				var profiles = jsonArray.profiles.profile;
				var name = '';
				if(profiles && (!profiles.length)){ //For only one profile case
					itemNum = 1;
					name = profiles.$.name;
					nameArray.push(name);
				}else if(profiles && profiles.length){ //For multiple profile case
					itemNum = profiles.length;
					for(var i = 0; i<profiles.length;i++){
						name = profiles[i].$.name;
						nameArray.push(name);
					}
				}

			});
		}

		return {itemNum, nameArray};
	};

	var getActiveProfileName = function(){
		logger.info(moduleName, '================Load Profile');
		var activeName = '';
		if(fs.existsSync(profilePath)){
			logger.info(moduleName, 'Profile file path:'+profilePath);
			var data = fs.readFileSync(profilePath,'utf-8');
			//parse profiles.xml file to get author and distributor p12 certificate file
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);
				if(jsonArray.profiles.$.active){
					activeName = jsonArray.profiles.$.active ;
				}
			});
		}
		return activeName;
	};

	var checkProfileName =function(name) {
		var nameFlag = true;
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			for(var i = 0;i< profileNames.length;i++){
				if(name == profileNames[i]){
					nameFlag = false;
					break;
				}
			}
		}
		return nameFlag ;
	};

	var checkCertificateName =function(name){
		var flag = true;
		var certName = AuthorPath + '/'+ name+'.p12';
		if(fs.existsSync(certName)){
			flag = false;
		}
		return flag ;
	};

	var removeProfile =function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			var selectTip = 'You can select a profile to remove from the profile list ';
			var options = {
				placeHolder: selectTip,
				ignoreFocusOut: true
			};
			var activeProfileName = getActiveProfileName();
			var removeChoices= new Array();
			for(var i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					removeChoices.push({label: profileNames[i]+' (active)'});
				}else{
					removeChoices.push({label: profileNames[i]});
				}

			}
			vscode.window.showQuickPick(removeChoices, options).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Remove Profile" without selecting a profile to remove!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				var removeName = choice.label;
				var confirmTip = 'Are you sure you want to remove the '+ choice.label+' certificate profile?';
				options = {
					placeHolder: confirmTip,
					ignoreFocusOut: true
				};
				var confirmchoices = [
					{ label: 'Yes' },
					{ label: 'No'}
				];

				vscode.window.showQuickPick(confirmchoices, options).then(function (choice) {
					if (!choice) {
						waringMsg = 'Cancelled the "Remove Profile" without select Yes or No to confirm';
						logger.warning(moduleName, waringMsg);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
						throw waringMsg;
					}
					if(choice.label == 'Yes'){
						removeProfileItem(removeName);
					}else{
						waringMsg = 'Cancelled the "Remove Profile" process';
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					}

				});

			});
		}else{
			var waringMsg = 'There is no profiles to delete ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};

	var setActiveProfile = function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length > 0){
			var selectTip = 'You can set active profile from the profile list ';
			var options = {
				placeHolder: selectTip,
				ignoreFocusOut: true
			};
			var activeProfileName = getActiveProfileName();
			var activeChoices= new Array();
			for(var i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					activeChoices.push({label: profileNames[i]+' (active)'});
				}else{
					activeChoices.push({label: profileNames[i]});
				}

			}

			vscode.window.showQuickPick(activeChoices, options).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Set Active Profile" without selecting a profile!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}

				if(choice.label == activeProfileName+' (active)')
				{
					var waringMsg1 = 'The profile you selected is already the active profile';
					logger.warning(moduleName, waringMsg1);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg1);
					throw waringMsg1;
				}

				var activeName = choice.label;
				setActiveProfileItem(activeName);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Set active profile'+activeName+ ' successful');

			});
		}else{
			var waringMsg = 'There is no profiles to set active ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}


	};

	var removeProfileItem =function(name){
		logger.info(moduleName, '================Remove a profile item');
		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var newContent = '';
			var isActiveFlag = false;
			if(name.indexOf('(active)') > 0){ // Remove active item ,set the first item to active item
				name = name.substring(0, name.indexOf('(active)') - 1);
				isActiveFlag = true;
			}
			var authorFile = AuthorPath + '/' + name + '.p12';
			// Delete the author's p12 file
			fs.unlink(authorFile, function(err) {
				if (err && fs.existsSync(authorFile)) {
					var cannotDele = 'The ' + name + '.p12 cannot be deleted, please remove manually!';
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, cannotDele);
					logger.warning(moduleName, cannotDele);
				} else {
					logger.info(moduleName, 'The ' + name + '.p12 has been deleted!');
				}
			});
			var nextName = getNextProfileItem(name);
			var strRemoveBegin = profileContent.indexOf('<profile name=\"'+name+'\">');
			var strNextItemBegin = '';
			if(nextName !=''){ // Next profile Item exist
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}else{ //The remove item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			if(strRemoveBegin >0 && strNextItemBegin>0){
				newContent = profileContent.substring(0,strRemoveBegin) + profileContent.substring(strNextItemBegin,profileContent.length);
			}

			fs.writeFileSync(profilePath, newContent);

			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, 'Remove '+name+ ' profile successful');
			if(isActiveFlag){ // Set the first profile item as active profile
				var updatedProfileNames = getProfileItems().nameArray;
				if(updatedProfileNames && updatedProfileNames.length>0 ){
					setActiveProfileItem(updatedProfileNames[0]);
				}
			}

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};

	var setActiveProfileItem =function(name){
		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var strBeginActive = profileContent.indexOf('<profiles active=');
			strPrefix = profileContent.substring(0,strBeginActive+17) + '\"' + name + '\"';
			strVersion= profileContent.indexOf('version=\"3.1\"');
			var strContent = profileContent.substring(strVersion-1 , profileContent.length );
			var newContent = strPrefix + strContent;
			fs.writeFileSync(profilePath, newContent);
		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}

	};

	var showCertificateInfo = function(){
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length > 0){
			var selectTip = 'You can check or change the certificates info of the selected certificate profile ';
			var options = {
				placeHolder: selectTip,
				ignoreFocusOut: true
			};
			var activeProfileName = getActiveProfileName();
			var selectChoices= new Array();
			for(var i = 0 ; i<profileNames.length; i++){
				if(activeProfileName == profileNames[i]){
					selectChoices.push({label: profileNames[i]+' (active)'});
				}else{
					selectChoices.push({label: profileNames[i]});
				}

			}

			vscode.window.showQuickPick(selectChoices, options).then(function (choice) {
				if (!choice) {
					var waringMsg = 'Cancelled the "Change Certificate Info" without selecting a certificate profile!';
					logger.warning(moduleName, waringMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
					throw waringMsg;
				}
				var name = choice.label;
				if(name.indexOf('(active)') > 0){ // Remove active item ,set the first item to active item
					name = name.substring(0, name.indexOf('(active)') - 1);
				}

				var selectResult = searchProfileItem(name);

				if(!selectResult){
					var warningMsg = 'Can not find '+ name + 'certificate profile in profiles.xml';
					logger.warning(moduleName, warningMsg);
					common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, warningMsg);
					throw waringMsg;
				}
				var authorCert='';
				var authorPass ='';
				var distributorCert1='';
				var distributor1Pass='';
				var distributorCert2='';
				var distributor2Pass='';

				if(selectResult){
					authorCert = selectResult.authorFile;
					authorPass = selectResult.authorPassword;
					distributorCert1 = selectResult.distributorFile1;
					distributor1Pass = selectResult.distributorPassword1;
					distributorCert2 = selectResult.distributorFile2;
					distributor2Pass = selectResult.distributorPassword2;
				}

				var certificateTip = 'You can check Author Certificate or Distributor Certificate or Add Distributor';
				options = {
					placeHolder: certificateTip,
					ignoreFocusOut: true
				};

				var checkchoices = [
					{ label: 'Author Certificate: '+path.basename(authorCert)},
					{ label: 'Distributor Certificate1: '+path.basename(distributorCert1)}
				];

				if(distributorCert2 != ''){ // only one distributor
					checkchoices.push({ label: 'Distributor Certificate2: '+path.basename(distributorCert2)});
				}

				vscode.window.showQuickPick(checkchoices, options).then(function (choice) {
					if (!choice) {
						waringMsg = 'Cancelled the "Change Certificate Info" without select Author or Distributor Certificate';
						logger.warning(moduleName, waringMsg);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
						throw waringMsg;
					}
					if(choice.label.indexOf('Author Certificate:') >=0){
						checkOrChange('author', 1, authorCert, authorPass, name);

					}else if (choice.label.indexOf('Distributor Certificate1:') >=0){
						checkOrChange('distributor1', checkchoices.length, distributorCert1, distributor1Pass, name);
					}else if(choice.label.indexOf('Distributor Certificate2:') >=0){
						checkOrChange('distributor2', checkchoices.length, distributorCert2, distributor2Pass, name);
					}

				});

			});
		}else{
			var waringMsg = 'There is no avaliable profile ,you can create profile firstly ';
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}


	};

	var checkOrChange = function(type, number , certPath,password, profilename){
		var certificateTip = 'You can check the certificate Information or change Certificate ';
		options = {
			placeHolder: certificateTip,
			ignoreFocusOut: true
		};

		var choices = [
			{ label: 'Change Certificate'},
			{ label: 'Certificate Information'}
		];
		if(type != 'author' ){
			if(number>2){
				choices.push({label: 'Remove Certificate' });
			}else{
				choices.push({label: 'Add Distributor Certificate'});
			}
		}

		vscode.window.showQuickPick(choices, options).then(function (choice) {
			if (!choice) {
				waringMsg = 'Cancelled the "Change Certificate Info" without any operation';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			if(choice.label == 'Certificate Information'){
				detailCertificateInfo(certPath,password);
			}else if (choice.label == 'Change Certificate' || choice.label == 'Add Distributor Certificate'){
				changeCertificate(choice.label, type, profilename);
			}else if (choice.label == 'Remove Certificate'){
				removeDistributorCert( type, profilename, certPath);
			}

		});

	};

	var changeCertificate = function(label, type, profilename){
		var promptMsg1 = 'Please enter the Author certificate file location you want to change ';
		var dirNotDef = 'Cancelled "change certificate" without inputting the Author certificate file location';
		var passNotDef = 'Cancelled "change certificate" without inputting the changed author certificate password!';

		if(type != 'author'){
			if(label == 'Change Certificate'){
				promptMsg1 = 'Please enter the Distributor certificate file location you want to change ';
				dirNotDef = 'Cancelled "Change certificate" without inputting the Distributor certificate file location';
				passNotDef = 'Cancelled "Change certificate" without inputting the changed distributor certificate password!';
			}else if(label == 'Add Distributor Certificate'){
				promptMsg1 = 'Please enter the Distributor certificate file location you want to add ';
				dirNotDef = 'Cancelled "Add Distributor Certificate" without inputting the Distributor certificate file location';
				passNotDef = 'Cancelled "Add Distributor Certificate" without inputting the added distributor certificate password!';
			}

		}

		vscode.window.showInputBox({
			ignoreFocusOut: true,
			prompt: promptMsg1 ,
			value: ''
		// Use input name
		}).then(function (certpath) {
			if(!certpath){
				logger.warning(moduleName, dirNotDef);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, dirNotDef);
				throw dirNotDef;
			}
			var extension = path.extname(certpath);
			if(fs.existsSync(certpath) && extension == '.p12'){
				vscode.window.showInputBox({
					ignoreFocusOut: true,
					password: true,
					prompt: 'Please enter the certificate password you selected ' ,
					value: ''
				// Use input name
				}).then(function(password){
					if(!password){
						logger.warning(moduleName, passNotDef);
						common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, passNotDef);
						throw passNotDef;
					}else{
						modifyProfileItem(label, type, profilename, certpath, password );
					}

				});
			}else{
				var waringMsg = 'The certificate path you entered is not correct';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;

			}

		});

	};

	var removeDistributorCert = function( type, profilename, certPath){
		var certificateTip = 'Are you sure you want to remove the '+path.basename(certPath) + ' certificate';
		options = {
			placeHolder: certificateTip,
			ignoreFocusOut: true
		};

		var choices = [
			{ label: 'Yes'},
			{ label: 'No'}
		];

		vscode.window.showQuickPick(choices, options).then(function (choice) {
			if (!choice) {
				var waringMsg = 'Cancelled the "Remove Certificate" without select Yes or No';
				logger.warning(moduleName, waringMsg);
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
				throw waringMsg;
			}
			if(choice.label == 'Yes'){
				removeDistributorItem(type, profilename);
			}else{
				common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, 'Cancelled the "Remove Certificate"');
			}
		});

	};

	var removeDistributorItem = function(type, profilename){
		logger.info(moduleName, '================Remove a Distributor Certificate');

		var succMsg = 'Remove Distributor Certificate successful';

		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var newContent = '';
			var nextName = getNextProfileItem(profilename);
			var strRemoveBegin = profileContent.indexOf('<profile name=\"'+profilename+'\">');
			var strNextItemBegin = '';
			if(nextName !=''){ // Next profile Item exist
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}else{ //The item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			var profileItemContent = profileContent.substring(strRemoveBegin, strNextItemBegin);

			var modifiedItemContent = '';

			if(type == 'distributor1'){
				var firstProfileItem = profileItemContent.indexOf('<profileitem ca=');

				var profileItemCAStart = profileItemContent.indexOf('<profileitem ca=', firstProfileItem + 10);
				var profileItemEnd = profileItemContent.indexOf('<profileitem ca=', profileItemCAStart + 10);

				modifiedItemContent = profileItemContent.substring(0, profileItemCAStart-1) + profileItemContent.substring(profileItemEnd-1, profileItemEnd+32) + '1' + profileItemContent.substring(profileItemEnd+33, profileItemContent.indexOf('</profile>')) +
				'<profileitem ca=\"\" distributor=\"2\" key=\"\" password=\"xmEcrXPl1ss=\" rootca=\"\"/>\n' + '</profile>\n';

			}else if(type == 'distributor2'){
				var keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
				var passStartStr = profileItemContent.lastIndexOf('password=');
				var caStartStr = profileItemContent.lastIndexOf('rootca=');

				modifiedItemContent = profileItemContent.substring(0, keyStartStr+21) + '' + profileItemContent.substring(passStartStr - 2, passStartStr +10) + 'xmEcrXPl1ss=' + profileItemContent.substring(caStartStr-2 ,profileItemContent.length);
			}

			newContent = profileContent.substring(0,strRemoveBegin) + modifiedItemContent + profileContent.substring(strNextItemBegin,profileContent.length);

			fs.writeFileSync(profilePath, newContent);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, succMsg);

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}

	};

	var modifyProfileItem = function(label, type, profilename, keyPath, password){
		logger.info(moduleName, '================Modify a profile item');

		var succMsg = 'Change Certificate successful';
		var encrytPass = p12ToPem.encryptPassword(password);
		if(fs.existsSync(profilePath)){
			var profileContent = fs.readFileSync(profilePath);
			profileContent = profileContent.toString();
			var newContent = '';
			var nextName = getNextProfileItem(profilename);
			var strRemoveBegin = profileContent.indexOf('<profile name=\"'+profilename+'\">');
			var strNextItemBegin = '';
			if(nextName !=''){ // Next profile Item exist
				strNextItemBegin = profileContent.indexOf('<profile name=\"'+nextName+'\">');
			}else{ //The remove item is the last Item
				strNextItemBegin = profileContent.indexOf('</profiles>');
			}

			var profileItemContent = profileContent.substring(strRemoveBegin, strNextItemBegin);

			var keyStartStr = '';
			var passStartStr = '';
			var caStartStr = '';
			if( label == 'Change Certificate'){

				if(type == 'author'){
					keyStartStr = profileItemContent.indexOf('distributor=\"0\"');
					passStartStr = profileItemContent.indexOf('password=');
					caStartStr = profileItemContent.indexOf('rootca=');
				}else if(type == 'distributor1'){
					keyStartStr = profileItemContent.indexOf('distributor=\"1\"');
					passStartStr = profileItemContent.indexOf('password=' ,keyStartStr);
					caStartStr = profileItemContent.indexOf('rootca=', passStartStr);

				}else if(type == 'distributor2'){
					keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
					passStartStr = profileItemContent.lastIndexOf('password=');
					caStartStr = profileItemContent.lastIndexOf('rootca=');
				}

			}else if( label == 'Add Distributor Certificate'){
				succMsg = 'Add Distributor Certificate successful';
				keyStartStr = profileItemContent.indexOf('distributor=\"2\"');
				passStartStr = profileItemContent.lastIndexOf('password=');
				caStartStr = profileItemContent.lastIndexOf('rootca=');
			}

			var subString1 = profileItemContent.substring(0, keyStartStr+21);
			var subString2 = profileItemContent.substring(passStartStr - 2, passStartStr +10);
			var subString3 = profileItemContent.substring(caStartStr-2 ,profileItemContent.length);

			var modifiedItemContent = subString1 + keyPath + subString2 + encrytPass + subString3;


			newContent = profileContent.substring(0,strRemoveBegin) + modifiedItemContent + profileContent.substring(strNextItemBegin,profileContent.length);

			fs.writeFileSync(profilePath, newContent);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.INFO, succMsg);

		}else{
			var waringMsg = 'The ' + profilePath + ' is not exist' ;
			logger.warning(moduleName, waringMsg);
			common.showMsgOnWindow(common.ENUM_WINMSG_LEVEL.WARNING, waringMsg);
		}
	};

	var detailCertificateInfo = function(certPath,password){
		var certificateTip = 'The certificate Info is below ';
		options = {
			placeHolder: certificateTip,
			ignoreFocusOut: true
		};

		var expirationDate = '';
		var issuerName = '';
		var parseInfo = p12ToPem.getCertificateInfo(certPath, password);
		if(parseInfo){
			expirationDate = parseInfo.afterYear;
			issuerName = parseInfo.issuerName;
		}
		var	choices = [
			{ label: 'Identity: ' +path.basename(certPath, '.p12')},
			{ label: 'Expiration Date: ' +expirationDate},
			{ label: 'Issuer: ' +issuerName},
			{ label: 'Key file location: ' +certPath}

		];
		vscode.window.showQuickPick(choices, options);

	};

	var searchProfileItem = function(selectedname){
		logger.info(moduleName, '================Load Profile');
		var authorFile= '';
		var authorPassword = '';

		var distributorFile1 = '';
		var distributorPassword1 = '';
		var distributorFile2= '';
		var distributorPassword2 = '';

		if(fs.existsSync(profilePath)){
			logger.info(moduleName, 'Profile file path:'+profilePath);
			var data = fs.readFileSync(profilePath,'utf-8');

			//parse profiles.xml file to get author and distributor p12 certificate file
			parseString(data,{ explicitArray : false}, function(err,result){
				var jsonData = JSON.stringify(result);
				var jsonArray = JSON.parse(jsonData);

				var profiles = jsonArray.profiles.profile;
				var profileItems ;
				if(profiles && (!profiles.length)){ //For only one profile case
					profileItems = profiles.profileitem;

				}else if(profiles && profiles.length){ //For multiple profile case

					for(var i = 0; i<profiles.length;i++){
						var name = profiles[i].$.name;
						console.log('name:'+name);
						if(selectedname == name){
							profileItems = profiles[i].profileitem;
						}

					}
				}else{
					return false;
				}

				if(typeof(profileItems) != 'undefined' && profileItems.length>2){

					authorFile = profileItems[0].$.key;
					distributorFile1 = profileItems[1].$.key;
					authorPassword = profileItems[0].$.password;
					distributorPassword1 = profileItems[1].$.password;
					distributorFile2 = profileItems[2].$.key;
					distributorPassword2 = profileItems[2].$.password;
					//return {authorFile, authorPassword, distributorFile1, distributorPassword1, distributorFile2, distributorPassword2};
					//return 'abcd';

				}else{
					return false;
				}

			});
		}else{
			return false;
		}
		return {authorFile, authorPassword, distributorFile1, distributorPassword1, distributorFile2, distributorPassword2};
    };

	var getNextProfileItem =function(name){
		var nextName = '';
		var profileNames = getProfileItems().nameArray;
		if(profileNames && profileNames.length>0){
			for(var i = 0; i< profileNames.length;i++){
				if(name == profileNames[i] ){
					if(i<profileNames.length-1){
						nextName = profileNames[i+1];
					}
					break;
				}
			}
		}
		return nextName;
	};

	return {
        // Handle 'Run on TV' command
        handleCommand:function() {
            logger.info(moduleName, '==============================Certificate Manager start!');
			distributorSigner = __dirname + '/resource/certificate-generator/certificates/distributor/tizen-distributor-signer.p12';
			distributorSignerPassword = 'tizenpkcs12passfordsigner';

			profileName = '';
			authorCertPath = '';
			authorPassword = '';
			authorCertName = '';

			countryInfo = '';
			stateInfo = '';
			cityInfo = '';
			organizationInfo = '';
			DepartmentInfo = '';
			EmailInfo = '';

			authorFlag = 'create';
			activeFlag = false ;

			showAllFeatures();
        }
	};
})();
module.exports = certificateManager;
