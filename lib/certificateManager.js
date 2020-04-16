const { StepController } = require('./inputStepController');
const importCertificate = require('./importCertificate');
const createTizenCertificate = require('./createTizenCertificate');

module.exports = async function certificateManager() {
	console.log('start certificateManager');
	let controller = new StepController();
	
    controller.addStep({
		title: 'Certificate Manager',
		items: ['Create Profile(Tizen)', 'Import Certificate', 'Remove Profile', 'Set Active Profile'].map(label => ({label}))
	});

	let res1 = await controller.start();
	let opt = res1[0];

	switch(opt) {
		case 'Create Profile(Tizen)':
			await createTizenCertificate();
			break;
		case 'Import Certificate':
			importCertificate();
			break;
		case 'Remove Profile':
			break;
		case 'Set Active Profile':
			break;
	}
}