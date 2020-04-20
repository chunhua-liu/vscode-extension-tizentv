const fs = require('fs');
const { StepController } = require('./inputStepController');
const importCertificate = require('./importCertificate');
const createTizenCertificate = require('./createTizenCertificate');
const profileEditor = require('./profileEditor');

async function setActiveProfile() {
    let controller = new StepController();
    let profileList = profileEditor.listProfile();

    controller.addStep({
        title: 'Set Active Profile',
	items: profileList.map(label => ({label}))
    });

    let result = await controller.start();
    profileEditor.activateProfile(result[0]);
}

async function removeProfile() {
	let controller = new StepController();
    let profileList = profileEditor.listProfile();

    controller.addStep({
        title: 'Remove Profile',
		items: profileList.map(label => ({label}))
    });

	let result = await controller.start();
	let keys = profileEditor.getProfileKeys(result[0]);
	fs.unlinkSync(keys[0]);
    profileEditor.removeProfile(result[0]);
}

module.exports = async function certificateManager() {
	let controller = new StepController();
	
    controller.addStep({
		title: 'Certificate Manager',
		items: ['Create Profile (Tizen)', 'Import Certificate', 'Remove Profile', 'Set Active Profile'].map(label => ({label}))
	});

	let res1 = await controller.start();
	let opt = res1[0];

	switch(opt) {
		case 'Create Profile (Tizen)':
			await createTizenCertificate();
			break;
		case 'Import Certificate':
			await importCertificate();
			break;
		case 'Remove Profile':
			await removeProfile();
			break;
		case 'Set Active Profile':
			await setActiveProfile();
			break;
	}
}