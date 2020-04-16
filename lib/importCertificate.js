const vscode = require('vscode');
const fs = require('fs');
const { fileURLToPath } = require('url');
const { StepController } = require('./inputStepController');
const { InputValidator } = require('./inputValidator');
const checkP12Password = require('../p12ToPem').checkP12Password;

var certFileTemp = null;

function checkCertificateDir(certDir) {
	validatation = InputValidator.checkDirectory(certDir)
	if (validatation) {
		return validatation;
	}

	if (!fs.existsSync(certDir)) {
		return 'Certificate file not found.'
	}

	certFileTemp = certDir;
	return null;
}

function checkCertficatePassword(password) {
	if (checkP12Password(certFileTemp, password)) {
		return null;
	} else {
		return 'The password you entered is incorrect.';
	}
}

function importAuthorCertificate(controller, isOnly) {
	let folderBtn = StepController.FileBroswer;
	folderBtn.bindAction(async function(thisInput) {
		let folder = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false
		});
		thisInput.value = fileURLToPath(folder[0].toString(true));
	});

	controller.addStep({
		title:'Import Certificate - Author',
		totalSteps: isOnly == true ? 2 : 4 ,
		step: 1,
		prompt: 'Enter certificate file location',
		buttons: [folderBtn],
		validator: checkCertificateDir
	});

	controller.addStep({
		title:'Import Certificate - Author',
		totalSteps: isOnly == true ? 2 : 4 ,
		step: 2,
		prompt: 'Enter certificate file password',
		password: true,
		validator: checkCertficatePassword
	});
}

function importDistributorCertificate(controller, isOnly) {
	let folderBtn = StepController.FileBroswer;
	folderBtn.bindAction(async function(thisInput) {
		let folder = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: false
		});
		thisInput.value = fileURLToPath(folder[0].toString(true));
	});

	controller.addStep({
		title:'Import Certificate - Distributor',
		totalSteps: isOnly == true ? 2 : 4,
		step: isOnly == true ? 1 : 3,
		prompt: 'Enter certificate file location',
		buttons: [folderBtn],
		validator: checkCertificateDir
	});

	controller.addStep({
		title:'Import Certificate - Distributor',
		totalSteps: isOnly == true ? 2 : 4 ,
		step:  isOnly == true ? 2 : 4,
		prompt: 'Enter certificate file password',
		password: true,
		validator: checkCertficatePassword
	});
}

module.exports = async function importCertificate() {

	let controller = new StepController();
	
    controller.addStep({
		title: 'Import certificate profile',
		items: ['Author Certificate', 'Distributor Certificate', 'Author & Distributor Certificate'].map(label => ({label}))
	});

	let res1 = await controller.start();
	let item = res1[0]

	controller.reset();


	switch (item) {
		case 'Author Certificate':
			importAuthorCertificate(controller, true);
			break;
		case 'Distributor Certificate':
			importDistributorCertificate(controller, true);
			break;
		case 'Author & Distributor Certificate':
			importAuthorCertificate(controller, false);
			importDistributorCertificate(controller, false);
			break;
	}
	let res2 = await controller.start();

}