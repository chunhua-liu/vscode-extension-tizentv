const { StepController } = require('./inputStepController');
const certGenerator = require('./tizenCertificateGenerator');
const InputValidator = require('./inputValidator');

let passwordTemp = '';

function checkPassword(value) {
    if (value == undefined || value.length < 8) {
        return 'The password must contain at least 8 characters.';
    }

    passwordTemp = value;
    return null;
}

function confirmPassword(value) {
    if (value != passwordTemp) {
        return 'The passwords do not match.'
    }

    return null;
}

module.exports = async function createTizenCertificate() {
	let controller = new StepController();
	
    controller.addStep({
		title:'Create Certificate Profile',
		totalSteps: 6,
		step: 1,
		prompt: 'Enter profile name',
		validator: InputValidator.checkCertificateProfileName
    });
    
    controller.addStep({
		title:'Create Certificate Profile',
		totalSteps: 6,
		step: 2,
		prompt: 'Enter key filename',
		validator: InputValidator.checkCertificateFileName
    });
    
    controller.addStep({
		title:'Create Certificate Profile',
		totalSteps: 6,
		step: 3,
		prompt: 'Enter author name',
		validator: InputValidator.checkCertificateAuthorName
    });
    
    controller.addStep({
		title:'Create Certificate Profile',
		totalSteps: 6,
		step: 4,
		prompt: 'Enter password',
		password: true,
		validator: checkPassword
    });
    
    controller.addStep({
		title:'Create Certificate Profile',
		totalSteps: 6,
		step: 5,
		prompt: 'Confirm password',
		password: true,
		validator: confirmPassword
	});

    controller.addStep({
        title: 'Create Certificate Profile',
        totalSteps: 6,
		step: 6,
		items: ['Use default distributor certificate - Public privilege', 'Use default distributor certificate - Partner privilege'].map(label => ({label}))
    });
    
	let result = await controller.start();

	let privilege = result[5] == 'Use default distributor certificate - Public privilege' ? 'public' : 'partner';
    certGenerator.createCert(result[0], result[1], result[2], result[4], privilege);
}