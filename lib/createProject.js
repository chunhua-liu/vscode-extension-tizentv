const { fileURLToPath } = require('url');
const vscode = require('vscode');
const templateHelper = require('./templateHelper');
const projectHelper = require('./projectHelper');
const { StepController } = require('./inputStepController');
const { InputValidator } = require('./inputValidator');

module.exports = async function createProject() {
	let controller = new StepController();
	controller.addStep({
		title: 'Define Project Properties',
		totalSteps: 3,
		step: 1,
		placeholder: 'Select the project type',
		prompt: 'Select the project type',
		items: templateHelper.getTemplateList().map(label => ({label}))
	});

	controller.addStep({
		title: 'Define Project Properties',
		totalSteps: 3,
		step: 2,
		placeholder: 'Enter Project Name',
		prompt: 'Enter Project Name',
		validator: InputValidator.checkAppName
	});

	let folderBtn = StepController.FileBroswer;
	folderBtn.bindAction(async function(thisInput) {
		let folder = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true
		});
		if (folder) {
			thisInput.value = fileURLToPath(folder[0].toString(true));
		}
	});

	controller.addStep({
		title: 'Define Project Properties',
		totalSteps: 3,
		step: 3,
		placeholder: 'Enter Project Location',
		prompt: 'Enter Project Location',
		buttons: [folderBtn],
		validator: InputValidator.checkDirectory
	});

	let results = await controller.start();

	let template = results.shift();
	let projectName = results.shift();
	let projectLocation = results.shift();

	templateHelper.copyTemplate(template, projectLocation);
	projectHelper.initTVWebApp(projectName, projectLocation);

	await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectLocation));
} 


