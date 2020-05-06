const { StepController } = require('./inputStepController');
const profileEditor = require('./profileEditor');

module.exports = async function setActiveProfile() {
    let controller = new StepController();
    let profileList = profileEditor.listProfile();
	
    controller.addStep({
        title: 'Set Active Profile',
		items: profileList.map(label => ({label}))
    });

    let result = await controller.start();
    profileEditor.activateProfile(result[0]);
}